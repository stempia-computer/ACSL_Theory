import sys,json
from playwright.sync_api import sync_playwright,expect
base,teacher,student,other=sys.argv[1:]
def context(browser,cookie):
 c=browser.new_context();name,value=cookie.split('=',1);c.add_cookies([{'name':name,'value':value,'url':base}]);return c
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 tc=context(browser,teacher);page=tc.new_page();page.goto(base+'/dashboard')
 page.get_by_role('heading',name='Teacher Dashboard',exact=True).wait_for()
 page.get_by_role('button',name='Milan',exact=True).click()
 page.get_by_role('heading',name='Milan · 학생 상세').wait_for()
 page.get_by_role('button',name='답안 보기',exact=True).click()
 page.get_by_role('region',name='Answer review').wait_for()
 page.get_by_label('오답만 보기').check()
 assert page.get_by_role('region',name='Answer review').locator('article').count()==13
 page.goto(base+'/students')
 # Paste a batch, retain a partial failure, then retry without duplicate writes.
 failed=[False]
 def intercept(route):
  if route.request.method=='POST':
   data=route.request.post_data_json
   if data.get('action')=='saveStudent' and data.get('data',{}).get('email')=='batch.two@example.com' and not failed[0]:
    failed[0]=True;route.fulfill(status=502,json={'error':'Temporary fixture failure'});return
  route.continue_()
 page.route('**/api/classroom',intercept)
 page.get_by_role('textbox',name='Student roster').fill('| **Batch One** | 9 | batch.one@example.com |\n| **Batch Two** | 10 | batch.two@example.com |')
 page.get_by_role('button',name='명단 확인',exact=True).click()
 page.get_by_text('2명 · Junior',exact=True).wait_for()
 page.get_by_role('button',name='명단 등록',exact=True).click()
 page.get_by_text('새로 등록 1명 · 기존 계정 0명 · 확인 실패 1명',exact=False).wait_for()
 page.get_by_role('button',name='명단 등록',exact=True).click()
 page.get_by_text('새로 등록 1명 · 기존 계정 1명 · 확인 실패 0명',exact=True).wait_for()
 page.get_by_role('button',name='명단 등록',exact=True).click()
 page.get_by_text('새로 등록 0명 · 기존 계정 2명 · 확인 실패 0명',exact=True).wait_for()
 page.unroute('**/api/classroom',intercept)
 page.get_by_label('Name · 이름').fill('Browser Student')
 page.get_by_label('Email · 이메일').fill('browser@example.com')
 page.get_by_label('Division',exact=True).select_option('Senior')
 page.get_by_label('Grade · 학년').select_option('10')
 page.get_by_role('button',name='등록',exact=True).click()
 page.get_by_text('저장했습니다.',exact=True).wait_for()
 page.get_by_role('cell',name='Browser Student',exact=True).wait_for()
 page.get_by_role('textbox',name='Search members').fill('Browser Student')
 page.get_by_role('button',name='수정',exact=True).click()
 page.get_by_label('Grade · 학년').select_option('11')
 page.get_by_role('button',name='변경 저장',exact=True).click()
 page.get_by_text('저장했습니다.',exact=True).wait_for()
 expect(page.get_by_role('cell',name='11',exact=True)).to_be_visible()
 page.goto(base+'/teachers')
 page.get_by_label('Name · 이름').fill('Browser Teacher');page.get_by_label('Email · 이메일').fill('browserteacher@example.com');page.get_by_role('button',name='등록',exact=True).click();page.get_by_role('cell',name='Browser Teacher',exact=True).wait_for()
 sc=context(browser,student);sp=sc.new_page();sp.goto(base+'/assignments')
 expect(sp.get_by_role('link',name='Teachers',exact=True)).to_have_count(0)
 expect(sp.get_by_role('link',name='Junior · Computer Number Systems · Part 1',exact=False)).to_have_count(1)
 expect(sp.get_by_role('link',name='Senior · Computer Number Systems · Part 1',exact=False)).to_have_count(0)
 sp.get_by_role('link',name='Junior · Computer Number Systems · Part 1',exact=False).click()
 sp.get_by_role('textbox',name='Answer to question 1',exact=True).fill('0')
 sp.get_by_role('button',name='Submit and see score',exact=True).click();sp.get_by_role('button',name='빈 답안 포함 제출',exact=True).click()
 sp.get_by_text('제출과 서버 저장이 완료되었습니다.',exact=False).wait_for()
 sp.get_by_label('오답만 보기').check();sp.get_by_text('원본 문제와 해설 보기',exact=True).first.click()
 expect(sp.get_by_role('img',name='solution 1',exact=True)).to_be_visible()
 sp.goto(base+'/scores');expect(sp.get_by_role('button',name='답안 보기',exact=True)).to_have_count(2)
 oc=context(browser,other);op=oc.new_page();op.set_viewport_size({'width':390,'height':844});op.goto(base+'/scores')
 op.get_by_text('아직 제출된 답안이 없습니다.',exact=True).wait_for()
 assert 'Milan' not in op.locator('body').inner_text()
 assert op.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 op.get_by_role('button',name='로그아웃',exact=True).click();op.wait_for_url('**/login')
 op.goto(base+'/scores');op.wait_for_url('**/login')
 browser.close()
 print('PASS browser: bulk registration/partial failure/retry/deduplication, roster registration/edit, teacher addition, student details/wrong answers, division assignments, submission/review, cross-account privacy, mobile, logout')
