import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import DetailPage from './screens/DetailPage'

const router = createBrowserRouter([
  { path: '/', element: <DetailPage /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}

