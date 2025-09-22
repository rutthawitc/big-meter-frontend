import { useQuery } from '@tanstack/react-query'
import { getVersion, getConfig } from '../../api/system'

export default function SystemPanels() {
  const v = useQuery({ queryKey: ['version'], queryFn: getVersion })
  const c = useQuery({ queryKey: ['config'], queryFn: getConfig })
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Version</h2>
          {v.isLoading ? (
            <span className="loading loading-spinner loading-md" />
          ) : v.isError ? (
            <div className="text-error">{(v.error as Error).message}</div>
          ) : (
            <pre className="bg-base-200 p-3 rounded overflow-auto text-sm">{JSON.stringify(v.data, null, 2)}</pre>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Config</h2>
          {c.isLoading ? (
            <span className="loading loading-spinner loading-md" />
          ) : c.isError ? (
            <div className="text-error">{(c.error as Error).message}</div>
          ) : (
            <pre className="bg-base-200 p-3 rounded overflow-auto text-sm">{JSON.stringify(c.data, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

