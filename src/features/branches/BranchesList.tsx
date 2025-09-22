import { useQuery } from '@tanstack/react-query'
import { getBranches } from '../../api/branches'
import { useEffect, useState } from 'react'

export default function BranchesList() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['branches', { q: debouncedQ }],
    queryFn: () => getBranches({ q: debouncedQ, limit: 20, offset: 0 }),
  })

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-3">
        <div className="flex items-end gap-2">
          <label className="form-control w-full max-w-xs">
            <div className="label"><span className="label-text">Search Branch</span></div>
            <input
              className="input input-bordered"
              placeholder="e.g., BA01"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button className="btn btn-outline" onClick={() => refetch()}>Search</button>
        </div>

        {isFetching && <div className="text-sm opacity-70">Loading…</div>}
        {isError && <div className="text-error">{(error as Error).message}</div>}

        {!isFetching && data && (
          <div>
            <div className="mb-2 text-sm opacity-70">Total: {data.total}</div>
            <ul className="menu bg-base-200 rounded-box">
              {data.items.map((b) => (
                <li key={b.code}><span className="font-mono">{b.code}</span></li>
              ))}
              {data.items.length === 0 && <li className="opacity-70">No branches</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

