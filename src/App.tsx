import { Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold">Big Meter</h1>
        <p className="mt-2 text-slate-600">Frontend starter. Go to the new Detail report.</p>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <Link to="/details" className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Open Detail Report</Link>
        </div>
      </main>
    </div>
  )
}
