export function apiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!base) return ''
  if (!/^https?:\/\//i.test(base)) return ''
  return base.replace(/\/$/, '')
}

export function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${apiBase()}${path}`, window.location.origin)
  if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  return url.toString()
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : ({} as T)
}

