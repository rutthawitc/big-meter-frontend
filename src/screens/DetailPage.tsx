import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getBranches } from "../api/branches";
import type { BranchItem } from "../api/branches";
import { getCustCodes } from "../api/custcodes";
import type { CustCodeItem } from "../api/custcodes";
import { getDetails } from "../api/details";
import type { DetailItem } from "../api/details";

type ViewMode = "compact" | "expanded";

type AppliedFilters = {
  branch: string;
  ym: string;
};

type Row = {
  key: string;
  branchCode: string;
  orgName: string | null;
  custCode: string;
  useType: string | null;
  useName: string | null;
  custName: string | null;
  address: string | null;
  routeCode: string | null;
  meterNo: string | null;
  meterSize: string | null;
  meterBrand: string | null;
  meterState: string | null;
  average: number | null;
  presentMeterCount: number | null;
  values: Record<string, number>;
};

const DEFAULT_THRESHOLD = 10;
const DEFAULT_COMPACT_MONTHS = 6;
const MAX_HISTORY_MONTHS = 12;
const COMPACT_OPTIONS = [3, 6, 12] as const;
const STORAGE_KEYS = {
  threshold: "detail.threshold",
  compact: "detail.compact",
  compactMonths: "detail.compactMonths",
};

export default function DetailPage() {
  const [branch, setBranch] = useState("");
  const [latestYm, setLatestYm] = useState(() => defaultLatestYm());
  const [threshold, setThreshold] = useState(() =>
    loadNumber(STORAGE_KEYS.threshold, DEFAULT_THRESHOLD),
  );
  const [view, setView] = useState<ViewMode>(() =>
    loadBoolean(STORAGE_KEYS.compact, true) ? "compact" : "expanded",
  );
  const [compactMonths, setCompactMonths] = useState(() =>
    coerceCompactMonths(
      loadNumber(STORAGE_KEYS.compactMonths, DEFAULT_COMPACT_MONTHS),
    ),
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [applied, setApplied] = useState<AppliedFilters | null>(null);

  useEffect(() => {
    persistNumber(STORAGE_KEYS.threshold, threshold);
  }, [threshold]);

  useEffect(() => {
    persistBoolean(STORAGE_KEYS.compact, view === "compact");
  }, [view]);

  useEffect(() => {
    persistNumber(STORAGE_KEYS.compactMonths, compactMonths);
  }, [compactMonths]);

  useEffect(() => {
    setPage(1);
  }, [threshold, search, pageSize, view, compactMonths]);

  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });

  const custcodesQuery = useQuery({
    queryKey: ["custcodes", applied?.branch, applied?.ym],
    queryFn: () =>
      getCustCodes({ branch: applied!.branch, ym: applied!.ym, limit: 200 }),
    enabled: Boolean(applied),
  });

  const monthsAll = useMemo(
    () => (applied ? buildMonths(applied.ym, MAX_HISTORY_MONTHS) : []),
    [applied],
  );

  const detailQueries = useQueries({
    queries: monthsAll.map((ym) => ({
      queryKey: ["details", applied?.branch, ym],
      queryFn: () =>
        getDetails({
          branch: applied!.branch,
          ym,
          limit: 200,
          order_by: "present_water_usg",
          sort: "DESC",
        }),
      enabled: Boolean(applied),
      select: (data: { items: DetailItem[] }) => data.items,
    })),
  });

  const detailItems = useMemo(
    () => detailQueries.map((q) => q.data ?? []),
    [detailQueries],
  );
  const detailErrorResult = detailQueries.find((q) => q.error != null);
  const detailsError =
    detailErrorResult && detailErrorResult.error instanceof Error
      ? (detailErrorResult.error as KnownError)
      : undefined;

  const rows = useMemo(
    () =>
      applied
        ? combineRows(monthsAll, detailItems, custcodesQuery.data?.items ?? [])
        : [],
    [applied, monthsAll, detailItems, custcodesQuery.data?.items],
  );

  const prevMonth = monthsAll[1];
  const filteredRows = useMemo(
    () => filterRows(rows, applied?.ym, prevMonth, threshold, search),
    [rows, applied?.ym, prevMonth, threshold, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize,
  );
  const monthsToDisplay = useMemo(
    () => (view === "expanded" ? monthsAll : monthsAll.slice(0, compactMonths)),
    [monthsAll, view, compactMonths],
  );

  const isLoading =
    Boolean(applied) &&
    (custcodesQuery.isLoading || detailQueries.some((q) => q.isLoading));
  const isFetching =
    Boolean(applied) &&
    (custcodesQuery.isFetching || detailQueries.some((q) => q.isFetching));
  const custcodesError =
    custcodesQuery.error instanceof Error
      ? (custcodesQuery.error as KnownError)
      : undefined;
  const error = detailsError;
  const warning = !error && custcodesError ? custcodesError : undefined;

  const yearOptionsList = useMemo(() => yearOptions(), []);

  function handleApply() {
    if (!branch) return;
    setApplied({ branch, ym: latestYm });
    setPage(1);
  }

  function handleReset() {
    setBranch("");
    const nextYm = defaultLatestYm();
    setLatestYm(nextYm);
    setThreshold(DEFAULT_THRESHOLD);
    setView("compact");
    setCompactMonths(DEFAULT_COMPACT_MONTHS);
    setSearch("");
    setPage(1);
    setPageSize(10);
    setApplied(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              ระบบแสดงผลผู้ใช้น้ำรายใหญ่
            </h1>
            <p className="mt-1 text-sm text-slate-500 md:text-base">
              แดชบอร์ดสรุปข้อมูลการใช้น้ำ
            </p>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            Home
          </a>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-700">
            ตัวกรองข้อมูล
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                เดือน/ปี
              </label>
              <div className="flex gap-2">
                <select
                  className="w-full rounded-md border border-slate-300 p-2"
                  value={Number(latestYm.slice(4, 6))}
                  onChange={(event) =>
                    setLatestYm(
                      partsToYm({
                        ...ymParts(latestYm),
                        m: Number(event.target.value),
                      }),
                    )
                  }
                >
                  {TH_MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-slate-300 p-2"
                  value={Number(latestYm.slice(0, 4))}
                  onChange={(event) =>
                    setLatestYm(
                      partsToYm({
                        ...ymParts(latestYm),
                        y: Number(event.target.value),
                      }),
                    )
                  }
                >
                  {yearOptionsList.map((year) => (
                    <option key={year} value={year}>
                      {year + 543}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                สาขา
              </label>
              <select
                className="w-full rounded-md border border-slate-300 p-2"
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
              >
                <option value="">เลือกสาขา</option>
                {(branchesQuery.data?.items ?? []).map((item) => (
                  <option key={item.code} value={item.code}>
                    {formatBranchLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                เปอร์เซ็นต์ผลต่าง (การใช้น้ำลดลง)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-32 rounded-md border border-slate-300 p-2"
                  value={threshold}
                  onChange={(event) =>
                    setThreshold(normalizeThreshold(event.target.value))
                  }
                />
                <span className="text-slate-600">%</span>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={handleReset}
                >
                  ล้างค่า
                </button>
                <button
                  type="button"
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  onClick={handleApply}
                  disabled={!branch}
                >
                  แสดงรายงาน
                </button>
              </div>
              <p className="text-xs text-slate-500">
                ข้อมูลจะโหลดเมื่อกดปุ่ม "แสดงรายงาน"
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                ผลลัพธ์:{" "}
                <span className="text-blue-600">{filteredRows.length}</span>{" "}
                รายชื่อที่เข้าเงื่อนไข
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span>คำอธิบายสี:</span>
                <Legend color="bg-yellow-400" label="5-15%" />
                <Legend color="bg-orange-500" label="15-30%" />
                <Legend color="bg-red-500" label="&gt; 30%" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาในตาราง..."
                  className="w-64 rounded-md border border-slate-300 py-2 pl-3 pr-10 text-sm"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                  🔍
                </span>
              </div>

              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => alert("Export coming soon")}
              >
                Export
              </button>

              <div className="inline-flex rounded-lg bg-slate-200 p-1 text-sm font-medium">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 ${view === "compact" ? "bg-white text-blue-600 shadow" : "text-slate-600"}`}
                  onClick={() => setView("compact")}
                >
                  ย่อ
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 ${view === "expanded" ? "bg-white text-blue-600 shadow" : "text-slate-600"}`}
                  onClick={() => setView("expanded")}
                >
                  ขยาย
                </button>
              </div>

              {view === "compact" && (
                <div className="inline-flex rounded-md border border-slate-300 text-sm">
                  {COMPACT_OPTIONS.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCompactMonths(option)}
                      className={`px-3 py-1 ${
                        compactMonths === option
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700"
                      } ${index === 0 ? "rounded-l-md" : ""} ${index === COMPACT_OPTIONS.length - 1 ? "rounded-r-md" : "border-r border-slate-300"}`}
                    >
                      {option} เดือน
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <label className="text-slate-600">แสดง:</label>
                <select
                  className="rounded-md border border-slate-300 p-1"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {!applied && (
            <EmptyState message="เลือกเดือนและสาขา แล้วกดแสดงรายงานเพื่อดูข้อมูล" />
          )}

          {applied && warning && <WarningState warning={warning} />}
          {applied && error && <ErrorState error={error} />}

          {applied && !error && (
            <div className="mt-6">
              {isLoading ? (
                <LoadingState />
              ) : (
                <>
                  <DataTable
                    rows={pageRows}
                    months={monthsToDisplay}
                    latestYm={applied.ym}
                    baseIndex={(page - 1) * pageSize}
                  />
                  {filteredRows.length === 0 && (
                    <div className="mt-4 rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      ไม่พบข้อมูลที่เข้าเงื่อนไขตามตัวกรองที่เลือก
                    </div>
                  )}
                </>
              )}

              <Pager page={page} totalPages={totalPages} onChange={setPage} />

              {isFetching && !isLoading && (
                <div className="mt-2 text-xs text-slate-500">
                  กำลังอัปเดตข้อมูลล่าสุด…
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DataTable({
  rows,
  months,
  latestYm,
  baseIndex,
}: {
  rows: Row[];
  months: string[];
  latestYm: string;
  baseIndex: number;
}) {
  if (!rows.length) return null;
  const prevYm = months[1];
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="p-3 text-left">ลำดับ</th>
            <th className="p-3 text-left">กปภ.สาขา</th>
            <th className="p-3 text-left">เลขที่ผู้ใช้น้ำ</th>
            <th className="p-3 text-left">ประเภท</th>
            <th className="p-3 text-left">รายละเอียด</th>
            <th className="p-3 text-left">ชื่อผู้ใช้น้ำ</th>
            <th className="p-3 text-left">ที่อยู่</th>
            <th className="p-3 text-left">เส้นทาง</th>
            <th className="p-3 text-left">หมายเลขมาตร</th>
            <th className="p-3 text-left">ขนาดมาตร</th>
            <th className="p-3 text-left">ยี่ห้อ</th>
            <th className="p-3 text-left">สถานะมาตร</th>
            <th className="p-3 text-right">หน่วยน้ำเฉลี่ย</th>
            <th className="p-3 text-right">เลขมาตรที่อ่านได้</th>
            <th className="p-3 text-right">หน่วยน้ำเดือนนี้</th>
            {months.slice(1).map((ym) => (
              <th key={ym} className="p-3 text-right">
                {fmtThMonth(ym)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, index) => {
            const latestValue = row.values[latestYm] ?? 0;
            const pct = prevYm
              ? computePct(row.values[prevYm], latestValue)
              : null;
            return (
              <tr key={row.key} className="hover:bg-slate-50">
                <td className="p-3">{baseIndex + index + 1}</td>
                <td className="p-3">{row.orgName ?? row.branchCode}</td>
                <td className="p-3 font-mono">{row.custCode}</td>
                <td className="p-3">{row.useType ?? "-"}</td>
                <td className="p-3">{row.useName ?? "-"}</td>
                <td className="p-3">{row.custName ?? "-"}</td>
                <td className="p-3">{row.address ?? "-"}</td>
                <td className="p-3">{row.routeCode ?? "-"}</td>
                <td className="p-3 font-mono">{row.meterNo ?? "-"}</td>
                <td className="p-3 text-center">{row.meterSize ?? "-"}</td>
                <td className="p-3">{row.meterBrand ?? "-"}</td>
                <td className="p-3">{row.meterState ?? "-"}</td>
                <td className="p-3 text-right">
                  {row.average != null ? fmtNum(row.average) : "-"}
                </td>
                <td className="p-3 text-right">
                  {row.presentMeterCount != null
                    ? fmtNum(row.presentMeterCount)
                    : "-"}
                </td>
                <td className="p-3 text-right">
                  {renderCurrentMonth(latestValue, pct)}
                </td>
                {months.slice(1).map((ym) => (
                  <td key={ym} className="p-3 text-right">
                    {fmtNum(row.values[ym] ?? 0)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (value: number) => void;
}) {
  if (!totalPages) return null;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pages: Array<number | "…"> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
      <div className="text-sm text-slate-500">
        หน้า {page} จาก {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:text-slate-400"
          disabled={!canPrev}
          onClick={() => canPrev && onChange(page - 1)}
        >
          &laquo; ก่อนหน้า
        </button>
        {pages.map((value, index) =>
          value === "…" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              className={`h-8 w-8 rounded-md text-sm ${value === page ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}
              onClick={() => onChange(value)}
            >
              {value}
            </button>
          ),
        )}
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:text-slate-400"
          disabled={!canNext}
          onClick={() => canNext && onChange(page + 1)}
        >
          ถัดไป &raquo;
        </button>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function WarningState({ warning }: { warning: KnownError }) {
  const message = interpretErrorMessage(warning);
  return (
    <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
      <p>{message.main}</p>
      {message.detail && (
        <p className="mt-2 text-xs opacity-80">
          รายละเอียดระบบ: {message.detail}
        </p>
      )}
    </div>
  );
}

function ErrorState({ error }: { error: KnownError }) {
  const message = interpretErrorMessage(error);
  return (
    <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p>{message.main}</p>
      {message.detail && (
        <p className="mt-2 text-xs opacity-80">
          รายละเอียดระบบ: {message.detail}
        </p>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-slate-200 p-8 text-sm text-slate-600">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      <span>กำลังโหลดข้อมูล…</span>
    </div>
  );
}

type KnownError = Error & { status?: number };

function renderCurrentMonth(value: number, pct: number | null) {
  const pctText =
    pct != null && isFinite(pct) && pct !== 0 ? ` (${fmtPct(pct)})` : "";
  const badgeClass = resolveBadgeClass(pct);
  return (
    <span className={`inline-block rounded px-2 py-1 text-xs ${badgeClass}`}>
      {fmtNum(value)}
      {pctText}
    </span>
  );
}

function resolveBadgeClass(pct: number | null) {
  if (pct == null || !isFinite(pct) || pct >= 0)
    return "bg-slate-100 text-slate-800";
  const drop = Math.abs(pct);
  if (drop > 30) return "bg-red-500/20 text-red-700";
  if (drop >= 15) return "bg-orange-500/20 text-orange-700";
  if (drop >= 5) return "bg-yellow-400/30 text-yellow-800";
  return "bg-slate-100 text-slate-800";
}

function computePct(prev?: number, curr?: number) {
  if (prev == null || prev === 0) return null;
  const prevVal = prev;
  const currVal = curr ?? 0;
  return ((currVal - prevVal) / prevVal) * 100;
}

function combineRows(
  months: string[],
  detailLists: DetailItem[][],
  metaItems: CustCodeItem[],
): Row[] {
  const metaMap = new Map(metaItems.map((item) => [item.cust_code, item]));
  const rows = new Map<string, Row>();
  const ensureRow = (custCode: string) => {
    const existing = rows.get(custCode);
    if (existing) return existing;
    const seed = metaMap.get(custCode);
    const base: Row = {
      key: custCode,
      branchCode: seed?.branch_code ?? "",
      orgName: seed?.org_name ?? null,
      custCode,
      useType: seed?.use_type ?? null,
      useName: seed?.use_name ?? null,
      custName: seed?.cust_name ?? null,
      address: seed?.address ?? null,
      routeCode: seed?.route_code ?? null,
      meterNo: seed?.meter_no ?? null,
      meterSize: seed?.meter_size ?? null,
      meterBrand: seed?.meter_brand ?? null,
      meterState: seed?.meter_state ?? null,
      average: null,
      presentMeterCount: null,
      values: {},
    };
    rows.set(custCode, base);
    return base;
  };

  detailLists.forEach((items, index) => {
    const ym = months[index];
    items.forEach((detail) => {
      const row = ensureRow(detail.cust_code);
      row.branchCode = detail.branch_code ?? row.branchCode;
      row.orgName = coalesce(row.orgName, detail.org_name);
      row.useType = coalesce(row.useType, detail.use_type);
      row.useName = coalesce(row.useName, detail.use_name);
      row.custName = coalesce(row.custName, detail.cust_name);
      row.address = coalesce(row.address, detail.address);
      row.routeCode = coalesce(row.routeCode, detail.route_code);
      row.meterNo = coalesce(row.meterNo, detail.meter_no);
      row.meterSize = coalesce(row.meterSize, detail.meter_size);
      row.meterBrand = coalesce(row.meterBrand, detail.meter_brand);
      row.meterState = coalesce(row.meterState, detail.meter_state);
      row.values[ym] = detail.present_water_usg ?? 0;
      if (index === 0) {
        row.average = detail.average ?? row.average;
        row.presentMeterCount =
          detail.present_meter_count ?? row.presentMeterCount;
      }
    });
  });

  metaItems.forEach((item) => {
    const row = ensureRow(item.cust_code);
    row.branchCode = item.branch_code ?? row.branchCode;
    row.orgName = coalesce(row.orgName, item.org_name);
    row.useType = coalesce(row.useType, item.use_type);
    row.useName = coalesce(row.useName, item.use_name);
    row.custName = coalesce(row.custName, item.cust_name);
    row.address = coalesce(row.address, item.address);
    row.routeCode = coalesce(row.routeCode, item.route_code);
    row.meterNo = coalesce(row.meterNo, item.meter_no);
    row.meterSize = coalesce(row.meterSize, item.meter_size);
    row.meterBrand = coalesce(row.meterBrand, item.meter_brand);
    row.meterState = coalesce(row.meterState, item.meter_state);
  });

  return Array.from(rows.values());
}

function filterRows(
  rows: Row[],
  latestYm: string | undefined,
  prevYm: string | undefined,
  threshold: number,
  search: string,
) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    const current = latestYm ? (row.values[latestYm] ?? 0) : 0;
    const previous = prevYm ? (row.values[prevYm] ?? 0) : 0;
    const pct = previous > 0 ? ((current - previous) / previous) * 100 : null;
    const passesThreshold =
      threshold <= 0 || (pct != null && pct <= -threshold);
    if (!passesThreshold) return false;
    if (!query) return true;
    return [
      row.orgName,
      row.custCode,
      row.useType,
      row.useName,
      row.custName,
      row.address,
      row.routeCode,
      row.meterNo,
      row.meterSize,
      row.meterBrand,
      row.meterState,
    ]
      .map((value) => (value == null ? "" : String(value).toLowerCase()))
      .some((value) => value.includes(query));
  });
}

function buildMonths(latest: string, count: number) {
  const months: string[] = [];
  let year = Number(latest.slice(0, 4));
  let month = Number(latest.slice(4, 6));
  for (let i = 0; i < count; i++) {
    months.push(`${year}${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return months;
}

function fmtNum(value: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(
    value,
  );
}

function fmtPct(value: number) {
  return `${new Intl.NumberFormat("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function fmtThMonth(ym: string) {
  const abbreviations = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const year = Number(ym.slice(0, 4)) + 543;
  const month = Number(ym.slice(4, 6));
  return `${abbreviations[month - 1]} ${String(year).slice(-2)}`;
}

function ymParts(ym: string) {
  return { y: Number(ym.slice(0, 4)), m: Number(ym.slice(4, 6)) };
}

function partsToYm(parts: { y: number; m: number }) {
  return `${parts.y}${String(parts.m).padStart(2, "0")}`;
}

function yearOptions() {
  const current = new Date().getFullYear();
  return [current + 1, current, current - 1, current - 2, current - 3];
}

function defaultLatestYm() {
  const now = new Date();
  const base =
    now.getDate() < 16
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
  return `${base.getFullYear()}${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeThreshold(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_THRESHOLD;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function coalesce<T>(
  current: T | null | undefined,
  next: T | null | undefined,
) {
  return next != null ? next : (current ?? null);
}

function loadNumber(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = raw == null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

function persistNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

function persistBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value ? "true" : "false");
}

function coerceCompactMonths(value: number) {
  if (COMPACT_OPTIONS.includes(value as (typeof COMPACT_OPTIONS)[number]))
    return value;
  return DEFAULT_COMPACT_MONTHS;
}

function formatBranchLabel(item: BranchItem) {
  return item.name ? `${item.code} - ${item.name}` : item.code;
}

function interpretErrorMessage(error: KnownError) {
  const status = error.status;
  const raw = (error.message ?? "").trim();
  if (status && status >= 500) {
    const main = /number of field descriptions/i.test(raw)
      ? "ระบบยังไม่สามารถเตรียมข้อมูล Top-200 ของสาขานี้ได้ โปรดลองอีกครั้งภายหลัง"
      : "ระบบไม่สามารถเชื่อมต่อข้อมูลจากเซิร์ฟเวอร์ได้ในขณะนี้";
    return { main, detail: raw || undefined };
  }
  if (status === 404) {
    return { main: "ไม่พบข้อมูลที่ร้องขอ", detail: raw || undefined };
  }
  if (status === 400) {
    return {
      main: "พารามิเตอร์ไม่ถูกต้อง กรุณาตรวจสอบค่าอีกครั้ง",
      detail: raw || undefined,
    };
  }
  if (raw) return { main: raw, detail: undefined };
  return { main: "เกิดข้อผิดพลาดไม่ทราบสาเหตุ", detail: undefined };
}
