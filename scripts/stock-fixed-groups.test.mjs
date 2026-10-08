import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFixedGroups,updateGroupHistory} from './stock-fixed-groups.mjs';

const config=JSON.parse(readFileSync(new URL('../config/stock-evaluation-groups.json',import.meta.url)));
const targets=config.groups.map(g=>g.target);
const symbols=[...new Set([...targets,...config.groups.flatMap(g=>g.factors)])];
const meta={symbols,targets};
const rows=Array.from({length:220},()=>({prices:Object.fromEntries(symbols.map(s=>[s,100]))}));

test('pre-registered group targets, factors and ordering are stable',()=>{
  const groups=validateFixedGroups(config,meta,rows);
  assert.deepEqual(groups.map(g=>g.id),['automakers','banks','electronics','telecom','trading_houses']);
  assert.deepEqual(groups.map(g=>g.target),['7203.T','8306.T','6758.T','9432.T','8058.T']);
  assert.deepEqual(groups[2].factors,['6501.T','6702.T','^N225','JPY=X']);
  assert.notStrictEqual(groups[0],config.groups[0]);
});
test('missing target is not substituted by a different candidate',()=>{
  const missing={...meta,targets:targets.slice(1)};
  assert.throws(()=>validateFixedGroups(config,missing,rows),/Required target missing: 7203.T/);
});
test('missing factor fails instead of silently changing a group',()=>{
  const missing={...meta,symbols:meta.symbols.filter(s=>s!=='JPY=X')};
  assert.throws(()=>validateFixedGroups(config,missing,rows),/Required factor missing: JPY=X/);
});
test('insufficient factor observations fail closed',()=>{
  const sparse=rows.map(r=>({...r,prices:{...r.prices,'^N225':null}}));
  assert.throws(()=>validateFixedGroups(config,meta,sparse),/Insufficient recent factor coverage/);
});
test('duplicate group id, target or factor is rejected',()=>{
  assert.throws(()=>validateFixedGroups({...config,groups:[...config.groups,config.groups[0]]},meta,rows),/Duplicate fixed group/);
  const invalid=structuredClone(config);invalid.groups[1].factors.push('JPY=X');
  assert.throws(()=>validateFixedGroups(invalid,meta,rows),/Invalid factor/);
});
test('daily history appends distinct dates and replaces same-day reruns',()=>{
  const row1={marketDate:'2026-10-05',groups:[{id:'automakers',score:1}]};
  const row2={marketDate:'2026-10-06',groups:[{id:'automakers',score:2}]};
  let history=updateGroupHistory({version:1,records:[]},row1);
  history=updateGroupHistory(history,row2);
  history=updateGroupHistory(history,{...row1,groups:[{id:'automakers',score:3}]});
  assert.deepEqual(history.records.map(r=>r.marketDate),['2026-10-05','2026-10-06']);
  assert.equal(history.records[0].groups[0].score,3);
});
