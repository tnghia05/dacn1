import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'

export function Btn({
  children,
  variant = 'primary',
  ...rest
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`btn btn-${variant}`} {...rest}>
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'live' | 'warn' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="section-header-row">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle ? <p className="section-sub">{subtitle}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  )
}

/** Emoji + đếm — chỉ tương tác UI. */
export function ReactionBar({ compact, seed = 0 }: { compact?: boolean; seed?: number }) {
  const [counts, setCounts] = useState({
    '👍': 21 + seed,
    '❤️': 8 + seed,
    '🔥': 5 + seed,
    '😂': 2 + seed,
  })

  const keys = Object.keys(counts) as (keyof typeof counts)[]

  return (
    <div className={`reaction-bar ${compact ? 'reaction-bar--compact' : ''}`} role="group" aria-label="Cảm xúc">
      {keys.map((emoji) => (
        <button key={emoji} type="button" onClick={() => setCounts((c) => ({ ...c, [emoji]: c[emoji] + 1 }))}>
          <span className="reaction-emoji">{emoji}</span>
          <span>{counts[emoji]}</span>
        </button>
      ))}
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? 'tab-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Signal bars for trending / analytics previews */
export function SignalMeter({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="signal-meter">
      <div className="signal-meter-head">
        <span>{label}</span>
        <span className="signal-meter-val">{value}</span>
      </div>
      <div className="signal-meter-track">
        <div className="signal-meter-fill" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      {hint ? <p className="signal-meter-hint">{hint}</p> : null}
    </div>
  )
}

export function ChartBars({
  data,
  title,
}: {
  title?: string
  data: { label: string; value: number }[]
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="chart-card">
      {title ? <h3 className="chart-title">{title}</h3> : null}
      <div className="chart-bars">
        {data.map((d) => (
          <div key={d.label} className="chart-row">
            <span>{d.label}</span>
            <div className="chart-track">
              <div className="chart-fill" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="chart-num">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** AI label badge (inline) */
export function AITag({ children = 'AI' }: { children?: ReactNode }) {
  return <span className="ai-tag">{children}</span>
}

/** Mini sparkline (dots) — for AI predict cards */
export function AISparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="ai-sparkline" aria-hidden>
      {values.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </div>
  )
}
