/**
 * Resolve MedAssist API base for Azure / chat routes.
 * When UI is served from Express (:3000), use same-origin.
 * During Expo web (:8081), talk to the local API host.
 */
export function getApiBase() {
  if (typeof window !== 'undefined') {
    const { port, origin } = window.location;
    if (port === '3000' || !port) return '';
    // Expo / Metro web
    if (port === '8081' || port === '19006' || port === '19000') {
      return 'http://127.0.0.1:3000';
    }
    return origin;
  }
  return 'http://127.0.0.1:3000';
}

export async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs || 8000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
