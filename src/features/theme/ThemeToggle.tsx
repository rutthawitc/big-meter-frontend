import { useTheme } from './useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button className="btn btn-ghost" onClick={toggle} aria-label="Toggle theme">
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-70">{theme === 'light' ? 'Light' : 'Dark'}</span>
        <input type="checkbox" className="toggle" checked={theme === 'dark'} readOnly />
      </div>
    </button>
  )
}

