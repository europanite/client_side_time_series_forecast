import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePanel, featureVector, ridgeBacktest, scoreBars } from './stock-multivariate-core.mjs';

function fixture() {
  const meta={targets:['AAA.T','BBB.T'], symbols:['AAA.T','BBB.T','JPY=X'],foreign_symbols:['JPY=X'],
    groups:{'AAA.T':{peers:['BBB.T'],fx:['JPY=X']},'BBB.T':{peers:['AAA.T'],fx:['JPY=X']}}};
  const header=['Date,AAA.T,BBB.T,JPY=X'];
  for(let i=0;i<280;i++) {
    const day=new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10);
    const a=100+0.09*i+1.1*Math.sin(i/3), b=200+0.12*i+2*Math.cos(i/4);
    const fx=140+.02*i+Math.sin(i/8);
    header.push(`${day},${a},${b},${fx}`);
  }
  return {meta,rows:parsePanel(header.join('\n'),meta)};
}
test('future observations do not change any earlier feature/prediction',()=>{
  const {rows,meta}=fixture();
  const t=250;
  const before=featureVector(rows,t,'AAA.T',['BBB.T','JPY=X'],meta.foreign_symbols);
  const history=ridgeBacktest(rows,'AAA.T',['BBB.T','JPY=X'],meta.foreign_symbols,240,242);
  rows[t].prices['AAA.T']*=100;
  rows[t].prices['BBB.T']*=100;
  rows[t].prices['JPY=X']*=100;
  assert.deepEqual(featureVector(rows,t,'AAA.T',['BBB.T','JPY=X'],meta.foreign_symbols),before);
  assert.deepEqual(ridgeBacktest(rows,'AAA.T',['BBB.T','JPY=X'],meta.foreign_symbols,240,242),history);
});
test('stock trading requires price-consistent OHLC records',()=>{
  const {rows}=fixture();
  const bars=ridgeBacktest(rows,'AAA.T',[],[],250,253);
  const ohlc=bars.map(r=>({date:r.date,open:r.close-0.1,close:r.close}));
  const result=scoreBars(bars,ohlc,{initialCash:1e6,lotSize:100,feeBps:5,slippageBps:5,thresholdBps:20});
  assert.equal(result.observations,3);
  ohlc[2].close*=2;
  assert.throws(()=>scoreBars(bars,ohlc,{initialCash:1e6,lotSize:100,feeBps:5,slippageBps:5,thresholdBps:20}),/OHLC mismatch/);
});
