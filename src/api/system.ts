import { buildUrl, fetchJson } from './http'

export interface HealthResp { status: string; time: string }
export interface VersionResp { service: string; version: string; commit?: string }
export interface ConfigResp { timezone: string; cron_yearly: string; cron_monthly: string; branches_count: number }

export const getHealth = () => fetchJson<HealthResp>(buildUrl('/api/v1/healthz'))
export const getVersion = () => fetchJson<VersionResp>(buildUrl('/api/v1/version'))
export const getConfig = () => fetchJson<ConfigResp>(buildUrl('/api/v1/config'))

