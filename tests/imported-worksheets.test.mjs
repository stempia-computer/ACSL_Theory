import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import packets from '../src/data/imported-worksheets.json' with {type:'json'};
import {gradeAnswer} from '../src/lib/worksheet-grading.ts';
import {prepareSheetSubmission} from '../src/lib/sheet-submission.ts';

test('21 paired PDF sources preserve 579 distinct questions and reviewed grading rules',()=>{
 assert.equal(packets.length,21);
 const qs=packets.flatMap(p=>p.questions);
 assert.equal(qs.length,579);assert.equal(new Set(qs.map(q=>q.id)).size,579);
 for(const p of packets){
  for(const type of ['problem','solution']) assert.equal(createHash('sha256').update(readFileSync(new URL('../public'+p[type+'Pdf'],import.meta.url))).digest('hex'),p[type+'Sha256']);
  const middle=Math.ceil(p.questions.length/2);
  assert.equal(new Set([...p.questions.slice(0,middle),...p.questions.slice(middle)].map(q=>q.id)).size,p.questions.length);
  for(const q of p.questions){
   assert.ok(q.page>0);
   if(q.mode==='manual'){assert.equal(q.answer,'');assert.equal(gradeAnswer(q,'student response'),null);}
   else {assert.equal(gradeAnswer(q,q.answer),true,q.id);assert.equal(gradeAnswer(q,'wrong answer'),false,q.id);}
  }
 }
 const strings=packets.find(p=>p.id==='worksheet-senior-03');
 assert.deepEqual(strings.questions.slice(-3).map(q=>q.sourceNumber),[4,8,12]);
 assert.deepEqual(strings.questions.slice(-3).map(q=>q.number),[13,14,15]);
});
const rule=(mode,answer)=>({mode,answer,aliases:[],base:null});
test('Lisp preserves atom and list boundaries while accepting quote/whitespace/case',()=>{
 assert.equal(gradeAnswer(rule('lisp','(A (1 2))'),"'( a (1  2))"),true);
 assert.equal(gradeAnswer(rule('lisp','(1 2)'),'(12)'),false);
 assert.equal(gradeAnswer(rule('lisp','2'),'(2)'),false);
});
test('truth tuples and bit masks compare exact expanded sets, not wildcard matches',()=>{
 assert.equal(gradeAnswer(rule('tuples','(1,1,0) (1,1,1)'),'(1,1,*)'),true);
 assert.equal(gradeAnswer(rule('tuples','(1,1,0) (1,1,1)'),'(1,*,*)'),false);
 assert.equal(gradeAnswer(rule('tuples','(1,1,0)'),'(1,1,0) nonsense'),false);
 assert.equal(gradeAnswer(rule('bitpattern','01*'),'010,011'),true);
 assert.equal(gradeAnswer(rule('bitpattern','01*'),'010'),false);
 assert.equal(gradeAnswer(rule('bitpattern','01*'),'*************'),false);
});
test('unverified keys are pending, never automatically wrong or correct',()=>{
 const q={...rule('manual',''),id:'q1',number:1};
 const submission=prepareSheetSubmission({id:'00000000-0000-4000-8000-000000000001',student:'Test',submittedAt:'2026-11-08T00:00:00Z',assignmentId:'a',answers:{q1:'ABC'}},[{id:'a',title:'A',division:'senior',questionIds:['q1']}],[q]);
 assert.equal(submission.pendingCount,1);assert.equal(submission.results[0].correct,null);assert.equal(submission.results[0].manualReview,true);
});
