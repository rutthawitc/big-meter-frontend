import { useEffect, useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getBranches } from '../api/branches'
import { getCustCodes } from '../api/custcodes'
import { getDetails } from '../api/details'

type ViewMode = 'compact' | 'expanded'

export default function DetailPage() {
  const [branch, setBranch] = useState('')
  const [latestYm, setLatestYm] = useState(defaultLatestYm())
  const [threshold, setThreshold] = useState(10)
  const [view, setView] = useState<ViewMode>('compact')
  const [monthRange, setMonthRange] = useState(3)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => setPage(1), [branch, latestYm, threshold, q, pageSize, view, monthRange])

  const monthsAll = useMemo(() => monthsBack(latestYm, 12), [latestYm])
  const displayMonths = useMemo(() => (view === 'compact' ? monthsAll.slice(0, monthRange) : monthsAll), [monthsAll, view, monthRange])

  const branches = useQuery({ queryKey: ['branches'], queryFn: () => getBranches({ limit: 500 }) })

  const queries = useQueries({
    queries: monthsAll.map((ym) => ({
      queryKey: ['details', { branch, ym }],
      queryFn: () => getDetails({ branch, ym, limit: 200, offset: 0 }),
      enabled: Boolean(branch && ym),
    })),
  })
  const { data: cust } = useQuery({
    queryKey: ['custcodes', { branch, ym: latestYm }],
    queryFn: () => getCustCodes({ branch, ym: latestYm, limit: 200 }),
    enabled: Boolean(branch && latestYm),
  })

  const loading = queries.some((q) => q.isLoading)
  const items = useMemo(() => combine(monthsAll, queries.map((q) => q.data?.items ?? []), cust?.items ?? []), [monthsAll, queries, cust])

  const filtered = useMemo(() => filterRows(items, latestYm, threshold, q), [items, latestYm, threshold, q])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">ระบบแสดงผลผู้ใช้น้ำรายใหญ่</h1>
            <p className="text-slate-500 mt-1">แดชบอร์ดสรุปข้อมูลการใช้น้ำ</p>
          </div>
          <a href="/" className="text-slate-600 hover:text-blue-600">Home</a>
        </header>

        <section className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">ตัวกรองข้อมูล</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">เดือน/ปี</label>
              <div className="flex gap-2">
                <select className="w-full p-2 border border-slate-300 rounded-md" value={ymParts(latestYm).m} onChange={(e)=>setLatestYm(partsToYm({ ...ymParts(latestYm), m: Number(e.target.value) }))}>
                  {TH_MONTHS.map((m, i)=> <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select className="w-full p-2 border border-slate-300 rounded-md" value={ymParts(latestYm).y} onChange={(e)=>setLatestYm(partsToYm({ ...ymParts(latestYm), y: Number(e.target.value) }))}>
                  {yearOptions().map((y)=> <option key={y} value={y}>{y+543}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">สาขา</label>
              <select className="w-full p-2 border border-slate-300 rounded-md" value={branch} onChange={(e)=>setBranch(e.target.value)}>
                <option value="">เลือกสาขา</option>
                {(branches.data?.items ?? []).map((b)=> <option key={b.code} value={b.code}>{b.code}{b.name?` - ${b.name}`:''}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">เปอร์เซ็นต์ผลต่าง (น้อยกว่า)</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={threshold} onChange={(e)=>setThreshold(Math.max(0, Math.min(100, Number(e.target.value||0))))} className="w-40 p-2 border border-slate-300 rounded-md" />
                <span className="text-slate-600">%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">ผลลัพธ์: <span className="text-blue-600">{filtered.length} รายชื่อ</span> ที่เข้าเงื่อนไข</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span>คำอธิบายสี:</span>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span><span>= 5-15%</span></div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span><span>= 15-30%</span></div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span><span>&gt; 30%</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
              <div className="relative">
                <input type="text" placeholder="ค้นหาในตาราง..." className="w-full md:w-auto p-2 border border-slate-300 rounded-md pl-3" value={q} onChange={(e)=>setQ(e.target.value)} />
              </div>
              <button className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300" onClick={()=>alert('Export coming soon')}>Export</button>
              <div className="flex items-center rounded-lg bg-slate-200 p-1 text-sm font-medium">
                <button onClick={()=>setView('compact')} className={`px-3 py-1 rounded-md ${view==='compact'?'bg-white text-blue-600 shadow':'text-slate-600'}`}>ย่อ</button>
                <button onClick={()=>setView('expanded')} className={`px-3 py-1 rounded-md ${view==='expanded'?'bg-white text-blue-600 shadow':'text-slate-600'}`}>ขยาย</button>
              </div>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <RangeBtn n={3} active={view==='compact' && monthRange===3} onClick={()=>setMonthRange(3)} />
                <RangeBtn n={6} active={view==='compact' && monthRange===6} onClick={()=>setMonthRange(6)} />
                <RangeBtn n={12} active={view==='compact' && monthRange===12} onClick={()=>setMonthRange(12)} />
              </div>
              <div className="flex items-center gap-2 text-sm ml-auto">
                <label className="text-slate-600">แสดง:</label>
                <select className="p-1 border border-slate-300 rounded-md" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}>
                  <option>10</option><option>25</option><option>50</option>
                </select>
              </div>
            </div>
          </div>

          <DataTable rows={pageRows} months={displayMonths} latestYm={latestYm} baseIndex={(page-1)*pageSize} />
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
          {loading && <div className="mt-2 text-sm text-slate-500">กำลังโหลดข้อมูล…</div>}
        </section>
      </div>
    </div>
  )
}

function DataTable({ rows, months, latestYm, baseIndex }: { rows: Row[]; months: string[]; latestYm: string; baseIndex: number }) {
  const headers = months
  const prevYm = months[1] // เดือนก่อนหน้า (ตำแหน่งที่ 1 ของชุด months)
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="p-3 text-left">ลำดับ</th>
            <th className="p-3 text-left">กปภ.สาขา</th>
            <th className="p-3 text-left">เลขที่ผู้ใช้น้ำ</th>
            <th className="p-3 text-left">ชื่อผู้ใช้น้ำ</th>
            <th className="p-3 text-left">หมายเลขมาตร</th>
            <th className="p-3">ขนาดมาตร</th>
            <th className="p-3 text-right">หน่วยน้ำเดือนนี้</th>
            {headers.slice(1).map((ym)=> <th key={ym} className="p-3 text-right">{fmtThMonth(ym)}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((r, i)=> (
            <tr key={r.key} className="hover:bg-slate-50">
              <td className="p-3">{baseIndex + i + 1}</td>
              <td className="p-3">{r.org_name ?? r.branch}</td>
              <td className="p-3 font-mono">{r.cust_code}</td>
              <td className="p-3">{r.cust_name ?? '-'}</td>
              <td className="p-3 font-mono">{r.meter_no ?? '-'}</td>
              <td className="p-3 text-center">{r.meter_size ?? '-'}</td>
              <td className="p-3 text-right">{CurrentMonthPill(curr(r, latestYm), currPct(r, latestYm, prevYm))}</td>
              {headers.slice(1).map((ym)=> (
                <td key={ym} className="p-3 text-right">{fmtNum(r.values[ym] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RangeBtn({ n, active, onClick }: { n: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1 text-sm font-medium border ${active? 'bg-blue-100 text-blue-700 border-blue-300':'bg-white text-slate-900 border-slate-300'} ${n===3?'rounded-l-lg':''} ${n===12?'rounded-r-md':'border-r-0'}`}>{n} เดือน</button>
  )
}

function CurrentMonthPill(value?: number, pct?: number) {
  const cls = pct === undefined || pct >= 0 ? 'bg-slate-100 text-slate-800' : Math.abs(pct) > 30 ? 'bg-red-500/20 text-red-700' : Math.abs(pct) >= 15 ? 'bg-orange-500/20 text-orange-700' : Math.abs(pct) >= 5 ? 'bg-yellow-400/30 text-yellow-800' : 'bg-slate-100 text-slate-800'
  return <span className={`inline-block px-2 py-1 rounded text-xs ${cls}`}>{fmtNum(value ?? 0)}{pct!=null && isFinite(pct) && pct!==0 ? ` (${fmtPct(pct)})` : ''}</span>
}

// ----- helpers -----
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

type Row = {
  key: string
  branch: string
  org_name: string | null
  cust_code: string
  cust_name: string | null
  meter_no: string | null
  meter_size: string | null
  values: Record<string, number>
}

function combine(months: string[], lists: Item[][], metaItems: any[]): Row[] {
  const map = new Map<string, Row>()
  const meta = new Map(metaItems.map((m) => [m.cust_code, m]))
  lists.forEach((items, idx) => {
    const ym = months[idx]
    items.forEach((it) => {
      const key = it.cust_code
      const base = map.get(key) ?? {
        key,
        branch: it.branch_code,
        org_name: it.org_name ?? meta.get(key)?.org_name ?? null,
        cust_code: it.cust_code,
        cust_name: it.cust_name ?? meta.get(key)?.cust_name ?? null,
        meter_no: it.meter_no ?? meta.get(key)?.meter_no ?? null,
        meter_size: it.meter_size ?? meta.get(key)?.meter_size ?? null,
        values: {},
      }
      base.values[ym] = it.present_water_usg
      map.set(key, base)
    })
  })
  // seed missing from meta (top-200)
  metaItems.forEach((m)=>{
    if(!map.has(m.cust_code)){
      map.set(m.cust_code, { key: m.cust_code, branch: m.branch_code ?? '', org_name: m.org_name ?? null, cust_code: m.cust_code, cust_name: m.cust_name ?? null, meter_no: m.meter_no ?? null, meter_size: m.meter_size ?? null, values: {} })
    }
  })
  return Array.from(map.values())
}

function filterRows(rows: Row[], latestYm: string, threshold: number, q: string) {
  const searched = q.trim().toLowerCase()
  return rows
    .filter((r) => {
      const prev = r.values[monthsBack(latestYm, 12)[1]] ?? 0
      const curr = r.values[latestYm] ?? 0
      const pct = prev ? ((curr - prev) / prev) * 100 : 0
      return threshold <= 0 || pct <= -threshold
    })
    .filter((r) =>
      searched
        ? [r.org_name ?? '', r.cust_code, r.cust_name ?? '', r.meter_no ?? '', r.meter_size ?? '']
            .some((v) => String(v).toLowerCase().includes(searched))
        : true
    )
}

function curr(r: Row, ym: string) { return r.values[ym] ?? 0 }
function currPct(r: Row, currYm: string, prevYm?: string) {
  if (!prevYm) return 0
  const prev = r.values[prevYm] ?? 0
  const curr = r.values[currYm] ?? 0
  return prev ? ((curr - prev) / prev) * 100 : 0
}

const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
function ymParts(ym: string) { return { y: Number(ym.slice(0,4)), m: Number(ym.slice(4,6)) } }
function partsToYm(p: {y:number;m:number}) { return `${p.y}${String(p.m).padStart(2, '0')}` }
function yearOptions() { const y = new Date().getFullYear(); return [y+1,y,y-1,y-2] }
function monthsBack(latest: string, back: number): string[] { const out: string[]=[]; let y=Number(latest.slice(0,4)), m=Number(latest.slice(4,6)); for(let i=0;i<=back;i++){ out.push(`${y}${String(m).padStart(2,'0')}`); if(m===1){y--;m=12;}else m--; } return out }
function fmtThMonth(ym: string) { const abbr=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']; const y=Number(ym.slice(0,4))+543; const m=Number(ym.slice(4,6)); return `${abbr[m-1]} ${String(y).slice(-2)}` }
function fmtNum(n: number){ return new Intl.NumberFormat('th-TH',{ maximumFractionDigits:2 }).format(n) }
function fmtPct(p: number){ return `${new Intl.NumberFormat('th-TH',{ minimumFractionDigits:1, maximumFractionDigits:1 }).format(p)}%` }
function defaultLatestYm(){ const now = new Date(); const d = now.getDate()<16 ? new Date(now.getFullYear(), now.getMonth()-1,1) : new Date(now.getFullYear(), now.getMonth(),1); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}` }

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number)=>void }){
  const canPrev = page>1, canNext = page<totalPages
  const pages = (()=>{ const out:(number|string)[]=[]; for(let i=1;i<=totalPages;i++){ if(i===1||i===totalPages||Math.abs(i-page)<=1) out.push(i); else if(out[out.length-1]!=="…") out.push("…") } return out })()
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
      <div />
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-md hover:bg-slate-100 text-slate-500" disabled={!canPrev} onClick={()=>canPrev && onChange(page-1)}>&laquo; ก่อนหน้า</button>
        {pages.map((p,idx)=> typeof p==='number' ? (
          <button key={idx} className={`p-2 w-8 h-8 rounded-md ${p===page? 'bg-blue-600 text-white':'hover:bg-slate-100'}`} onClick={()=>onChange(p)}>{p}</button>
        ) : (<span key={idx} className="p-2">…</span>))}
        <button className="p-2 rounded-md hover:bg-slate-100 text-slate-500" disabled={!canNext} onClick={()=>canNext && onChange(page+1)}>ถัดไป &raquo;</button>
      </div>
    </div>
  )
}

