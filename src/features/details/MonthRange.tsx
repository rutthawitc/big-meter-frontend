import { useMemo } from 'react'

type Props = {
  value: { from: string; to: string }
  onChange: (v: { from: string; to: string }) => void
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export default function MonthRange({ value, onChange }: Props) {
  const { from, to } = value
  const fromParts = ymParts(from)
  const toParts = ymParts(to)
  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return [y + 1, y, y - 1, y - 2]
  }, [])

  return (
    <div className="flex flex-wrap items-end gap-2">
      <MonthPicker label="กันยายน 2568" value={fromParts} years={years} onChange={(p) => onChange({ from: partsToYm(p), to })} />
      <span className="pb-3">ถึงเดือน</span>
      <MonthPicker label="สิงหาคม 2568" value={toParts} years={years} onChange={(p) => onChange({ from, to: partsToYm(p) })} />
    </div>
  )
}

function MonthPicker({ value, onChange, years }: { label: string; value: Parts; onChange: (p: Parts) => void; years: number[] }) {
  const thaiYear = (y: number) => y + 543
  return (
    <div className="join">
      <select className="select select-bordered join-item" value={value.m} onChange={(e) => onChange({ ...value, m: Number(e.target.value) })}>
        {TH_MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select className="select select-bordered join-item" value={value.y} onChange={(e) => onChange({ ...value, y: Number(e.target.value) })}>
        {years.map((y) => (
          <option key={y} value={y}>{thaiYear(y)}</option>
        ))}
      </select>
    </div>
  )
}

type Parts = { y: number; m: number }
function ymParts(ym: string): Parts { return { y: Number(ym.slice(0, 4)), m: Number(ym.slice(4, 6)) } }
function partsToYm(p: Parts): string { return `${p.y}${String(p.m).padStart(2, '0')}` }

