import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { apiRequest } from '../../shared/api/client'

type GridTeamBase = { id: string; name: string; shortName?: string; logoUrl?: string }
type GridSeries = {
  id: string
  startTimeScheduled: string
  format?: { nameShortened: string }
  tournament?: { id: string; nameShortened: string }
  title?: { id: string; name: string }
  teams: { baseInfo: GridTeamBase }[]
}

const TITLE_LABELS: Record<string, string> = { '28': 'CS2', '2': 'Dota2', '1': 'CS:GO' }
const TITLE_COLOR: Record<string, string> = { '28': '#e8a100', '2': '#c0392b', '1': '#e8a100' }
const TITLE_ICON: Record<string, string> = { '28': '🔫', '2': '🗡️', '1': '🔫' }

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function TeamLogo({ team }: { team: GridTeamBase }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {team.logoUrl
        ? <img src={team.logoUrl} alt={team.name} style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4, background: 'rgb(255 255 255 / 8%)' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        : <span style={{ width: 26, height: 26, borderRadius: 4, background: 'rgb(255 255 255 / 10%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)' }}>{(team.shortName ?? team.name).slice(0, 2).toUpperCase()}</span>
      }
      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{team.shortName ?? team.name}</span>
    </div>
  )
}

function SeriesRow({ s }: { s: GridSeries }) {
  const [tA, tB] = s.teams
  const titleId = s.title?.id ?? '28'
  const now = Date.now()
  const start = new Date(s.startTimeScheduled).getTime()
  const isUpcoming = start > now
  const isPast = start < now - 4 * 3600_000

  return (
    <Link to={`/grid/${s.id}`} className="match-row" style={{ color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        {tA?.baseInfo ? <TeamLogo team={tA.baseInfo} /> : <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>TBD</span>}
      </div>

      <div className="match-mid">
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4,
          background: TITLE_COLOR[titleId] + '22', color: TITLE_COLOR[titleId],
        }}>
          {TITLE_ICON[titleId]} {TITLE_LABELS[titleId] ?? s.title?.name}
        </span>
        {isUpcoming
          ? <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>⏰ {formatTime(s.startTimeScheduled)}</span>
          : isPast
            ? <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgb(255 255 255 / 6%)', color: 'var(--muted)' }}>Kết thúc</span>
            : <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: '#ff3b3b22', color: '#ff3b3b', fontWeight: 700 }}>● LIVE</span>
        }
        <span style={{ fontSize: '0.72rem', color: 'var(--muted-2)' }}>{s.format?.nameShortened} · {s.tournament?.nameShortened}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
        {tB?.baseInfo ? <TeamLogo team={tB.baseInfo} /> : <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>TBD</span>}
      </div>
    </Link>
  )
}

export function GridSeriesPage() {
  const [tab, setTab] = useState<'all' | 'cs2' | 'dota2'>('all')

  const titleIds = tab === 'cs2' ? '28' : tab === 'dota2' ? '2' : '28,2'

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['grid-schedule', titleIds],
    queryFn: () => apiRequest<GridSeries[]>(`/grid/schedule?titleIds=${titleIds}`),
    staleTime: 60_000,
  })

  const now = Date.now()
  const live = series.filter(s => {
    const t = new Date(s.startTimeScheduled).getTime()
    return t < now && t > now - 4 * 3600_000
  })
  const upcoming = series.filter(s => new Date(s.startTimeScheduled).getTime() > now)
  const past = series.filter(s => new Date(s.startTimeScheduled).getTime() < now - 4 * 3600_000)

  return (
    <div className="page-padding content-shell">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>🎮 CS2 & Dota2</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>Lịch thi đấu & kết quả từ GRID esports</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['all', 'cs2', 'dota2'] as const).map(t => (
            <button key={t} className="tab" onClick={() => setTab(t)}
              style={{ background: tab === t ? 'var(--accent)' : undefined, color: tab === t ? '#fff' : undefined, fontWeight: tab === t ? 700 : undefined }}>
              {t === 'all' ? 'Tất cả' : t === 'cs2' ? '🔫 CS2' : '🗡️ Dota2'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="match-row" style={{ opacity: 0.3, pointerEvents: 'none', minHeight: 64 }} />
          ))}
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {/* Live */}
          {live.length > 0 && (
            <div className="section-stack">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ff3b3b' }}>Đang diễn ra</span>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {live.map(s => <SeriesRow key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="section-stack">
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>⏰ Sắp diễn ra</div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {upcoming.map(s => <SeriesRow key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="section-stack">
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>✅ Đã kết thúc</div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {past.slice(0, 20).map(s => <SeriesRow key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {series.length === 0 && (
            <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
              Không có trận nào trong khoảng thời gian này.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
