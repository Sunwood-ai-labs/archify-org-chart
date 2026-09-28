import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// The renderer revision used by the original published examples.
export const revision = '9e35d2b0b39b155553ba9fcfe0b4f2a5198dd993';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.cache', 'archify');
if (!fs.existsSync(target)) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  execFileSync('git', ['clone', '--filter=blob:none', '--no-checkout', 'https://github.com/tt-a1i/archify.git', target], { stdio: 'inherit' });
}
const current = execFileSync('git', ['-C', target, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (current !== revision) {
  execFileSync('git', ['-C', target, 'fetch', 'origin', revision], { stdio: 'inherit' });
}
execFileSync('git', ['-C', target, 'checkout', '--detach', revision], { stdio: 'inherit' });
console.log(`Archify ready: ${revision}`);
