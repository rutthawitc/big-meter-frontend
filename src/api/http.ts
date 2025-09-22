export function apiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  // In dev, prefer relative '/api' and let Vite proxy forward.
  // If VITE_API_BASE_URL is malformed (e.g., ":8080"), fall back to relative.
  if (!base) return ''
  if (!/^https?:\/\//i.test(base)) return ''
  return base.replace(/\/$/, '')
}

export function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const fullPath = `${apiBase()}${path}` || path
  const url = new URL(fullPath, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const headers = new Headers(init?.headers ?? {})
  // Avoid setting Content-Type on GET/HEAD to prevent CORS preflight
  if (method !== 'GET' && method !== 'HEAD' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  try {
    return (text ? JSON.parse(text) : ({} as any)) as T
  } catch {
    return {} as T
  }
}
