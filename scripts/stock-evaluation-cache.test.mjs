import {test} from 'node:test';
import assert from 'node:assert/strict';
import {asOfFrame, predictionKey, emptyCache, compatibleCache} from './stock-evaluation-cache.mjs';

const rows=Array.from({length:110},(_,i)=>({date:new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),
  prices:{'A.T':100+i,'B.T':200+2*i,'JPY=X':140+i/10}}));
const group={target:'A.T'};
test('no same-session value ever reaches model frame or cache hash',()=>{
  const first=asOfFrame(rows,100,90);
  assert.deepEqual(first.at(-1).prices,{});
  const key=predictionKey(first,group,['B.T','JPY=X'],'xgboost','version1');
  rows[100].prices['A.T']=987654;
  rows[100].prices['B.T']=987654;
  rows[108].prices['JPY=X']=987654;
  const second=asOfFrame(rows,100,90);
  assert.equal(key,predictionKey(second,group,['B.T','JPY=X'],'xgboost','version1'));
});
test('prior price, feature set, model version, or model choice invalidates predictions',()=>{
  const frame=asOfFrame(rows,100,90);
  const key=predictionKey(frame,group,['B.T'],'xgboost','version1');
  assert.notEqual(key,predictionKey(frame,group,[],'xgboost','version1'));
  assert.notEqual(key,predictionKey(frame,group,['B.T'],'lightgbm','version1'));
  assert.notEqual(key,predictionKey(frame,group,['B.T'],'xgboost','version2'));
  assert.notEqual(key,predictionKey(frame,group,['B.T'],'xgboost','version1',['JPY=X']));
  rows[90].prices['B.T']++;
  assert.notEqual(key,predictionKey(asOfFrame(rows,100,90),group,['B.T'],'xgboost','version1'));
});
test('unrelated tickers do not invalidate this group; shifting old dates out retains score',()=>{
  const frame=asOfFrame(rows,100,90);
  const key=predictionKey(frame,group,['B.T'],'xgboost','v1');
  const other=structuredClone(rows);other[9].prices['B.T']=-999;other[98].prices['JPY=X']=-999;
  assert.equal(key,predictionKey(asOfFrame(other,100,90),group,['B.T'],'xgboost','v1'));
});
test('incorrect cache versions and engine hashes are ignored',()=>{
  const valid=emptyCache('v1');valid.entries.x=123;
  assert.strictEqual(compatibleCache(valid,'v1'),valid);
  assert.deepEqual(compatibleCache(valid,'v2'),emptyCache('v2'));
  assert.deepEqual(compatibleCache({...valid,version:0},'v1'),emptyCache('v1'));
});
