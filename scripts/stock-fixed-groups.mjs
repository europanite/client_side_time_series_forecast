/** Validate a pre-registered group list without selecting by past performance. */
export function validateFixedGroups(config, meta, rows = null) {
  if (config?.version !== 1 || !Array.isArray(config.groups) || config.groups.length < 2)
    throw new Error('Invalid fixed-groups configuration');
  const ids = new Set(), targets = new Set();
  const allowed = new Set(meta.symbols ?? []);
  const targetSet = new Set(meta.targets ?? []);
  for (const group of config.groups) {
    if (!group || !/^[a-z][a-z0-9_]*$/.test(group.id ?? '') ||
        typeof group.label !== 'string' || !group.label.trim() ||
        typeof group.target !== 'string' || !Array.isArray(group.factors) || group.factors.length < 1)
      throw new Error('Invalid fixed group entry');
    if (ids.has(group.id) || targets.has(group.target))
      throw new Error(`Duplicate fixed group id or target: ${group.id}`);
    ids.add(group.id);targets.add(group.target);
    if (!targetSet.has(group.target)) throw new Error(`Required target missing: ${group.target}`);
    const factors = new Set();
    for (const symbol of group.factors) {
      if (typeof symbol !== 'string' || symbol === group.target || factors.has(symbol))
        throw new Error(`Invalid factor ${symbol} in ${group.id}`);
      if (!allowed.has(symbol)) throw new Error(`Required factor missing: ${symbol} in ${group.id}`);
      factors.add(symbol);
      if (rows && rows.slice(-256).filter(r => r.prices[symbol] != null).length < 80)
        throw new Error(`Insufficient recent factor coverage: ${symbol} in ${group.id}`);
    }
  }
  return config.groups.map(g => ({id:g.id, label:g.label, target:g.target, factors:[...g.factors]}));
}

/** Append one full cross-group snapshot for each market date; reruns replace the same date. */
export function updateGroupHistory(history, current, limit = 730) {
  if (!history || !Array.isArray(history.records) && history.version !== undefined)
    throw new Error('Invalid group history');
  const records = Array.isArray(history.records) ? history.records : [];
  const filtered = records.filter(r => r.marketDate !== current.marketDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(current.marketDate)) throw new Error('Invalid marketDate');
  const sorted = [...filtered, current].sort((a,b)=>a.marketDate.localeCompare(b.marketDate));
  return {version:1, records:sorted.slice(-limit)};
}
