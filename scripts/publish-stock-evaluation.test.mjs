import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const script = fileURLToPath(new URL('./publish-stock-evaluation.sh', import.meta.url));
const inputs = [
  'data/stocks/multivariate.csv',
  'data/stocks/multivariate.opens.csv',
  'data/stocks/multivariate.meta.json',
];
function git(cwd, ...args) {
  return execFileSync('git', args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
}
function put(root, path, content) {
  const full = resolve(root,path);
  mkdirSync(resolve(full,'..'),{recursive:true});
  writeFileSync(full,content);
}
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(),'stock-publish-test-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const remote=join(dir,'remote.git'), worker=join(dir,'worker'), other=join(dir,'other');
  execFileSync('git',['init','--bare','--initial-branch=main',remote],{stdio:'ignore'});
  execFileSync('git',['clone',remote,worker],{stdio:'ignore'});
  for(const repo of [worker]) {
    git(repo,'config','user.email','test@example.com');
    git(repo,'config','user.name','Test');
  }
  put(worker,'README.md','initial\n');
  put(worker,'reports/stocks/multivariate.json','{}\n');
  for(const path of inputs) put(worker,path,'old\n');
  git(worker,'add','.');
  git(worker,'commit','-m','baseline');
  git(worker,'push','-u','origin','main');
  execFileSync('git',['clone',remote,other],{stdio:'ignore'});
  git(other,'config','user.email','test@example.com');
  git(other,'config','user.name','Test');
  return {remote,worker,other};
}

test('published report survives a newer main and collector data stays uncommitted',t=>{
  const {remote,worker,other}=fixture(t);
  // GitHub Actions checkout normally leaves HEAD detached.
  git(worker,'checkout','--detach');
  put(worker,'reports/stocks/multivariate.json','{"new":true}\n');
  for(const path of inputs) put(worker,path,'fresh downloaded bars\n');
  git(worker,'add','reports/stocks/multivariate.json');
  git(worker,'commit','-m','daily report');
  put(other,'NEWS.md','unrelated code change\n');
  git(other,'add','NEWS.md');
  git(other,'commit','-m','parallel change');
  git(other,'push','origin','main');
  execFileSync('bash',[script],{cwd:worker,stdio:'pipe'});
  assert.equal(git(worker,'status','--porcelain','--untracked-files=no'),'');
  assert.equal(readFileSync(join(worker,'NEWS.md'),'utf8'),'unrelated code change\n');
  for(const path of inputs) assert.equal(readFileSync(join(worker,path),'utf8'),'old\n');
  assert.equal(git(worker,'rev-parse','HEAD'),git(remote,'rev-parse','refs/heads/main'));
  assert.equal(git(worker,'show','HEAD:reports/stocks/multivariate.json'),'{"new":true}');
});

test('unrelated tracked edits are not discarded and push is blocked',t=>{
  const {remote,worker}=fixture(t);
  put(worker,'reports/stocks/multivariate.json','{"new":true}\n');
  git(worker,'add','reports/stocks/multivariate.json');
  git(worker,'commit','-m','daily report');
  for(const path of inputs) put(worker,path,'new\n');
  put(worker,'README.md','unexpected edit\n');
  const result=spawnSync('bash',[script],{cwd:worker,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Unexpected tracked changes/);
  assert.equal(readFileSync(join(worker,'README.md'),'utf8'),'unexpected edit\n');
  assert.notEqual(git(worker,'rev-parse','HEAD'),git(remote,'rev-parse','refs/heads/main'));
});

test('works even if generated inputs are untracked',t=>{
  const {worker,remote}=fixture(t);
  for(const path of inputs) git(worker,'rm','--',path);
  git(worker,'commit','-m','stop tracking inputs');
  git(worker,'push','origin','main');
  put(worker,'reports/stocks/multivariate.json','{"final":1}\n');
  git(worker,'add','reports/stocks/multivariate.json');
  git(worker,'commit','-m','daily report');
  for(const path of inputs) put(worker,path,'downloaded but untracked\n');
  execFileSync('bash',[script],{cwd:worker,stdio:'pipe'});
  for(const path of inputs) assert.equal(readFileSync(join(worker,path),'utf8'),'downloaded but untracked\n');
  assert.equal(git(worker,'rev-parse','HEAD'),git(remote,'rev-parse','refs/heads/main'));
});
