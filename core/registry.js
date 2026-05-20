// core/registry.js — Provider registry: load, cache, register

const _cache = new Map();        // id → loaded module default
const _static = new Map();       // id → pre-registered module (for UMD)

/**
 * Load a provider by id. Tries static registry first, then dynamic import.
 * baseUrl: e.g. 'https://cdn.example.com/authkit' or '.' (relative)
 */
export async function loadProvider(id, baseUrl = '.') {
  if (_cache.has(id)) return _cache.get(id);
  if (_static.has(id)) {
    const mod = _static.get(id);
    _cache.set(id, mod);
    return mod;
  }
  const url = `${baseUrl}/providers/${id}.js`;
  try {
    const mod = await import(url);
    const provider = mod.default ?? mod;
    _cache.set(id, provider);
    return provider;
  } catch (err) {
    throw new Error(`[AuthKit] Failed to load provider "${id}" from ${url}: ${err.message}`);
  }
}

/** Pre-register a provider module (used when dynamic import isn't available) */
export function registerProvider(module) {
  if (!module?.id) throw new Error('[AuthKit] Provider module must have an `id` field.');
  _static.set(module.id, module);
  _cache.set(module.id, module);
}

/** Return all currently loaded providers */
export function listLoaded() {
  return [..._cache.values()];
}

/** Load all providers in parallel, return array */
export async function loadAll(ids, baseUrl = '.') {
  return Promise.all(ids.map(id => loadProvider(id, baseUrl)));
}
