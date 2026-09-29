import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadOrg } from '../src/variants/shared.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = path.join(root, 'examples/ai-retail-dx.org.json');

test('variant data model merges same-company orgs and dedupes dual-role members', () => {
  const org = loadOrg(config, root);
  assert.equal(org.companies.length, 4);
  assert.equal(org.people.size, 12);
  const ito = org.people.get('ito_pmo');
  assert.ok(ito.dual);
  assert.deepEqual(ito.assignments.map(a => a.unit), ['プロジェクトマネジメント', '品質管理T']);
  assert.equal(org.companies.reduce((n, c) => n + c.count, 0), 12);
  for (const p of org.people.values()) assert.ok(p.avatar.startsWith('data:image/'), p.id);
});

test('build-variants writes eight self-contained pages that include every member', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'variants-'));
  const r = spawnSync(process.execPath, [path.join(root, 'scripts/build-variants.mjs'), config, out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const pages = fs.readdirSync(out).filter(f => /^\d\d-.*\.html$/.test(f));
  assert.equal(pages.length, 8);
  const names = JSON.parse(fs.readFileSync(config)).departments.flatMap(d => d.members.map(m => m.name));
  for (const f of pages) {
    const html = fs.readFileSync(path.join(out, f), 'utf8');
    assert.ok(!/src="\.\.\/avatars/.test(html), `${f} references external avatars`);
    for (const n of names) assert.ok(html.includes(n), `${f} is missing ${n}`);
  }
  assert.ok(fs.existsSync(path.join(out, 'index.html')));
});
