import { buildUrl, fetchJson } from './http'

export interface BranchItem { code: string; name?: string }
export interface BranchesResponse {
  items: BranchItem[]
  total: number
  limit: number
  offset: number
}

export async function getBranches(params: { q?: string; limit?: number; offset?: number } = {}) {
  const url = buildUrl('/api/v1/branches', params)
  return fetchJson<BranchesResponse>(url)
}
