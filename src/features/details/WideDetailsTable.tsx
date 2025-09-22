import { useEffect, useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getDetails } from '../../api/details'
import { getCustCodes } from '../../api/custcodes'

type Props = {
  branch: string
  months: string[]
  threshold: number
  compact?: boolean
  compactMonths?: number
  query?: string
  pageSize?: number
}

export default function WideDetailsTable({ branch, months, threshold, compact = true, compactMonths = 3, query = '', pageSize = 10 }: Props) {
  const queries = useQueries({
    queries: months.map((ym) => ({
      queryKey: ['details', { branch, ym }],
      queryFn: () => getDetails({ branch, ym, limit: 200, offset: 0, order_by: 'present_water_usg', sort: 'desc' as const }),
      enabled: Boolean(branch && ym),
    })),
  })

  const latest = months[0]
  const previous = months[1]
  const meta = useQuery({
    queryKey: ['custcodes', { branch, ym: latest }],
    queryFn: () => getCustCodes({ branch, ym: latest, limit: 200, offset: 0 }),
    enabled: Boolean(branch && latest),
  })

  const loading = queries.some((q) => q.isLoading)
  const error = (queries.find((q) => q.isError)?.error || (meta.isError ? meta.error : undefined)) as Error | undefined

  const rows = useMemo(
    () => combine(months, queries.map((q) => q.data?.items ?? []), meta.data?.items ?? []),
    [months, queries, meta.data]
  )

  const filtered = rows.filter((r) => {
    if (threshold <= 0) return true // show all when threshold is 0
    const prev = r.values[previous] ?? 0
    const curr = r.values[latest] ?? 0
    const pct = prev === 0 ? 0 : ((curr - prev) / prev) * 100
    return pct <= -threshold // decreasing usage by threshold
  })

  const q = query.trim().toLowerCase()
  const searched = q
    ? filtered.filter((r) =>
        [
          r.org_name ?? '',
          r.cust_code,
          r.use_type ?? '',
          r.use_name ?? '',
          r.cust_name ?? '',
          r.address ?? '',
          r.route_code ?? '',
          r.meter_no ?? '',
          r.meter_size ?? '',
          r.meter_brand ?? '',
          r.meter_state ?? '',
        ].some((v) => String(v).toLowerCase().includes(q))
      )
    : filtered

  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(searched.length / (pageSize || 10)))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * (pageSize || 10)
  const end = start + (pageSize || 10)
  const pageRows = searched.slice(start, end)

  useEffect(() => {
    setPage(1)
  }, [branch, latest, threshold, query, pageSize, compact, compactMonths])

  const displayMonths = useMemo(() => {
    const unique = Array.from(new Set(months))
    return compact ? unique.slice(0, compactMonths) : unique
  }, [months, compact, compactMonths])

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-3">
        <div className="flex items-center gap-3">
          {loading && <span className="loading loading-spinner loading-sm" />}
          {error && <div className="text-error text-sm">{error.message}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-lg font-semibold">ผลลัพธ์: <span className="text-primary">{searched.length} รายชื่อ</span> ที่เข้าเงื่อนไข</div>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <span>คำอธิบายสี:</span>
            <ColorDot color="#facc15" />
            <span>≈ 5-15%</span>
            <ColorDot color="#fb923c" />
            <span>≈ 15-30%</span>
            <ColorDot color="#ef4444" />
            <span>&gt; 30%</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>กปภ.สาขา</th>
                <th>เลขที่ผู้ใช้น้ำ</th>
                {!compact && <th>ประเภท</th>}
                {!compact && <th>รายละเอียด</th>}
                <th>ชื่อผู้ใช้น้ำ</th>
                {!compact && <th>ที่อยู่</th>}
                {!compact && <th>เส้นทาง</th>}
                <th>หมายเลขมาตร</th>
                <th>ขนาดมาตร</th>
                {!compact && <th>ยี่ห้อ</th>}
                {!compact && <th>สถานะมาตร</th>}
                <th className="text-right">หน่วยน้ำเฉลี่ย</th>
                {!compact && <th className="text-right">เลขมาตรที่อ่านได้</th>}
                <th className="text-right">หน่วยน้ำเดือนนี้ <span className="badge badge-info badge-sm align-middle">ล่าสุด</span></th>
                {displayMonths.slice(1).map((ym) => (
                  <th key={ym} className="text-right">{fmtThMonth(ym)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr key={r.key}>
                  <td>{start + i + 1}</td>
                  <td className="font-mono">{r.org_name ?? r.branch}</td>
                  <td className="font-mono">{r.cust_code}</td>
                  {!compact && <td>{r.use_type ?? '-'}</td>}
                  {!compact && <td>{r.use_name ?? '-'}</td>}
                  <td>{r.cust_name ?? '-'}</td>
                  {!compact && <td className="max-w-[24rem] truncate" title={r.address ?? ''}>{r.address ?? '-'}</td>}
                  {!compact && <td className="font-mono">{r.route_code ?? '-'}</td>}
                  <td className="font-mono">{r.meter_no ?? '-'}</td>
                  <td>{r.meter_size ?? '-'}</td>
                  {!compact && <td>{r.meter_brand ?? '-'}</td>}
                  {!compact && <td>{r.meter_state ?? '-'}</td>}
                  <td className="text-right">{fmtNum(r.average ?? 0)}</td>
                  {!compact && <td className="text-right">{r.present_meter_count ?? 0}</td>}
                  {(() => {
                    const prev = r.values[previous] ?? 0
                    const curr = r.values[latest] ?? 0
                    const pct = prev ? ((curr - prev) / prev) * 100 : 0
                    return (
                      <td className="text-right">
                        <span className={`badge text-xs ${chipClass(pct)}`}>{fmtNum(curr)}{prev ? ` (${fmtPct(pct)})` : ''}</span>
                      </td>
                    )
                  })()}
                  {displayMonths.slice(1).map((ym) => {
                    const val = r.values[ym]
                    // แสดงตัวเลขปกติ ไม่ลงสี (ต้องการให้เฉพาะเดือนล่าสุดเท่านั้นที่ลงสี)
                    return (
                      <td key={ym} className="text-right">{val != null ? fmtNum(val) : '-'}</td>
                    )
                  })}
                </tr>
              ))}
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={8} className="opacity-70">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  )
}

type Item = {
  branch_code: string
  org_name?: string | null
  cust_code: string
  use_type?: string | null
  use_name?: string | null
  cust_name?: string | null
  address?: string | null
  route_code?: string | null
  meter_no: string | null
  meter_size?: string | null
  meter_brand?: string | null
  meter_state?: string | null
  average?: number
  present_meter_count?: number
  present_water_usg: number
}

function combine(months: string[], lists: Item[][], metaItems: MetaItem[]) {
  const map = new Map<string, Row>()
  const metaMap = new Map<string, MetaItem>()
  metaItems.forEach((m) => metaMap.set(m.cust_code, m))
  // Seed rows from custcodes (top-200) so we always start with 200 entries
  metaItems.forEach((m) => {
    const key = m.cust_code
    if (!map.has(key)) {
      map.set(key, {
        key,
        branch: '',
        org_name: m.org_name ?? null,
        cust_code: m.cust_code,
        use_type: m.use_type ?? null,
        use_name: m.use_name ?? null,
        cust_name: m.cust_name ?? null,
        address: m.address ?? null,
        route_code: m.route_code ?? null,
        meter_no: m.meter_no ?? null,
        meter_size: m.meter_size ?? null,
        meter_brand: m.meter_brand ?? null,
        meter_state: m.meter_state ?? null,
        average: null,
        present_meter_count: null,
        values: {},
      })
    }
  })
  lists.forEach((items, idx) => {
    const ym = months[idx]
    items.forEach((it) => {
      const key = `${it.cust_code}`
      const base: Row = map.get(key) ?? {
        key,
        branch: it.branch_code,
        org_name: it.org_name ?? metaMap.get(key)?.org_name ?? null,
        cust_code: it.cust_code,
        use_type: it.use_type ?? metaMap.get(key)?.use_type ?? null,
        use_name: it.use_name ?? metaMap.get(key)?.use_name ?? null,
        cust_name: it.cust_name ?? metaMap.get(key)?.cust_name ?? null,
        address: it.address ?? metaMap.get(key)?.address ?? null,
        route_code: it.route_code ?? metaMap.get(key)?.route_code ?? null,
        meter_no: it.meter_no ?? metaMap.get(key)?.meter_no ?? null,
        meter_size: it.meter_size ?? metaMap.get(key)?.meter_size ?? null,
        meter_brand: it.meter_brand ?? metaMap.get(key)?.meter_brand ?? null,
        meter_state: it.meter_state ?? metaMap.get(key)?.meter_state ?? null,
        average: it.average ?? null,
        present_meter_count: it.present_meter_count ?? null,
        values: {},
      }
      base.values[ym] = it.present_water_usg
      map.set(key, base)
    })
  })
  return Array.from(map.values())
}

type Row = {
  key: string
  branch: string
  org_name: string | null
  cust_code: string
  use_type: string | null
  use_name: string | null
  cust_name: string | null
  address: string | null
  route_code: string | null
  meter_no: string | null
  meter_size: string | null
  meter_brand: string | null
  meter_state: string | null
  average: number | null
  present_meter_count: number | null
  values: Record<string, number>
}

type MetaItem = {
  org_name: string | null
  cust_code: string
  use_type: string | null
  use_name: string | null
  cust_name: string | null
  address: string | null
  route_code: string | null
  meter_no: string | null
  meter_size: string | null
  meter_brand: string | null
  meter_state: string | null
}

function fmtThMonth(ym: string): string {
  const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const y = Number(ym.slice(0, 4)) + 543
  const m = Number(ym.slice(4, 6))
  return `${TH[m - 1]} ${y}`
}

function prevCurrPct(r: Row, currYm: string, prevYm: string) {
  const prev = r.values[prevYm] ?? 0
  const curr = r.values[currYm] ?? 0
  if (!prev) return 0
  return ((curr - prev) / prev) * 100
}

function heat(pct: number): React.CSSProperties | undefined {
  // Only for decreases (negative values). Map -5% → light, -30% → strong
  if (pct >= 0) return undefined
  const clamped = Math.max(-30, Math.min(-5, pct))
  const t = (Math.abs(clamped) - 5) / 25 // 0..1
  const color = `hsl(20 90% ${90 - t * 40}%)` // orange to red-ish
  return { background: color }
}

function sortFiscal(ms: string[]): string[] {
  // Custom cycle: September → October → ... → August
  const cycleYear = (ym: string) => {
    const y = Number(ym.slice(0, 4))
    const m = Number(ym.slice(4, 6))
    // Months Sep-Dec belong to the current cycle year; Jan–Aug to previous
    return m >= 9 ? y : y - 1
  }
  const cycleIndex = (ym: string) => {
    const m = Number(ym.slice(4, 6))
    // Sep(9)=0, Oct(10)=1, Nov=2, ..., Aug(8)=11
    return m >= 9 ? m - 9 : m + 3
  }
  const uniq = Array.from(new Set(ms))
  return uniq.sort((a, b) => {
    const ca = cycleYear(a)
    const cb = cycleYear(b)
    if (ca !== cb) return cb - ca // latest cycle first
    return cycleIndex(a) - cycleIndex(b) // Sep..Aug within a cycle
  })
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)
}

function fmtPct(p: number): string {
  const s = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(p)
  return `${s}%`
}

function chipClass(pct: number): string {
  // Use thresholds to match legend colors
  if (pct >= 0) return 'badge-ghost'
  const abs = Math.abs(pct)
  if (abs > 30) return 'badge-error'
  if (abs >= 15) return 'badge-warning'
  if (abs >= 5) return 'badge-warning badge-outline'
  return 'badge-ghost'
}

function ColorDot({ color }: { color: string }) {
  return <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-full align-middle" />
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const canPrev = page > 1
  const canNext = page < totalPages
  const pages = (() => {
    const out: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) out.push(i)
      else if (out[out.length - 1] !== '…') out.push('…')
    }
    return out
  })()
  return (
    <div className="flex items-center gap-2 justify-end pt-2">
      <button className="btn btn-sm" disabled={!canPrev} onClick={() => canPrev && onChange(page - 1)}>« ก่อนหน้า</button>
      <div className="join">
        {pages.map((p, idx) => (
          typeof p === 'number' ? (
            <button key={idx} className={`btn btn-sm join-item ${p === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => onChange(p)}>{p}</button>
          ) : (
            <button key={idx} className="btn btn-sm join-item btn-disabled">{p}</button>
          )
        ))}
      </div>
      <button className="btn btn-sm" disabled={!canNext} onClick={() => canNext && onChange(page + 1)}>ถัดไป »</button>
    </div>
  )
}
