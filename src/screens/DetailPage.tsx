import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReportMonth from "../features/details/ReportMonth";
import WideDetailsTable from "../features/details/WideDetailsTable";
import BranchSelect from "../features/branches/BranchSelect";

export default function DetailPage() {
  const [branch, setBranch] = useState("");
  const [latestYm, setLatestYm] = useState<string>(defaultLatestYm());
  const [threshold, setThreshold] = useState<number>(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem('detail.threshold') : null;
    const n = s != null ? Number(s) : 10;
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 10;
  });
  const [compact, setCompact] = useState<boolean>(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem('detail.compact') : null;
    return s == null ? true : s === 'true';
  });
  const [compactMonths, setCompactMonths] = useState<number>(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem('detail.compactMonths') : null;
    const n = s != null ? Number(s) : 3;
    return n === 6 || n === 12 ? n : 3;
  });
  const [tableQuery, setTableQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    try { localStorage.setItem('detail.threshold', String(threshold)); } catch {}
  }, [threshold]);
  useEffect(() => {
    try { localStorage.setItem('detail.compact', String(compact)); } catch {}
  }, [compact]);
  useEffect(() => {
    try { localStorage.setItem('detail.compactMonths', String(compactMonths)); } catch {}
  }, [compactMonths]);

  const months = useMemo(() => monthsBack(latestYm, 12), [latestYm]);
  const controlsDisabled = !branch;

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="navbar bg-base-100 shadow">
        <div className="flex-1 px-2 text-xl font-semibold">
          ระบบแสดงผลผู้ใช้น้ำรายใหญ่
        </div>
        <div className="flex-none">
          <Link to="/" className="btn btn-ghost">Home</Link>
        </div>
      </div>

      <main className="container mx-auto p-6 grid gap-6">
        <section className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <h2 className="card-title">ตัวกรองข้อมูล</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
              <label className="form-control">
                <div className="label"><span className="label-text">เดือน/ปี</span></div>
                <ReportMonth value={latestYm} onChange={setLatestYm} disabled={false} />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text">สาขา</span></div>
                <BranchSelect value={branch} onChange={setBranch} />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text">เปอร์เซ็นต์ผลต่าง (น้อยกว่า)</span></div>
                <label className="input input-bordered flex items-center gap-2 w-40">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="grow"
                    value={threshold}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(100, Number(e.target.value || 0)));
                      setThreshold(v);
                    }}
                  />
                  <span className="opacity-70">%</span>
                </label>
              </label>

              <div className="flex gap-2 justify-end md:col-span-2 lg:col-span-1">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setBranch("")
                    setThreshold(10)
                    setCompact(true)
                    setCompactMonths(3)
                    setTableQuery("")
                    setPageSize(10)
                    setSubmitted(false)
                  }}
                >ล้างค่า</button>
                <button
                  className="btn btn-primary"
                  onClick={() => setSubmitted(true)}
                  disabled={!branch}
                >แสดงรายงาน</button>
              </div>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow">
          <div className="card-body gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="input input-bordered flex items-center gap-2 w-full md:w-80">
                <span className="opacity-70">🔎</span>
                <input
                  className="grow"
                  placeholder="ค้นหาในตาราง..."
                  value={tableQuery}
                  onChange={(e) => setTableQuery(e.target.value)}
                  disabled={!submitted || !branch}
                />
              </label>
              <button className="btn" disabled={!submitted || !branch} onClick={() => alert('Export CSV is coming soon')}>⭳ Export</button>
              <div className="join">
                <button className={`btn btn-outline join-item ${compact ? '' : 'btn-active'}`} onClick={() => setCompact(false)}>ขยาย</button>
                <button className={`btn btn-outline join-item ${compact ? 'btn-active' : ''}`} onClick={() => setCompact(true)}>ย่อ</button>
              </div>
              <div className={`join ${compact ? '' : 'opacity-50 pointer-events-none'}`}>
                <button className={`btn btn-outline join-item ${compactMonths === 3 ? 'btn-active' : ''}`} onClick={() => setCompactMonths(3)}>3 เดือน</button>
                <button className={`btn btn-outline join-item ${compactMonths === 6 ? 'btn-active' : ''}`} onClick={() => setCompactMonths(6)}>6 เดือน</button>
                <button className={`btn btn-outline join-item ${compactMonths === 12 ? 'btn-active' : ''}`} onClick={() => setCompactMonths(12)}>12 เดือน</button>
              </div>

              <label className="form-control ml-auto w-36">
                <div className="label"><span className="label-text">แสดง:</span></div>
                <select className="select select-bordered" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} disabled={!submitted || !branch}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            {submitted && branch ? (
              <WideDetailsTable
                branch={branch}
                months={months}
                threshold={threshold}
                compact={compact}
                compactMonths={compactMonths}
                query={tableQuery}
                pageSize={pageSize}
              />
            ) : (
              <div className="alert">กรุณาเลือกสาขาและกด "แสดงรายงาน"</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function monthsBack(latest: string, back: number): string[] {
  const parse = (ym: string) => ({
    y: Number(ym.slice(0, 4)),
    m: Number(ym.slice(4, 6)),
  });
  let a = parse(latest);
  const out: string[] = [];
  for (let i = 0; i <= back; i++) {
    out.push(`${a.y}${String(a.m).padStart(2, "0")}`);
    a = a.m === 1 ? { y: a.y - 1, m: 12 } : { y: a.y, m: a.m - 1 };
  }
  return out;
}

function defaultLatestYm(): string {
  const now = new Date();
  // If day < 16, consider current reporting month as previous month
  const report = new Date(
    now.getFullYear(),
    now.getMonth() - (now.getDate() < 16 ? 1 : 0),
    1,
  );
  return toYm(report);
}

function toYm(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}
