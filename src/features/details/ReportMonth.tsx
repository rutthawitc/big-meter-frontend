type Props = {
  value: string // YYYYMM
  onChange: (ym: string) => void
  disabled?: boolean
}

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

export default function ReportMonth({ value, onChange, disabled }: Props) {
  const parts = ymParts(value)
  const years = (() => {
    const y = new Date().getFullYear()
    return [y + 1, y, y - 1, y - 2]
  })()
  const thaiYear = (y: number) => y + 543

  return (
    <div className={`join ${disabled ? 'opacity-50' : ''}`} aria-disabled={disabled}>
      <select
        className="select select-bordered join-item w-44"
        value={parts.m}
        onChange={(e) => onChange(partsToYm({ ...parts, m: Number(e.target.value) }))}
        disabled={disabled}
      >
        {TH_MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        className="select select-bordered join-item w-28"
        value={parts.y}
        onChange={(e) => onChange(partsToYm({ ...parts, y: Number(e.target.value) }))}
        disabled={disabled}
      >
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
