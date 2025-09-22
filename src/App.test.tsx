import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

test('renders title', () => {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  )
  expect(screen.getByText(/Big Meter/i)).toBeInTheDocument()
})

