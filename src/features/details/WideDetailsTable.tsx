import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getDetails } from '../../api/details'
import { getCustCodes } from '../../api/custcodes'

type Props = { branch: string; months: string[]; threshold: number; compact?: boolean }

export default function WideDetailsTable({ branch, months, threshold, compact = true }: Props) {
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
    const prev = r.values[previous] ?? 0
    const curr = r.values[latest] ?? 0
    const pct = prev === 0 ? 0 : ((curr - prev) / prev) * 100
    return pct <= -threshold // decreasing usage by threshold
  })

  const displayMonths = useMemo(() => Array.from(new Set(months)), [months])

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-3">
        <div className="flex items-center gap-3">
          {loading && <span className="loading loading-spinner loading-sm" />}
          {error && <div className="text-error text-sm">{error.message}</div>}
          <div className="text-sm">ผลลัพธ์: {filtered.length} ราย ที่เข้าเงื่อนไข</div>
        </div>

        <div className="text-xs opacity-70">
          การแสดงสี: เน้นเฉพาะคอลัมน์ของเดือนล่าสุดเมื่อปริมาณการใช้น้ำลดลงเทียบกับเดือนก่อนหน้า
          ไล่สีจากอ่อนไปเข้มตามเปอร์เซ็นต์ลดลง เช่น
          <span className="px-2 mx-1 rounded" style={heat(-7)}>≈−5%</span>
          →
          <span className="px-2 mx-1 rounded" style={heat(-30)}>≈−30%</span>.
          ถ้าเพิ่มขึ้น/เท่าเดิม หรือเดือนก่อนหน้าเป็น 0 จะไม่แสดงสี
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>กปภ.สาขา</th>
                <th>เลขที่ผู้ใช้งาน</th>
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
                {displayMonths.map((ym) => (
                  <th key={ym} className="text-right">{fmtThMonth(ym)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.key}>
                  <td>{i + 1}</td>
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
                  {displayMonths.map((ym) => {
                    const val = r.values[ym] ?? 0
                    if (ym !== latest) {
                      return (
                        <td key={ym} className="text-right">{fmtNum(val)}</td>
                      )
                    }
                    const prev = r.values[previous] ?? 0
                    const delta = val - prev
                    const pct = prev ? (delta / prev) * 100 : NaN
                    const title = Number.isFinite(pct)
                      ? `ปัจจุบัน: ${fmtNum(val)}\nก่อนหน้า: ${fmtNum(prev)}\nΔ: ${fmtNum(delta)}\n%: ${fmtPct(pct)} (เทียบเดือนก่อนหน้า)`
                      : `ปัจจุบัน: ${fmtNum(val)}\nก่อนหน้า: ${fmtNum(prev)}\nไม่สามารถคำนวณ % (เดือนก่อนหน้าเป็น 0)`
                    const tip = Number.isFinite(pct)
                      ? `%: ${fmtPct(pct)} | Δ: ${fmtNum(delta)} | ปัจจุบัน: ${fmtNum(val)} | ก่อนหน้า: ${fmtNum(prev)}`
                      : `ปัจจุบัน: ${fmtNum(val)} | ก่อนหน้า: ${fmtNum(prev)} | % คำนวณไม่ได้`
                    return (
                      <td key={ym} className="text-right" style={heat(prevCurrPct(r, latest, previous))}>
                        <div className="tooltip tooltip-left" data-tip={tip} title={title}>
                          <span>{fmtNum(val)}</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
