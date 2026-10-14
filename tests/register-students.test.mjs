import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
test("trusted import verifies records and can be rerun without duplicate students",()=>{
 const dir=mkdtempSync(join(tmpdir(),"acsl-import-test-"));const file=join(dir,"synthetic.json");
 try{
 writeFileSync(file,JSON.stringify([{name:"Fixture One",email:"one@example.com",division:"Junior",grade:"9"},{name:"Fixture Two",email:"two@example.com",division:"Junior",grade:"10"}]),{mode:0o600});
 const script=`process.argv=['node','import',${JSON.stringify(file)}];await import('./scripts/register-students.mjs?first');await import('./scripts/register-students.mjs?second');`;
 const r=spawnSync(process.execPath,["--import","./tests/helpers/sheets-preload.mjs","--input-type=module","--eval",script],{encoding:"utf8",env:{...process.env,ACSL_SHEETS_WEBHOOK_URL:"https://script.google.com/macros/s/ACSL_TEST_ONLY_0123456789/exec",ACSL_SHEETS_TOKEN:"test-token-".repeat(4)}});
 assert.equal(r.status,0,r.stderr);assert.ok(r.stdout.includes("Verified 2 students: 2 added, 0 updated."));assert.ok(r.stdout.includes("Verified 2 students: 0 added, 2 updated."));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
