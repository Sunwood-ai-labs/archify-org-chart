import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from '../bin/archify-org-chart.mjs';
import { enhanceHtmlWithConfig } from '../inject-avatars.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = name => path.join(root, name);
const configPath = at('examples/ai-retail-dx.org.json');
build(configPath, at('project-governance-with-avatars.html'), {
  baseOutput: at('project-governance.architecture.html'),
  specOutput: at('project-governance.architecture.json')
});
const cli = process.env.ARCHIFY_CLI || at('.cache/archify/archify/bin/archify.mjs');
execFileSync(process.execPath, [cli, 'deliver', 'workflow', at('org-lineage-swimlane.workflow.json'), at('org-lineage-swimlane.workflow.html'), '--quality', 'showcase', '--json'], { stdio: 'inherit' });
enhanceHtmlWithConfig(at('org-lineage-swimlane.workflow.html'), at('org-lineage-swimlane-with-avatars.html'), JSON.parse(fs.readFileSync(configPath)), true, path.dirname(configPath));
fs.copyFileSync(at('project-governance-with-avatars.html'), at('docs/public/demo/project-governance.html'));
fs.copyFileSync(at('org-lineage-swimlane-with-avatars.html'), at('docs/public/demo/workflow-swimlane.html'));
