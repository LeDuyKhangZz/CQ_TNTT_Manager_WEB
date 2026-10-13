/**
 * R2.12: backport React #36134 to the React renderer bundled by Next 15.5.20.
 * https://github.com/react/react/pull/36134/files
 * Keep a ping received DURING rendering so markRootSuspended can retry it.
 * Remove this backport when upgrading to a Next release containing that fix.
 * React/Next retain their original MIT copyright and license in these files.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const files = [
  ['react-dom-client.production.js', '9bcaacd92279559075407d2fb09b19893f03f9b93ad74eb0ef42b31b66f6053e'],
  ['react-dom-client.development.js', '14c33685b88f2e39827dc6f0515f9d44411958758aef6573686468163465f6bb'],
  ['react-dom-profiling.profiling.js', '2a2f9a79c0d5906720e6833f1d0cc605379b004279ca1b1ef37142a5fe392178'],
  ['react-dom-profiling.development.js', 'd0b4798776943fddff40056c9bd001e6076111b30aae3a392436722bfab24e2e'],
];
const production = ['? 0 === (executionContext & 2) && prepareFreshStack(root, 0)',
  '? 0 === (executionContext & 2) ? prepareFreshStack(root, 0) : (workInProgressRootPingedLanes |= pingedLanes)'];
const development = ['? (executionContext & RenderContext) === NoContext &&\n            prepareFreshStack(root, 0)',
  '? (executionContext & RenderContext) === NoContext\n            ? prepareFreshStack(root, 0)\n            : (workInProgressRootPingedLanes |= pingedLanes)'];
const sha = value => createHash('sha256').update(value).digest('hex');

export function patchNextReact(nextDirectory) {
  const version = JSON.parse(readFileSync(resolve(nextDirectory, 'package.json'), 'utf8')).version;
  if (version !== '15.5.20') throw new Error(`R2.12: review React #36134 backport for Next ${version}; expected 15.5.20.`);
  // Preflight ALL files before writing any: a changed package must fail loudly.
  const changes = files.map(([name, checksum]) => {
    const path = resolve(nextDirectory, 'dist/compiled/react-dom/cjs', name);
    const original = readFileSync(path, 'utf8');
    const [before, after] = name.endsWith('development.js') ? development : production;
    const alreadyPatched = original.includes(after);
    const pristine = alreadyPatched ? original.replace(after, before) : original;
    if (sha(pristine) !== checksum || pristine.split(before).length !== 2) {
      throw new Error(`R2.12: unexpected renderer checksum for ${name}; no files written. Review the upstream backport.`);
    }
    return {path, content:pristine.replace(before, after), alreadyPatched};
  });
  for (const change of changes) if (!change.alreadyPatched) writeFileSync(change.path, change.content);
  return changes.filter(change => !change.alreadyPatched).length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../node_modules/next');
  console.log(`R2.12 React retry backport checked (${patchNextReact(root)} files patched).`);
}
