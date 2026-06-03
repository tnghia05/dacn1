import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { PandaScoreSerie } from '../../shared/api/types'
import { Badge, Tabs } from '../../shared/components/Ui'

// ── helpers ─────────────────────────────────────────────────────────────────

type SerieStatus = 'running' | 'upcoming' | 'past'

const GAME_FILTERS = [
  { id: '', label: 'Tất cả' },
  { id: 'lol', label: 'LoL' },
  { id: 'valorant', label: 'Valorant' },
  { id: 'cs-go', label: 'CS2' },
  { id: 'dota-2', label: 'Dota 2' },
]

function fetchSeries(status: SerieStatus, videogame: string): Promise<PandaScoreSerie[]> {
  const qs = videogame ? `?videogame=${videogame}` : ''
  return apiRequest<PandaScoreSerie[]>(`/pandascore/series/${status}${qs}`, { noAuth: true })
}

function formatDate(d?: string | null) {
  if (!d) return '?'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function gameLabel(slug?: string) {
  const map: Record<string, string> = {
    lol: 'LoL',
    'league-of-legends': 'LoL',
    valorant: 'Valorant',
    'cs-go': 'CS2',
    'counter-strike': 'CS2',
    'dota-2': 'Dota 2',
    'dota2': 'Dota 2',
    'ow2': 'OW2',
    'overwatch': 'OW2',
    'r6-siege': 'R6',
    'rainbow-six-siege': 'R6',
  }
  return slug ? (map[slug] ?? slug.toUpperCase()) : 'Esports'
}

function gameBadgeTone(slug?: string): 'live' | 'warn' | 'default' {
  if (!slug) return 'default'
  if (slug.includes('lol') || slug.includes('league')) return 'live'
  if (slug.includes('valorant')) return 'warn'
  return 'default'
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SeriesGrid({ series, loading }: { series: PandaScoreSerie[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="news-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="news-card" style={{ minHeight: 180 }}>
            <div
              className="news-card-img"
              style={{ background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }}
            />
            <div className="news-card-body" style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'var(--surface-2)' }} />
              <div style={{ height: 16, width: '80%', borderRadius: 4, background: 'var(--surface-2)' }} />
              <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--surface-2)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!series.length) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--muted)' }}>
        <p style={{ fontSize: '2rem', margin: 0 }}>🏆</p>
        <p style={{ margin: '0.5rem 0 0' }}>Không có giải nào trong mục này.</p>
      </div>
    )
  }

  return (
    <div className="news-grid">
      {series.map((s) => {
        const leagueImg = s.league?.image_url
        const gameSlug = s.videogame?.slug
        const tone = gameBadgeTone(gameSlug)

        return (
          <Link key={s.id} to={`/tournaments/${s.slug}`} className="news-card">
            {/* header image / league logo */}
            <div
              className="news-card-img"
              style={{
                background: leagueImg
                  ? `url(${leagueImg}) center/contain no-repeat var(--surface-2)`
                  : 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!leagueImg && (
                <span style={{ fontSize: '2.5rem', opacity: 0.25 }}>🏆</span>
              )}
            </div>

            <div className="news-card-body">
              <Badge tone={tone}>{gameLabel(gameSlug)}</Badge>

              <h4 style={{ margin: '0.4rem 0 0.2rem', lineHeight: 1.3 }}>
                {s.full_name}
              </h4>

              {s.league && (
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
                  {s.league.name}
                </span>
              )}

              <span className="news-meta" style={{ marginTop: '0.3rem' }}>
                {formatDate(s.begin_at)} – {formatDate(s.end_at)}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const STATUS_TABS: { id: SerieStatus; label: string }[] = [
  { id: 'running', label: 'Đang diễn ra' },
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'past', label: 'Đã kết thúc' },
]

export function TournamentsPage() {
  const [status, setStatus] = useState<SerieStatus>('running')
  const [game, setGame] = useState('')

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['pandascore-series', status, game],
    queryFn: () => fetchSeries(status, game),
    staleTime: 1000 * 60 * 5, // 5 min
  })

  return (
    <div className="page-padding content-shell">
      {/* ── Hero ── */}
      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'linear-gradient(135deg, #0f1923 0%, #1a2636 40%, #0d1821 100%)',
          minHeight: '220px',
        }}
      >
        {/* decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '30%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,0,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', padding: '2rem 2rem 2rem', maxWidth: 560 }}>
          <Badge tone="live">Live Tournaments</Badge>
          <h1
            style={{
              margin: '0.6rem 0 0.5rem',
              fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Thư viện giải đấu
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Lịch giải, bảng xếp hạng và đội tham gia — dữ liệu thời gian thực từ PandaScore.
          </p>
        </div>
      </section>

      {/* ── Tabs + Game filter ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Tabs
          tabs={STATUS_TABS}
          active={status}
          onChange={(id) => setStatus(id as SerieStatus)}
        />

        {/* game chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {GAME_FILTERS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                border: `1px solid ${game === g.id ? 'var(--accent)' : 'var(--line)'}`,
                background: game === g.id ? 'var(--accent)' : 'transparent',
                color: game === g.id ? '#fff' : 'var(--muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: 'var(--muted-2)' }}>
          {isLoading ? 'Đang tải…' : `${series.length} giải`}
        </p>
        <SeriesGrid series={series} loading={isLoading} />
      </div>
    </div>
  )
}
