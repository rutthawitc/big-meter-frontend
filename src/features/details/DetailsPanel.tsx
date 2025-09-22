import { useQuery } from '@tanstack/react-query'
import { getDetails } from '../../api/details'
import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 20

export default function DetailsPanel() {
  const [branch, setBranch] = useState('BA01')
  const [ym, setYm] = useState('202410')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => setPage(0), [branch, ym, q])

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['details', { branch, ym, q, page }],
    queryFn: () =>
      getDetails({ branch, ym, q: q.trim() || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    enabled: Boolean(branch && ym),
  })

  const items = (data?.items ?? []) as typeof data.items | []
  const totalPages = useMemo(() => (data && typeof data.total === 'number' ? Math.ceil(data.total / PAGE_SIZE) : 0), [data])

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <h2 className="card-title">Monthly Details</h2>

        <div className="flex flex-wrap items-end gap-3">
          <label className="form-control w-40">
            <div className="label"><span className="label-text">Branch</span></div>
            <input className="input input-bordered" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </label>
          <label className="form-control w-40">
            <div className="label"><span className="label-text">YearMonth (YYYYMM)</span></div>
            <input className="input input-bordered" value={ym} onChange={(e) => setYm(e.target.value)} />
          </label>
          <label className="form-control w-64">
            <div className="label"><span className="label-text">Search</span></div>
            <input className="input input-bordered" placeholder="cust_code, meter_no, name..." value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>

        {isError && <div className="text-error">{(error as Error).message}</div>}

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Cust</th>
                <th>Meter</th>
                <th className="text-right">Present</th>
                <th className="text-right">Count</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={`${it.cust_code}-${it.meter_no ?? ''}`} className={it.is_zeroed ? 'bg-warning/10' : ''}>
                  <td className="font-mono">{it.cust_code}</td>
                  <td className="font-mono">{it.meter_no ?? '-'}</td>
                  <td className="text-right">{fmtNum(it.present_water_usg)}</td>
                  <td className="text-right">{it.present_meter_count}</td>
                  <td className="font-mono">{it.route_code ?? '-'}</td>
                  <td>
                    {it.is_zeroed ? <span className="badge badge-warning">zeroed</span> : <span className="badge badge-success">active</span>}
                  </td>
                </tr>
              ))}
              {!isFetching && items.length === 0 && (
                <tr><td colSpan={6} className="opacity-70">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
          <div className="text-sm opacity-70">Page {totalPages ? page + 1 : 0} / {totalPages}</div>
          <button className="btn btn-sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          {isFetching && <span className="loading loading-spinner loading-sm" />}
        </div>
      </div>
    </div>
  )
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)
}
