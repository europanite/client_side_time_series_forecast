import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectVRM } from './verify-vrm.mjs';

test('reject non-GLB text input',()=> {
  const dir = mkdtempSync(join(tmpdir(),'vrm-test-'));
  try { const file=join(dir,'fake.vrm');writeFileSync(file,'not a VRM');assert.throws(()=>inspectVRM(file),/Invalid binary/); }
  finally {rmSync(dir,{recursive:true,force:true});}
});
