#!/usr/bin/env node
/**
 * Read-only Atlas task/evidence planner. No dependencies, network, task execution,
 * agent spawning, writes, deployment, or automatic permission changes.
 * Receipt checks establish structure/integrity, NOT the truth of observations.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GRAPH = path.resolve(HERE, '../graph/release-graph.json');
const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const text = v => typeof v === 'string' && v.trim().length > 0;
const unique = xs => new Set(xs).size === xs.length;
const need = (ok, message) => { if (!ok) throw new Error(message); };
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const digest = value => crypto.createHash('sha256').update(canonical(value)).digest('hex');
const bytesDigest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function readJson(file) {
  const stat = fs.statSync(file);
  need(stat.isFile() && stat.size <= 8 * 1024 * 1024, `Not a bounded JSON file: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}
export function loadBundle(file = DEFAULT_GRAPH) {
  const graphFile = path.resolve(file), graph = readJson(graphFile);
  need(text(graph.requirements_file) && text(graph.cases_file), 'Graph needs requirement/case file references');
  const requirements = readJson(path.resolve(path.dirname(graphFile), graph.requirements_file)).requirements;
  const cases = readJson(path.resolve(path.dirname(graphFile), graph.cases_file)).cases;
  const bundle = { graph, requirements, cases, graphFile };
  validateBundle(bundle);
  return bundle;
}
export function topological(graph) {
  const ids = new Set(graph.tasks.map(t => t.id)), done = new Set(), result = [];
  for (const task of graph.tasks) for (const d of task.depends_on) need(ids.has(d), `${task.id}: unknown dependency ${d}`);
  while (result.length < graph.tasks.length) {
    const ready = graph.tasks.filter(t => !done.has(t.id) && t.depends_on.every(d => done.has(d))).sort((a,b) => a.id.localeCompare(b.id));
    need(ready.length > 0, 'Dependency cycle detected');
    for (const task of ready) { result.push(task); done.add(task.id); }
  }
  return result;
}
export function validateBundle({ graph, requirements, cases }) {
  need(graph.schema_version === 1 && text(graph.contract_version), 'Unsupported graph version');
  need(Array.isArray(graph.tasks) && graph.tasks.length > 0, 'Empty task graph');
  need(Array.isArray(requirements) && Array.isArray(cases), 'Missing requirements/cases');
  for (const [name, list] of [['tasks',graph.tasks],['requirements',requirements],['cases',cases]]) {
    need(list.every(x => x && text(x.id)) && unique(list.map(x => x.id)), `Invalid/duplicate ${name} IDs`);
  }
  const ts = new Map(graph.tasks.map(t=>[t.id,t])), rs = new Map(requirements.map(r=>[r.id,r])), cs = new Map(cases.map(c=>[c.id,c]));
  need(Number.isInteger(graph.limits?.max_active_children) && graph.limits.max_active_children > 0, 'Invalid active-child limit');
  need(Number.isInteger(graph.limits?.max_parallel_implementers) && graph.limits.max_parallel_implementers > 0 && graph.limits.max_parallel_implementers <= graph.limits.max_active_children, 'Invalid implementer limit');
  const criteria = [];
  for (const t of graph.tasks) {
    need(/^AT-\d{3}$/.test(t.id) && text(t.title) && text(t.objective), `${t.id}: missing task identity/outcome`);
    for (const k of ['depends_on','exclusive_locks','candidate_write_paths','requirements','case_ids']) need(Array.isArray(t[k]) && t[k].every(text) && unique(t[k]), `${t.id}: invalid ${k}`);
    need(!t.depends_on.includes(t.id), `${t.id}: self dependency`);
    need(['lead','data','widget','qa','release'].includes(t.role), `${t.id}: invalid role`);
    need(['implementation','verification','coordination','human_gate'].includes(t.mode), `${t.id}: invalid mode`);
    need(['release','publish','advisory'].includes(t.scope), `${t.id}: invalid scope`);
    need(['ancestor_with_impact_review','exact_head'].includes(t.proof_policy), `${t.id}: invalid proof policy`);
    need(Number.isInteger(t.priority) && t.priority >= 0, `${t.id}: invalid priority`);
    need(t.review_required === true, `${t.id}: review requirement missing`);
    need((t.mode === 'human_gate') === text(t.human_gate), `${t.id}: human gate/mode mismatch`);
    need(t.candidate_write_paths.every(p => !path.isAbsolute(p) && !/^[a-zA-Z]:/.test(p) && !p.split(/[\\/]/).includes('..')), `${t.id}: unsafe candidate path`);
    need(Array.isArray(t.acceptance) && t.acceptance.length > 0 && t.acceptance.every(a=>text(a.id)&&text(a.assertion)), `${t.id}: missing acceptance`);
    criteria.push(...t.acceptance.map(a=>a.id));
    need(t.requirements.length > 0 && t.requirements.every(id=>rs.has(id)), `${t.id}: unknown/empty requirements`);
    need(t.case_ids.every(id=>cs.has(id)), `${t.id}: unknown QA case`);
    for (const id of t.requirements) need(rs.get(id).task_ids.includes(t.id), `${t.id}: requirement reciprocal link missing`);
    for (const id of t.case_ids) need(cs.get(id).task_ids.includes(t.id), `${t.id}: case reciprocal link missing`);
  }
  need(unique(criteria), 'Duplicate acceptance criterion IDs');
  for (const r of requirements) {
    need(text(r.goal) && r.task_ids?.length && r.case_ids?.length, `${r.id}: no owner/test coverage`);
    need(unique(r.task_ids) && unique(r.case_ids), `${r.id}: duplicate traceability link`);
    for (const id of r.task_ids) need(ts.has(id) && ts.get(id).requirements.includes(r.id), `${r.id}: task link missing`);
    for (const id of r.case_ids) need(cs.has(id) && cs.get(id).requirements.includes(r.id), `${r.id}: case link missing`);
  }
  for (const c of cases) {
    need(c.task_ids?.length && c.requirements?.length && c.steps?.length && c.expected?.length, `${c.id}: incomplete acceptance case`);
    need(unique(c.task_ids) && unique(c.requirements), `${c.id}: duplicate link`);
    for (const id of c.task_ids) need(ts.has(id) && ts.get(id).case_ids.includes(c.id), `${c.id}: task reciprocal link missing`);
    for (const id of c.requirements) need(rs.has(id) && rs.get(id).case_ids.includes(c.id), `${c.id}: requirement link missing`);
  }
  for (const [name, ids] of Object.entries(graph.milestones ?? {})) need(Array.isArray(ids) && ids.length && ids.every(id=>ts.has(id)), `Invalid milestone ${name}`);
  topological(graph);
  return { tasks: graph.tasks.length, edges: graph.tasks.reduce((n,t)=>n+t.depends_on.length,0), requirements: requirements.length, cases: cases.length };
}
export function taskFingerprint(bundle, task) {
  return digest({ contract: bundle.graph.contract_version, authority: bundle.graph.authority, repository: bundle.graph.target_repository, task,
    requirements: bundle.requirements.filter(r=>task.requirements.includes(r.id)), cases: bundle.cases.filter(c=>task.case_ids.includes(c.id)) });
}
export function descendants(graph, ids) {
  const known = new Set(graph.tasks.map(t=>t.id)), affected = new Set(ids);
  for (const id of ids) need(known.has(id), `Unknown task ${id}`);
  let changed = true;
  while(changed) { changed = false; for (const t of graph.tasks) if (!affected.has(t.id) && t.depends_on.some(d=>affected.has(d))) { affected.add(t.id); changed = true; } }
  return [...affected].sort();
}
function safeArtifact(root, rel) {
  need(text(rel) && !path.isAbsolute(rel) && !/^[a-zA-Z]:/.test(rel) && !rel.includes('\\') && !rel.split('/').includes('..'), `Unsafe evidence path: ${rel}`);
  const base = fs.realpathSync(root), resolved = fs.realpathSync(path.resolve(base, rel)), relative = path.relative(base, resolved);
  need(relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `Evidence escapes root: ${rel}`);
  need(fs.statSync(resolved).isFile(), `Evidence is not a file: ${rel}`);
  return resolved;
}
export function validateReceipt(bundle, task, receipt, root) {
  need(receipt.schema_version === 1 && receipt.task_id === task.id, 'Receipt identity/version mismatch');
  need(receipt.verdict === 'PASS', 'Receipt is not an accepted PASS');
  need(receipt.definition_sha256 === taskFingerprint(bundle,task), 'Task definition/related acceptance changed');
  need(text(receipt.executor) && text(receipt.reviewer) && receipt.executor !== receipt.reviewer, 'Independent reviewer identity required');
  need(receipt.review?.verdict === 'PASS' && text(receipt.review.observation), 'Missing passed review');
  need(COMMIT.test(receipt.git?.commit ?? '') && receipt.git.integrated === true && receipt.git.clean_tree === true, 'Need clean integrated full Git revision');
  need(text(receipt.recorded_at) && !Number.isNaN(Date.parse(receipt.recorded_at)), 'Receipt timestamp required');
  need(receipt.depends_on_receipts && typeof receipt.depends_on_receipts === 'object' && !Array.isArray(receipt.depends_on_receipts), 'Dependency receipt map required');
  need(Object.keys(receipt.depends_on_receipts).length === task.depends_on.length && task.depends_on.every(id=>SHA256.test(receipt.depends_on_receipts[id] ?? '')), 'Dependency receipt digests incomplete');
  need(Array.isArray(receipt.artifacts) && receipt.artifacts.length > 0, 'No evidence artifacts');
  const artifacts = new Map();
  for (const a of receipt.artifacts) {
    need(text(a.id) && !artifacts.has(a.id) && SHA256.test(a.sha256 ?? ''), 'Invalid/duplicate artifact');
    const full = safeArtifact(root,a.path);
    need(bytesDigest(fs.readFileSync(full)) === a.sha256, `Artifact hash mismatch: ${a.path}`);
    artifacts.set(a.id,a);
  }
  need(artifacts.has(receipt.review.artifact_id), 'Review artifact missing');
  need(Array.isArray(receipt.checks) && receipt.checks.length > 0, 'No checks');
  const covered = new Set(), ids = new Set(), expected = new Set(task.acceptance.map(a=>a.id));
  for (const check of receipt.checks) {
    need(text(check.id) && !ids.has(check.id), 'Invalid/duplicate check ID'); ids.add(check.id);
    need(check.status === 'PASS' && text(check.observation) && artifacts.has(check.artifact_id), 'Check outcome/evidence missing');
    need(Array.isArray(check.criteria) && check.criteria.length > 0, 'Check has no acceptance coverage');
    for (const id of check.criteria) { need(expected.has(id), `Unknown acceptance criterion ${id}`); covered.add(id); }
    if (check.kind === 'command') {
      need(text(check.command) && text(check.cwd) && Number.isInteger(check.exit_code) && Number.isInteger(check.expected_exit_code), 'Command check incomplete');
      need(check.exit_code === check.expected_exit_code, 'Command exit did not match expectation');
      need(check.exit_code === 0 || task.id === 'AT-003', 'Only baseline inventory can accept an expected nonzero command');
    } else {
      need(check.kind === 'manual' && text(check.procedure) && text(check.observer), 'Manual check incomplete');
    }
  }
  need([...expected].every(id=>covered.has(id)), 'Acceptance criterion has no passed evidence');
  if (task.mode === 'human_gate') {
    const e = receipt.external_confirmation;
    need(e?.gate === task.human_gate && e.result === 'CONFIRMED' && text(e.actor) && text(e.scope) && artifacts.has(e.artifact_id), 'External/human confirmation missing');
  }
  return { receipt, hash: digest(receipt) };
}
export function loadReceipts(bundle, directory) {
  const records = new Map(), issues = [];
  if (!directory) return { records, issues };
  const root = path.resolve(directory);
  need(fs.existsSync(root) && fs.statSync(root).isDirectory(), 'Receipt directory does not exist');
  const tasks = new Map(bundle.graph.tasks.map(t=>[t.id,t])), seen = new Set(), duplicated = new Set();
  for (const name of fs.readdirSync(root).filter(n=>n.endsWith('.json')).sort()) {
    let taskId = null;
    try {
      const file = safeArtifact(root,name), receipt = readJson(file); taskId = receipt.task_id;
      need(tasks.has(taskId), 'Unknown receipt task ID');
      if (seen.has(taskId)) { duplicated.add(taskId); records.delete(taskId); throw new Error('Duplicate task receipts: reconcile explicitly'); }
      seen.add(taskId);
      const record = validateReceipt(bundle,tasks.get(taskId),receipt,root);
      records.set(taskId,record);
    } catch (error) { issues.push({ file:name, task_id:taskId, error:error.message }); }
  }
  for (const id of duplicated) records.delete(id);
  return { records, issues };
}
export function gitContext(repo) {
  if (!repo) return null;
  const cwd = path.resolve(repo);
  function git(args) {
    const run = spawnSync('git',['-C',cwd,...args],{encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024,windowsHide:true});
    if (run.error) throw run.error;
    return run;
  }
  const headRun = git(['rev-parse','HEAD']); need(headRun.status===0, 'Cannot inspect Git HEAD');
  const head = headRun.stdout.trim(); need(COMMIT.test(head), 'Unsupported/missing full Git revision');
  const state = git(['status','--porcelain','--untracked-files=no']); need(state.status===0,'Cannot inspect tracked Git state');
  const cache = new Map();
  return { head, clean:state.stdout.trim()==='', isAncestor(commit) {
    if(!cache.has(commit)) cache.set(commit,git(['merge-base','--is-ancestor',commit,head]).status===0);
    return cache.get(commit);
  }};
}
function roleLock(task) { return ['lead','release'].includes(task.role) ? 'role:coordinator' : `role:${task.role}`; }
export function analyze(bundle, loaded = {records:new Map(),issues:[]}, {git=null,active=[],blocked=[],invalidate=[],scope='release'} = {}) {
  validateBundle(bundle);
  need(['release','all','publish','advisory'].includes(scope), 'Scope must be release, publish, advisory or all');
  const graph = bundle.graph, order = topological(graph), byId = new Map(order.map(t=>[t.id,t]));
  need(unique(active) && active.every(id=>byId.has(id)), 'Invalid/duplicate active node');
  need(active.length <= graph.limits.max_active_children, 'Active node limit exceeded');
  need(unique(blocked) && blocked.every(id=>byId.has(id)), 'Invalid/duplicate blocked node');
  need(!blocked.some(id=>active.includes(id)), 'Task cannot be both active and blocked');
  const invalid = new Set(descendants(graph,[...new Set([...invalidate,...blocked])]));
  const accepted = new Map(), stale = [], waiting = [];
  for (const task of order) {
    const record = loaded.records.get(task.id); if(!record) continue;
    const problems = [];
    if(invalid.has(task.id)) problems.push('Explicitly invalidated or downstream of invalidation');
    if(!git) problems.push('Provide --repo to check Git applicability');
    else {
      if(!git.isAncestor(record.receipt.git.commit)) problems.push('Receipt revision is not an ancestor of current HEAD');
      if(task.proof_policy === 'exact_head' && (!git.clean || record.receipt.git.commit!==git.head)) problems.push('Final proof needs this exact HEAD and a clean tracked tree');
    }
    for(const dep of task.depends_on) {
      if(!accepted.has(dep)) problems.push(`Dependency not accepted: ${dep}`);
      else if(record.receipt.depends_on_receipts[dep]!==accepted.get(dep).hash) problems.push(`Dependency receipt changed: ${dep}`);
    }
    if(problems.length) stale.push({task_id:task.id,reasons:problems}); else accepted.set(task.id,record);
  }
  for(const id of active) {
    need(!accepted.has(id),`Active task ${id} is already accepted; reconcile assignment`);
    need(byId.get(id).depends_on.every(d=>accepted.has(d)), `Active task ${id} has unaccepted prerequisites; reconcile before dispatch`);
  }
  const relevant = t => scope==='all'||t.scope===scope;
  const ready = [], external = [];
  for(const t of order) {
    if(!relevant(t)||accepted.has(t.id)||active.includes(t.id)||blocked.includes(t.id)) continue;
    const missing=t.depends_on.filter(d=>!accepted.has(d));
    if(missing.length) waiting.push({task_id:t.id,depends_on:missing});
    else if(t.mode==='human_gate') external.push({task_id:t.id,gate:t.human_gate,note:'Do not dispatch automatically. Capability/access is not authorization.'});
    else ready.push(t);
  }
  const importance = t => descendants(graph,[t.id]).length;
  ready.sort((a,b)=>a.priority-b.priority||importance(b)-importance(a)||a.id.localeCompare(b.id));
  const locks = new Set(), occupied = new Set();
  let implementers=0;
  for(const id of active) {
    const t=byId.get(id), needed=[...t.exclusive_locks,roleLock(t)];
    need(!needed.some(x=>occupied.has(x)),`Active tasks have conflicting locks/roles at ${id}`);
    needed.forEach(x=>{locks.add(x);occupied.add(x);});
    if(t.mode==='implementation') implementers++;
  }
  need(implementers<=graph.limits.max_parallel_implementers,'Active implementation limit exceeded');
  const batch=[],resourceWaiting=[];
  for(const t of ready) {
    const needed=[...t.exclusive_locks,roleLock(t)];
    if(batch.length+active.length>=graph.limits.max_active_children || needed.some(x=>locks.has(x)) || (t.mode==='implementation'&&implementers>=graph.limits.max_parallel_implementers)) {
      resourceWaiting.push(t.id); continue;
    }
    batch.push({task_id:t.id,title:t.title,role:t.role,mode:t.mode,locks:needed,definition_sha256:taskFingerprint(bundle,t)});
    needed.forEach(x=>locks.add(x)); if(t.mode==='implementation')implementers++;
  }
  return { warning:'Planning/evidence metadata only. No commands were executed or agents launched; a receipt does not prove its assertions true.',
    repo_checked:!!git, head:git?.head??null, tracked_tree_clean:git?.clean??null, scope,
    accepted:[...accepted.keys()], active, declared_blocked:blocked, proposed_batch:batch, ready_but_capacity_or_lock_limited:resourceWaiting,
    human_gates_ready:external, waiting_for_dependencies:waiting, stale_receipts:stale, invalid_receipts:loaded.issues,
    milestones:Object.fromEntries(Object.entries(graph.milestones).map(([k,ids])=>[k,ids.every(id=>accepted.has(id))])) };
}
export function mermaid(bundle) {
  const lines=['flowchart TD','  %% Generated from release-graph.json; not runtime progress.'];
  for(const t of topological(bundle.graph)) lines.push(`  ${t.id.replaceAll('-','_')}["${t.id} ${t.title.replaceAll('"',"'")}"]`);
  for(const t of bundle.graph.tasks) for(const d of t.depends_on) lines.push(`  ${d.replaceAll('-','_')} --> ${t.id.replaceAll('-','_')}`);
  return lines.join('\n')+'\n';
}
export function receiptTemplate(bundle,task) {
  return {schema_version:1,task_id:task.id,verdict:'NOT_RUN',definition_sha256:taskFingerprint(bundle,task),recorded_at:'REPLACE_WITH_ACTUAL_ISO_TIMESTAMP',executor:'REPLACE_BUILDER_SESSION',reviewer:'REPLACE_DISTINCT_REVIEWER_SESSION',git:{commit:'REPLACE_FULL_INTEGRATED_GIT_SHA',integrated:false,clean_tree:false},
    depends_on_receipts:Object.fromEntries(task.depends_on.map(id=>[id,'REPLACE_WITH_CANONICAL_RECEIPT_SHA256'])),
    review:{verdict:'NOT_RUN',observation:'Record actual independent review.',artifact_id:'review-log'},
    checks:task.acceptance.map((a,i)=>({id:`check-${i+1}`,criteria:[a.id],kind:'manual',status:'NOT_RUN',procedure:a.assertion,observer:'REPLACE_OBSERVER',observation:'No run performed.',artifact_id:`check-${i+1}-log`})),
    artifacts:[{id:'review-log',path:`logs/${task.id}/review.md`,sha256:'REPLACE_ACTUAL_FILE_SHA256'},...task.acceptance.map((a,i)=>({id:`check-${i+1}-log`,path:`logs/${task.id}/check-${i+1}.txt`,sha256:'REPLACE_ACTUAL_FILE_SHA256'}))],
    ...(task.mode==='human_gate'?{external_confirmation:{gate:task.human_gate,result:'NOT_CONFIRMED',actor:'REPLACE_HUMAN_OR_AUTHORIZED_OPERATOR',scope:'Record the specific access/permission and target.',artifact_id:'review-log'}}:{})};
}
const HELP=`Atlas read-only planner (run from anywhere; default graph is beside this kit)\n\n  validate\n  next [--receipts DIR] [--repo DIR] [--active AT-010,AT-024] [--blocked AT-003] [--invalidate AT-021] [--scope release|publish|advisory|all]\n  check-receipts --receipts DIR --repo DIR\n  task AT-001\n  receipt-template AT-001\n  receipt-hash PATH\n  file-hash PATH\n  impact AT-021[,AT-012]\n  mermaid\n\nAll graph commands accept --graph PATH. Writes, worker spawning, downloads, deployment,\nand execution of commands mentioned in receipts are deliberately not implemented.\nReceipt artifacts must stay within the receipt directory (subdirectories allowed).\nOnly immediate .json files in that directory are loaded as task receipts.\nUse full Git revisions. Review changes for semantic staleness; ancestry alone is not proof.\n`;
export function cli(argv) {
  const [command='help',...args]=argv; const options={},pos=[];
  const allowed=new Set(['graph','receipts','repo','active','blocked','invalidate','scope']);
  for(let i=0;i<args.length;i++) {
    if(args[i].startsWith('--')) {const key=args[i].slice(2);need(allowed.has(key),`Unknown option --${key}`);need(!Object.hasOwn(options,key),`Duplicate option --${key}`);need(args[i+1]&&!args[i+1].startsWith('--'),`Missing --${key} value`);options[key]=args[++i];}
    else pos.push(args[i]);
  }
  if(['help','--help','-h'].includes(command)){console.log(HELP);return;}
  if(command==='file-hash'){need(pos.length===1,'file-hash needs one path');console.log(bytesDigest(fs.readFileSync(pos[0])));return;}
  if(command==='receipt-hash'){need(pos.length===1,'receipt-hash needs one path');console.log(digest(readJson(pos[0])));return;}
  const bundle=loadBundle(options.graph??DEFAULT_GRAPH);
  if(command==='validate'){console.log(JSON.stringify({valid:true,...validateBundle(bundle)},null,2));return;}
  if(command==='mermaid'){process.stdout.write(mermaid(bundle));return;}
  if(command==='impact'){need(pos.length===1,'impact needs comma-separated node IDs');console.log(JSON.stringify(descendants(bundle.graph,pos[0].split(',')),null,2));return;}
  if(['task','receipt-template'].includes(command)){
    need(pos.length===1,'Expected one task ID');const task=bundle.graph.tasks.find(t=>t.id===pos[0]);need(task,`Unknown task ${pos[0]}`);
    console.log(JSON.stringify(command==='task'?{...task,definition_sha256:taskFingerprint(bundle,task)}:receiptTemplate(bundle,task),null,2));return;
  }
  need(['next','check-receipts'].includes(command),`Unknown command ${command}`);
  if(command==='check-receipts')need(options.receipts&&options.repo,'check-receipts requires --receipts and --repo');
  const loaded=loadReceipts(bundle,options.receipts);
  const result=analyze(bundle,loaded,{git:gitContext(options.repo),active:options.active?options.active.split(','):[],blocked:options.blocked?options.blocked.split(','):[],invalidate:options.invalidate?options.invalidate.split(','):[],scope:options.scope??'release'});
  console.log(JSON.stringify(result,null,2));
  if(command==='check-receipts'&&(result.invalid_receipts.length||result.stale_receipts.length))process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{cli(process.argv.slice(2));}catch(error){console.error(`Atlas planner: ${error.message}`);process.exitCode=1;}
}
