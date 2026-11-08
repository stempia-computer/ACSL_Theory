import sys
from playwright.sync_api import sync_playwright, expect
base, teacher, student, regex_id = sys.argv[1:]
def context(browser, cookie):
 c=browser.new_context(viewport={'width':1280,'height':900});name,value=cookie.split('=',1)
 c.add_cookies([{'name':name,'value':value,'url':base}]);return c
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 sc=context(browser,student);sp=sc.new_page();errors=[]
 sp.on('pageerror',lambda error:errors.append(str(error)))
 sp.goto(base+'/assignments/'+regex_id)
 expect(sp.locator('iframe')).to_have_count(1)
 section=sp.locator('section').filter(has=sp.get_by_role('heading',name='Question 2',exact=True))
 for option in ['B','C','D','F']: section.get_by_role('checkbox',name=option,exact=True).check()
 sp.get_by_role('button',name='Submit and see score',exact=True).click()
 sp.get_by_role('button',name='Submit with blank answers',exact=True).click()
 review=sp.get_by_role('region',name='Answer review');review.wait_for()
 expect(review.locator('article').nth(1)).to_contain_text('Correct')
 expect(review.get_by_role('button',name='Mark correct',exact=True)).to_have_count(0)
 tc=context(browser,teacher);tp=tc.new_page();tp.goto(base+'/scores')
 row=tp.get_by_role('row').filter(has=tp.get_by_role('cell',name='Digital electronics',exact=True)).first
 row.get_by_role('button').click()
 tr=tp.get_by_role('region',name='Answer review');tr.wait_for()
 expect(tr).to_contain_text('pending review (provisional)')
 tr.get_by_role('button',name='Mark correct',exact=True).first.click()
 expect(tr).to_contain_text('Reviewed by: wonup2@gmail.com')
 tp.screenshot(path='/tmp/worksheet-review.png',full_page=False)
 assert not errors,errors
 browser.close()
 print('PASS worksheet browser: multiple choice, submit, student privacy, provisional scores, teacher grading')
