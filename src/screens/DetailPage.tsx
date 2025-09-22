import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PercentSlider from "../features/details/PercentSlider";
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
          ระบบแสดงผลผู้ใช้น้ำรายใหญ่ 200 ราย
        </div>
        <div className="flex-none">
          <Link to="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>

      <main className="container mx-auto p-6 grid gap-6">
        <div className="grid gap-2">
          <div className="text-sm">เดือนรายงาน</div>
          <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
            <ReportMonth value={latestYm} onChange={setLatestYm} disabled={controlsDisabled} />
            <label className={`form-control w-72 ${controlsDisabled ? '' : ''}`}>
              <div className="label">
                <span className="label-text">สาขา</span>
              </div>
              <BranchSelect value={branch} onChange={setBranch} />
            </label>

            <div className={`grid gap-1 ${controlsDisabled ? 'opacity-50' : ''}`}>
              <div className="w-64">
                <PercentSlider value={threshold} onChange={setThreshold} disabled={controlsDisabled} />
              </div>
            </div>

            <div className={`grid gap-1 ${controlsDisabled ? 'opacity-50' : ''}`}>
              <div className="text-sm">ป้อนค่า % ผลต่างเอง (0 -100)</div>
              <label className="input input-bordered flex items-center gap-2 w-40">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  className="grow"
                  value={threshold}
                  disabled={controlsDisabled}
                  onChange={(e) => {
                    const v = Math.max(
                      0,
                      Math.min(100, Number(e.target.value || 0)),
                    );
                    setThreshold(v);
                  }}
                />
                <span className="opacity-70">%</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer gap-3">
                <span className="label-text">โหมดแสดงผล</span>
                <input type="checkbox" className="toggle" checked={!compact} onChange={() => setCompact(!compact)} />
                <span className="text-sm opacity-70">{compact ? 'แบบย่อ' : 'แบบเต็ม'}</span>
              </label>
            </div>

            <label className={`form-control w-40 ${(!compact || controlsDisabled) ? 'opacity-50' : ''}`}>
              <div className="label"><span className="label-text">จำนวนเดือน (มินิมอล)</span></div>
              <select className="select select-bordered" value={compactMonths} onChange={(e)=>setCompactMonths(Number(e.target.value))} disabled={!compact || controlsDisabled}>
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={12}>12</option>
              </select>
            </label>
          </div>
        </div>

        {branch ? (
          <WideDetailsTable branch={branch} months={months} threshold={threshold} compact={compact} compactMonths={compactMonths} />
        ) : (
          <div className="alert">
            กรุณาเลือกสาขาเพื่อแสดงข้อมูล
          </div>
        )}
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
