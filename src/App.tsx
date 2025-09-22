import { useQuery } from '@tanstack/react-query'
import ThemeToggle from './features/theme/ThemeToggle'
import BranchesList from './features/branches/BranchesList'
import DetailsPanel from './features/details/DetailsPanel'
import SystemPanels from './features/system/SystemPanels'
import { Link } from 'react-router-dom'

function fetchHealth() {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  const url = `${(base ?? '').replace(/\/$/, '')}/api/v1/healthz`
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json().catch(() => ({}))
  })
}

export default function App() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="navbar bg-base-100 shadow">
        <div className="flex-1 px-2 text-xl font-semibold">Big Meter</div>
        <div className="flex-none flex items-center gap-2">
          {/* Details page removed */}
          <ThemeToggle />
          <a className="btn btn-primary btn-sm" href="https://vitejs.dev" target="_blank" rel="noreferrer">Vite</a>
        </div>
      </div>

      <main className="container mx-auto p-6 grid gap-6">
        <section className="grid gap-3">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p>Vite + React 19 + TanStack Query + daisyUI</p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">API Health</h2>
              {isLoading && <span className="loading loading-spinner loading-md" />}
              {isError && <div className="text-error">{(error as Error).message}</div>}
              {!isLoading && !isError && (
                <pre className="bg-base-200 p-3 rounded overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
              )}
            </div>
          </div>

          <BranchesList />
        </section>

        <DetailsPanel />

        <SystemPanels />
      </main>
    </div>
  )
}
