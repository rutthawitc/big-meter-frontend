type Props = { value: number; onChange: (n: number) => void; disabled?: boolean }

export default function PercentSlider({ value, onChange, disabled }: Props) {
  return (
    <div className={`grid gap-2 w-full max-w-xl ${disabled ? 'opacity-50' : ''}`} aria-disabled={disabled}>
      <div className="text-sm">เลือก % ผลต่าง</div>
      <input
        type="range"
        min={0}
        max={50}
        step={5}
        value={Math.max(0, Math.min(50, Math.round(value / 5) * 5))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
        disabled={disabled}
      />
      <div className="flex w-full justify-between text-xs px-1 opacity-70">
        {Array.from({ length: 11 }, (_, i) => i * 5).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  )
}
