import sys
from playwright.sync_api import sync_playwright,expect
base,teacher,student=sys.argv[1:]
def context(browser,cookie):
 c=browser.new_context(viewport={'width':1280,'height':950});n,v=cookie.split('=',1);c.add_cookies([{'name':n,'value':v,'url':base}]);return c
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 tc=context(b,teacher);page=tc.new_page();page.goto(base+'/assignment')
 page.get_by_label('Student division',exact=True).select_option('classroom')
 page.get_by_label('Material division',exact=True).select_option('intermediate')
 for contest,chapters in [(2,[4,5,6]),(3,[7,8,9]),(4,[10,11,12])]:
  page.get_by_label('Worksheet contest',exact=True).select_option('contest-'+str(contest))
  options=page.get_by_label('Problem set title',exact=True).locator('option')
  expect(options).to_have_count(4)
  assert [o.get_attribute('value') for o in options.all()][1:]==['worksheet-intermediate-'+str(n).zfill(2) for n in chapters]
  assert 'Sample Contest' not in options.all_text_contents()
 page.get_by_label('Worksheet contest',exact=True).select_option('contest-2')
 page.get_by_label('Problem set title',exact=True).select_option('worksheet-intermediate-05')
 page.get_by_label('Question range',exact=True).select_option('second')
 page.get_by_label('Assignment title',exact=True).fill('Classroom bit strings second half')
 page.get_by_label('Due date',exact=True).fill('2026-12-01')
 page.get_by_role('checkbox',name='Classroom worksheets · classroom-worksheets@example.com',exact=True).check()
 page.screenshot(path='/tmp/worksheet-catalog.png',full_page=False)
 page.get_by_role('button',name='Create and assign',exact=True).click()
 page.get_by_text('Assignment saved. Students can now open it in Assignments.',exact=True).wait_for()
 sc=context(b,student);sp=sc.new_page();sp.goto(base+'/assignment')
 sp.get_by_role('link',name='Classroom bit strings second half',exact=False).click()
 expect(sp.get_by_role('textbox',name='Answer to question 16',exact=True)).to_be_visible()
 expect(sp.get_by_role('textbox',name='Answer to question 1',exact=True)).to_have_count(0)
 sp.get_by_role('textbox',name='Answer to question 16',exact=True).fill('*101*')
 sp.get_by_role('button',name='Submit and see score',exact=True).click()
 sp.get_by_role('button',name='Submit with blank answers',exact=True).click()
 review=sp.get_by_role('region',name='Answer review');review.wait_for()
 expect(review.locator('article').first).to_contain_text('Correct')
 b.close()
 print('PASS catalog browser: nine C2–C4 worksheets, Classroom recipients, second half, submission and grading')
