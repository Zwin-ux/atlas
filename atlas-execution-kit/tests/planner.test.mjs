/** Planner-only tests. Synthetic receipts here are NEVER Atlas runtime evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import {loadBundle,validateBundle,topological,digest,taskFingerprint,descendants,analyze,validateReceipt,loadReceipts,gitContext,mermaid,receiptTemplate} from '../tools/atlas-plan.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=loadBundle(path.join(root,'graph/release-graph.json'));
const A='a'.repeat(40),B='b'.repeat(40),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const git={head:A,clean:true,isAncestor:c=>c===A};
const clone=()=>structuredClone(bundle);
const get=id=>bundle.graph.tasks.find(t=>t.id===id);
function syntheticRecord(t,deps={}) { const receipt={task_id:t.id,git:{commit:A},depends_on_receipts:deps};return{receipt,hash:digest(receipt)}; }
function recordsFor(ids,b=bundle) {
 const records=new Map(),wanted=new Set(ids);
 for(const t of topological(b.graph)) if(wanted.has(t.id)) records.set(t.id,syntheticRecord(t,Object.fromEntries(t.depends_on.map(d=>[d,records.get(d)?.hash??'0'.repeat(64)]))));
 return {records,issues:[]};
}
function through(id) {const ids=[];for(const t of topological(bundle.graph)){ids.push(t.id);if(t.id===id)break;}return ids;}
function temp(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-kit-test-'));try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function validReceipt(t,dir){
 const log='Synthetic test fixture only. Not Atlas application evidence.\n'; fs.mkdirSync(path.join(dir,'logs'),{recursive:true});fs.writeFileSync(path.join(dir,'logs','check.txt'),log);
 return {schema_version:1,task_id:t.id,verdict:'PASS',definition_sha256:taskFingerprint(bundle,t),recorded_at:'2026-09-10T00:00:00Z',executor:'test-builder',reviewer:'test-reviewer',git:{commit:A,integrated:true,clean_tree:true},depends_on_receipts:Object.fromEntries(t.depends_on.map(d=>[d,'0'.repeat(64)])),review:{verdict:'PASS',observation:'Synthetic review for helper test.',artifact_id:'test-log'},checks:[{id:'test-check',criteria:t.acceptance.map(a=>a.id),kind:'manual',status:'PASS',procedure:'Exercise synthetic receipt validator.',observer:'fixture-observer',observation:'Synthetic fixture present.',artifact_id:'test-log'}],artifacts:[{id:'test-log',path:'logs/check.txt',sha256:hash(log)}],...(t.mode==='human_gate'?{external_confirmation:{gate:t.human_gate,result:'CONFIRMED',actor:'fixture-human',scope:'Synthetic helper test only.',artifact_id:'test-log'}}:{})};
}

test('complete shipped graph and traceability validate',()=>assert.deepEqual(validateBundle(bundle),{tasks:37,edges:80,requirements:13,cases:64}));
test('duplicate task IDs are rejected',()=>{const b=clone();b.graph.tasks.push(b.graph.tasks[0]);assert.throws(()=>validateBundle(b),/duplicate/);});
test('unknown dependencies are rejected',()=>{const b=clone();b.graph.tasks[0].depends_on=['AT-999'];assert.throws(()=>validateBundle(b),/unknown dependency/);});
test('self-dependency rejected',()=>{const b=clone();b.graph.tasks[0].depends_on=['AT-001'];assert.throws(()=>validateBundle(b),/self dependency/);});
test('cycles are rejected',()=>{const b=clone();b.graph.tasks[0].depends_on=['AT-002'];assert.throws(()=>validateBundle(b),/cycle/);});
test('unknown QA references rejected',()=>{const b=clone();b.graph.tasks[0].case_ids.push('UNKNOWN');assert.throws(()=>validateBundle(b),/unknown QA/);});
test('lost requirement test coverage rejected',()=>{const b=clone();b.requirements[0].case_ids=[];assert.throws(()=>validateBundle(b),/no owner\/test coverage/);});
test('duplicate acceptance IDs rejected',()=>{const b=clone();b.graph.tasks[1].acceptance[0].id=b.graph.tasks[0].acceptance[0].id;assert.throws(()=>validateBundle(b),/Duplicate acceptance/);});
test('unsafe candidate write path rejected',()=>{const b=clone();b.graph.tasks[0].candidate_write_paths=['../escape'];assert.throws(()=>validateBundle(b),/unsafe/);});
test('human gate cannot masquerade as ordinary implementation',()=>{const b=clone();b.graph.tasks.find(t=>t.id==='AT-041').mode='implementation';assert.throws(()=>validateBundle(b),/human gate/);});
test('fresh queue starts only with orientation',()=>assert.deepEqual(analyze(bundle).proposed_batch.map(t=>t.task_id),['AT-001']));
test('initial batch after orientation respects coordinator and QA roles',()=>{const r=analyze(bundle,recordsFor(['AT-001']),{git});assert.deepEqual(r.proposed_batch.map(t=>t.task_id),['AT-003','AT-004']);});
test('receipts without Git applicability cannot unlock tasks',()=>{const r=analyze(bundle,recordsFor(['AT-001']));assert.equal(r.accepted.length,0);assert.match(r.stale_receipts[0].reasons[0],/--repo/);});
test('unknown active task rejected',()=>assert.throws(()=>analyze(bundle,undefined,{active:['AT-999']}),/active node/));
test('duplicate active task rejected',()=>assert.throws(()=>analyze(bundle,undefined,{active:['AT-001','AT-001']}),/active node/));
test('active assignment cannot ignore missing prerequisites',()=>assert.throws(()=>analyze(bundle,undefined,{active:['AT-020']}),/unaccepted prerequisites/));
test('conflicting coordinator tasks cannot run simultaneously',()=>assert.throws(()=>analyze(bundle,recordsFor(['AT-001']),{git,active:['AT-002','AT-003']}),/conflicting/));
test('active work consumes capacity and does not get re-dispatched',()=>{const r=analyze(bundle,recordsFor(['AT-001']),{git,active:['AT-003','AT-004']});assert.equal(r.proposed_batch.length,0);});
test('already accepted active assignment forces reconciliation',()=>assert.throws(()=>analyze(bundle,recordsFor(['AT-001']),{git,active:['AT-001']}),/already accepted/));
test('independent data/widget work can be proposed without overlapping locks',()=>{const r=analyze(bundle,recordsFor(['AT-001','AT-003','AT-004','AT-005','AT-006','AT-007']),{git});const flat=r.proposed_batch.flatMap(t=>t.locks);assert.equal(flat.length,new Set(flat).size);assert.ok(r.proposed_batch.filter(t=>t.mode==='implementation').length<=2);});
test('single implementer setting is respected',()=>{const b=clone();b.graph.limits.max_parallel_implementers=1;const r=analyze(b,recordsFor(['AT-001','AT-003','AT-004','AT-005','AT-006','AT-007']),{git});assert.ok(r.proposed_batch.filter(t=>t.mode==='implementation').length<=1);});
test('human-host gate never auto-dispatches',()=>{const r=analyze(bundle,recordsFor(through('AT-040')),{git});assert.ok(r.human_gates_ready.some(x=>x.task_id==='AT-041'));assert.ok(!r.proposed_batch.some(x=>x.task_id==='AT-041'));assert.equal(r.milestones.host_proven_candidate,false);});
test('ordinary evidence from ancestor can apply with impact-review caveat',()=>{const r=analyze(bundle,recordsFor(['AT-001']),{git:{head:B,clean:true,isAncestor:c=>c===A}});assert.deepEqual(r.accepted,['AT-001']);});
test('final proof is rejected on different HEAD',()=>{const r=analyze(bundle,recordsFor(through('AT-040')),{git:{head:B,clean:true,isAncestor:c=>c===A}});assert.ok(r.stale_receipts.some(x=>x.task_id==='AT-040'));assert.equal(r.milestones.local_candidate,false);});
test('final proof is rejected on dirty tracked tree',()=>{const r=analyze(bundle,recordsFor(through('AT-040')),{git:{...git,clean:false}});assert.ok(r.stale_receipts.some(x=>x.task_id==='AT-040'));});
test('non-ancestor evidence is rejected',()=>{const r=analyze(bundle,recordsFor(['AT-001']),{git:{...git,isAncestor:()=>false}});assert.equal(r.accepted.length,0);});
test('dependency receipt replacement invalidates downstream',()=>{const loaded=recordsFor(['AT-001','AT-003']);loaded.records.get('AT-001').hash='f'.repeat(64);const r=analyze(bundle,loaded,{git});assert.deepEqual(r.accepted,['AT-001']);assert.match(r.stale_receipts[0].reasons.join(' '),/receipt changed/);});
test('explicit invalidation reopens descendants',()=>{const r=analyze(bundle,recordsFor(['AT-001','AT-003']),{git,invalidate:['AT-001']});assert.equal(r.accepted.length,0);assert.equal(r.stale_receipts.length,2);});
test('impact traversal includes root and downstream final gates',()=>{const ids=descendants(bundle.graph,['AT-021']);assert.ok(ids.includes('AT-021')&&ids.includes('AT-041')&&ids.includes('AT-053'));assert.ok(!ids.includes('AT-001'));});
test('unknown impact root rejected',()=>assert.throws(()=>descendants(bundle.graph,['AT-999']),/Unknown task/));
test('definition fingerprint changes with acceptance content',()=>{const b=clone();const before=taskFingerprint(b,b.graph.tasks[0]);b.graph.tasks[0].acceptance[0].assertion+=' changed';assert.notEqual(before,taskFingerprint(b,b.graph.tasks[0]));});
test('definition fingerprint changes when related case changes',()=>{const b=clone();const before=taskFingerprint(b,b.graph.tasks[0]);b.cases.find(c=>c.id==='OPS-01').expected.push('new assertion');assert.notEqual(before,taskFingerprint(b,b.graph.tasks[0]));});
test('valid synthetic receipt validates with real hashed test artifacts',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);assert.equal(validateReceipt(bundle,t,r,dir).hash,digest(r));}));
test('tampered evidence artifact rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);fs.appendFileSync(path.join(dir,'logs/check.txt'),'tamper');assert.throws(()=>validateReceipt(bundle,t,r,dir),/hash mismatch/);}));
test('missing artifact rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);fs.unlinkSync(path.join(dir,'logs/check.txt'));assert.throws(()=>validateReceipt(bundle,t,r,dir));}));
test('evidence traversal rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);r.artifacts[0].path='../escape';assert.throws(()=>validateReceipt(bundle,t,r,dir),/Unsafe evidence path/);}));
test('evidence symlink escaping root rejected',{skip:process.platform==='win32'?'Symlink privilege is not assumed on Windows; exercised in Linux kit validation.':false},()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);const elsewhere=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-outside-'));try{fs.writeFileSync(path.join(elsewhere,'secret'),'not for reading');fs.symlinkSync(path.join(elsewhere,'secret'),path.join(dir,'escape'));r.artifacts[0].path='escape';assert.throws(()=>validateReceipt(bundle,t,r,dir),/escapes root/);}finally{fs.rmSync(elsewhere,{recursive:true,force:true});}}));
test('self-reviewed receipt rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);r.reviewer=r.executor;assert.throws(()=>validateReceipt(bundle,t,r,dir),/Independent reviewer/);}));
test('non-PASS template is never evidence',()=>temp(dir=>assert.throws(()=>validateReceipt(bundle,get('AT-001'),receiptTemplate(bundle,get('AT-001')),dir),/not an accepted PASS/)));
test('missing acceptance coverage rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);r.checks[0].criteria.pop();assert.throws(()=>validateReceipt(bundle,t,r,dir),/no passed evidence/);}));
test('changed task definition rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);r.definition_sha256='0'.repeat(64);assert.throws(()=>validateReceipt(bundle,t,r,dir),/definition/);}));
test('mismatched command exit rejected',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);Object.assign(r.checks[0],{kind:'command',command:'test',cwd:dir,exit_code:1,expected_exit_code:0});assert.throws(()=>validateReceipt(bundle,t,r,dir),/exit/);}));
test('arbitrary successful node cannot expect nonzero exit',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);Object.assign(r.checks[0],{kind:'command',command:'test',cwd:dir,exit_code:1,expected_exit_code:1});assert.throws(()=>validateReceipt(bundle,t,r,dir),/Only baseline/);}));
test('baseline inventory may document expected red check',()=>temp(dir=>{const t=get('AT-003'),r=validReceipt(t,dir);Object.assign(r.checks[0],{kind:'command',command:'test',cwd:dir,exit_code:1,expected_exit_code:1});assert.ok(validateReceipt(bundle,t,r,dir));}));
test('human gate requires external confirmation artifact',()=>temp(dir=>{const t=get('AT-041'),r=validReceipt(t,dir);delete r.external_confirmation;assert.throws(()=>validateReceipt(bundle,t,r,dir),/External\/human/);}));
test('duplicate task receipts rejected rather than picking latest',()=>temp(dir=>{const t=get('AT-001'),r=validReceipt(t,dir);fs.writeFileSync(path.join(dir,'a.json'),JSON.stringify(r));fs.writeFileSync(path.join(dir,'b.json'),JSON.stringify(r));const loaded=loadReceipts(bundle,dir);assert.equal(loaded.records.size,0);assert.match(loaded.issues[0].error,/Duplicate/);}));
test('receipt directory missing is explicit failure',()=>assert.throws(()=>loadReceipts(bundle,path.join(os.tmpdir(),'nonexistent-atlas-receipts-'+Date.now())),/does not exist/));
test('canonical receipt hash is property-order insensitive',()=>assert.equal(digest({b:2,a:1}),digest({a:1,b:2})));
test('Mermaid includes all nodes and edges',()=>{const m=mermaid(bundle);assert.equal((m.match(/ --> /g)||[]).length,80);assert.ok(m.includes('AT_001')&&m.includes('AT_053'));});
test('CLI fails closed on unknown command',()=>{const r=spawnSync(process.execPath,[path.join(root,'tools/atlas-plan.mjs'),'launch-all'],{encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/Unknown command/);});
test('CLI validates independently of working directory',()=>{const r=spawnSync(process.execPath,[path.join(root,'tools/atlas-plan.mjs'),'validate'],{cwd:os.tmpdir(),encoding:'utf8'});assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).valid,true);});
test('Git adapter tests real ancestry and tracked dirty state',()=>temp(dir=>{
 const run=args=>{const p=spawnSync('git',['-C',dir,...args],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);return p.stdout.trim();};
 run(['init','-q']);run(['config','user.name','Kit Test']);run(['config','commit.gpgsign','false']);fs.mkdirSync(path.join(dir,'empty-hooks'));run(['config','core.hooksPath',path.join(dir,'empty-hooks')]);run(['config','user.email','kit-test@example.invalid']);fs.writeFileSync(path.join(dir,'fixture.txt'),'one');run(['add','fixture.txt']);run(['commit','-qm','fixture one']);const first=run(['rev-parse','HEAD']);
 fs.writeFileSync(path.join(dir,'fixture.txt'),'two');run(['commit','-qam','fixture two']);let g=gitContext(dir);assert.equal(g.clean,true);assert.equal(g.isAncestor(first),true);assert.equal(g.isAncestor(A),false);
 fs.writeFileSync(path.join(dir,'fixture.txt'),'dirty');g=gitContext(dir);assert.equal(g.clean,false);
}));

test('declared blocked root is not repeatedly proposed',()=>{const r=analyze(bundle,undefined,{blocked:['AT-001']});assert.equal(r.proposed_batch.length,0);assert.deepEqual(r.declared_blocked,['AT-001']);});
test('unknown declared blocker rejected',()=>assert.throws(()=>analyze(bundle,undefined,{blocked:['AT-999']}),/blocked node/));
test('blocked prerequisite invalidates existing acceptance',()=>{const r=analyze(bundle,recordsFor(['AT-001','AT-003']),{git,blocked:['AT-001']});assert.equal(r.accepted.length,0);assert.equal(r.proposed_batch.length,0);});
test('task cannot be active and blocked simultaneously',()=>assert.throws(()=>analyze(bundle,undefined,{active:['AT-001'],blocked:['AT-001']}),/both active and blocked/));
