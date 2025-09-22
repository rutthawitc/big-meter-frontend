import { useQuery } from '@tanstack/react-query'
import { getBranches } from '../../api/branches'

type Props = {
  value: string
  onChange: (code: string) => void
  className?: string
}

export default function BranchSelect({ value, onChange, className }: Props) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['branches', 'all'],
    queryFn: () => getBranches({ limit: 500, offset: 0 }),
  })

  if (isError) return <div className="text-error">{(error as Error).message}</div>

  return (
    <select
      className={`select select-bordered ${className ?? ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
    >
      <option value="">เลือกสาขา</option>
      {(data?.items ?? []).map((b) => (
        <option key={b.code} value={b.code}>
          {b.code} — {b.name ?? b.code}
        </option>
      ))}
    </select>
  )
}
