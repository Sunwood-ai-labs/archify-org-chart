export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function validateConfig(config) {
  const fail = message => { throw new Error(`Invalid organization config: ${message}`); };
  if (!config || !config.projectTitle || !config.organizations || !config.owner || !config.pm?.lead) fail('projectTitle, organizations, owner and pm.lead are required');
  if (!Array.isArray(config.departments) || config.departments.length !== 4) fail('exactly four departments are supported');
  const primary = [config.owner, config.pm.lead];
  config.departments.forEach((d, i) => {
    const max = i === 1 ? 4 : 2;
    if (!Array.isArray(d.members) || d.members.length < 1 || d.members.length > max) fail(`department ${i + 1} supports 1–${max} members`);
    if (!d.name || !Array.isArray(d.roles) || d.roles.length > 4) fail('departments need a name and at most four roles');
    if (d.members.slice(1).some(m => !m.parent)) fail('non-lead department members require a parent');
    if (!/^#[\da-f]{6}$/i.test(d.headerColor)) fail('headerColor must be a six-digit hex color');
    primary.push(...d.members);
  });
  const ids = new Set();
  for (const m of primary) {
    if (!/^[a-zA-Z][\w-]*$/.test(m.id) || ids.has(m.id)) fail(`invalid or duplicate member id: ${m.id}`);
    ids.add(m.id);
  }
  for (const m of [...primary, ...(config.pm.members || [])]) {
    if (!/^[a-zA-Z][\w-]*$/.test(m.id) || !m.name || !config.organizations[m.org]) fail(`invalid member or organization: ${m.id}`);
    if (m.parent && (!ids.has(m.parent) || m.parent === m.id)) fail(`invalid parent for ${m.id}`);
  }
  for (const m of primary) {
    const seen = new Set([m.id]);
    let parent = m.parent;
    while (parent) {
      if (seen.has(parent)) fail(`reporting cycle at ${m.id}`);
      seen.add(parent);
      parent = primary.find(p => p.id === parent)?.parent;
    }
  }
  for (const org of Object.values(config.organizations)) {
    if (!/^#[\da-f]{6}$/i.test(org.color)) fail('organization color must be a six-digit hex color');
    if (!['frontend','backend','cloud','security','messagebus','database','external'].includes(org.type)) fail('unsupported organization type');
    if (org.badgeBg && !/^(#[\da-f]{6}|rgba?\([\d\s.,%]+\))$/i.test(org.badgeBg)) fail('invalid badgeBg color');
  }
  return config;
}

export function escapedConfig(value) {
  if (typeof value === 'string') return escapeHtml(value);
  if (Array.isArray(value)) return value.map(escapedConfig);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, escapedConfig(v)]));
  return value;
}
