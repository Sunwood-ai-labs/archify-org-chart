import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../src/config.mjs';
import { generateArchitectureSpec } from '../bin/archify-org-chart.mjs';
import { buildAvatarDataUri } from '../inject-avatars.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = () => JSON.parse(fs.readFileSync(path.join(root, 'examples/ai-retail-dx.org.json')));
const cli = path.join(root, 'bin/archify-org-chart.mjs');

test('reporting relationships match the source configuration, including department leads', () => {
  const c = example();
  const spec = generateArchitectureSpec(validateConfig(c));
  for (const m of c.departments.flatMap(d => d.members)) assert.ok(spec.connections.some(e => e.from === m.parent && e.to === m.id), m.id);
});
test('reject unsupported capacity, duplicate ids, unknown organizations and cycles', () => {
  for (const mutate of [c => c.departments.pop(), c => c.departments[0].members.push(c.owner), c => c.owner.org = 'missing', c => c.pm.lead.id = c.owner.id, c => c.owner.parent = c.departments[0].members[0].id]) {
    const c = example(); mutate(c); assert.throws(() => validateConfig(c), /Invalid organization config/);
  }
});
test('missing avatar fallback escapes XML text', () => {
  const uri = buildAvatarDataUri({name:'<&'}, {color:'#38bdf8'});
  const svg = Buffer.from(uri.split(',')[1], 'base64').toString();
  assert.ok(svg.includes('&lt;&amp;'));
});
test('custom build in a separate directory embeds local avatar, escapes text and leaves bundled demos intact', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'org-chart-test-'));
  const original = fs.readFileSync(path.join(root, 'project-governance.architecture.json'));
  try {
    const c = example(); c.owner.name = 'Custom <Owner>'; c.projectTitle = 'Custom & project';
    c.owner.avatar = 'portrait.jpg';
    fs.copyFileSync(path.join(root,'avatars/thumb/sato_sponsor.jpg'),path.join(tmp,'portrait.jpg'));
    fs.writeFileSync(path.join(tmp,'input.json'),JSON.stringify(c));
    const result = spawnSync(process.execPath, [cli,'build','input.json','nested/custom.html'], {cwd:tmp, encoding:'utf8'});
    assert.equal(result.status,0,result.stdout+result.stderr);
    const html=fs.readFileSync(path.join(tmp,'nested/custom.html'),'utf8');
    assert.ok(html.includes('Custom &lt;Owner&gt;'));
    assert.ok(html.includes('data:image/jpeg;base64,'));
    assert.ok(!html.includes('navigator.webdriver'));
    assert.deepEqual(fs.readFileSync(path.join(root,'project-governance.architecture.json')),original);
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
test('invalid command fails explicitly', () => {
  assert.equal(spawnSync(process.execPath,[cli,'unknown']).status,1);
});
test('missing engine fails without changing an existing output', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'org-chart-missing-'));
  try {
    const out = path.join(tmp,'chart.html'); fs.writeFileSync(out,'last good chart');
    const result = spawnSync(process.execPath,[cli,'build',path.join(root,'examples/ai-retail-dx.org.json'),out], {env:{...process.env,ARCHIFY_CLI:path.join(tmp,'missing.mjs')},encoding:'utf8'});
    assert.equal(result.status,1);
    assert.match(result.stderr,/npm run setup:archify/);
    assert.equal(fs.readFileSync(out,'utf8'),'last good chart');
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
