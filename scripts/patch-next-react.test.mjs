import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, sep } from 'node:path';
import { patchNextReact } from './patch-next-react.mjs';

function fixture(run) {
  const root=mkdtempSync(join(tmpdir(),'cq-r2-react-'));
  const dir=join(root,'dist/compiled/react-dom/cjs');mkdirSync(dir,{recursive:true});
  writeFileSync(join(root,'package.json'),JSON.stringify({version:'15.5.20'}));
  const names=['react-dom-client.production.js','react-dom-client.development.js','react-dom-profiling.profiling.js','react-dom-profiling.development.js'];
  for(const name of names) {
    let source=readFileSync(resolve('node_modules/next/dist/compiled/react-dom/cjs',name),'utf8');
    source=source.replace('? 0 === (executionContext & 2) ? prepareFreshStack(root, 0) : (workInProgressRootPingedLanes |= pingedLanes)','? 0 === (executionContext & 2) && prepareFreshStack(root, 0)')
      .replace('? (executionContext & RenderContext) === NoContext\n            ? prepareFreshStack(root, 0)\n            : (workInProgressRootPingedLanes |= pingedLanes)','? (executionContext & RenderContext) === NoContext &&\n            prepareFreshStack(root, 0)');
    writeFileSync(join(dir,name),source);
  }
  try {run(root,dir,names);} finally {
    assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep+'cq-r2-react-'));
    rmSync(root,{recursive:true,force:true});
  }
}
test('patches the pinned renderer and is idempotent',()=>fixture(root=>{assert.equal(patchNextReact(root),4);assert.equal(patchNextReact(root),0);}));
test('unknown Next version fails without changing files',()=>fixture((root,dir,names)=>{
  const before=readFileSync(join(dir,names[0]),'utf8');writeFileSync(join(root,'package.json'),'{"version":"16.0.0"}');
  assert.throws(()=>patchNextReact(root),/review/);assert.equal(readFileSync(join(dir,names[0]),'utf8'),before);
}));
test('checksum preflight prevents partial writes',()=>fixture((root,dir,names)=>{
  const before=readFileSync(join(dir,names[0]),'utf8');writeFileSync(join(dir,names[3]),'unexpected content');
  assert.throws(()=>patchNextReact(root),/checksum/);assert.equal(readFileSync(join(dir,names[0]),'utf8'),before);
}));
