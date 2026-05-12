import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '../../shared/api/client'

// ─── Types ───────────────────────────────────────────────────────────────────
type GridPlayer = {
  id: string; name: string; kills: number; deaths: number
  killAssistsGiven: number; money: number; netWorth: number
  loadoutValue?: number; firstKill?: boolean
  multikills?: { count: number; numberOfKills: number }[]
}
type GridGameTeam = { id: string; name: string; score: number; won?: boolean; side?: string; players: GridPlayer[] }
type GridGame = { sequenceNumber: number; started: boolean; finished: boolean; duration?: string; teams: GridGameTeam[] }
type GridSeriesTeam = { id: string; name: string; won?: boolean; score: number; players: GridPlayer[] }
type GridSeriesState = {
  id: string; started: boolean; finished: boolean; forfeited?: boolean
  format: string; duration?: string; startedAt?: string; updatedAt?: string
  title?: { id: string; name: string }
  teams: GridSeriesTeam[]
  games: GridGame[]
}
type GridSeriesInfo = {
  id: string; startTimeScheduled: string
  format?: { nameShortened: string }
  tournament?: { nameShortened: string }
  title?: { id: string; name: string }
  teams: { baseInfo: { id: string; name: string; shortName?: string; logoUrl?: string } }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDuration(iso?: string) {
  if (!iso) return '—'
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/)
  if (!m) return iso
  const h = parseInt(m[1] ?? '0'), min = parseInt(m[2] ?? '0')
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

function calcRating(p: GridPlayer, totalRounds: number): number {
  if (!totalRounds) return 0
  const kpr = p.kills / totalRounds
  const dpr = p.deaths / totalRounds
  const apr = p.killAssistsGiven / totalRounds * 0.5
  return Math.round((kpr - dpr * 0.7 + apr + 0.7) * 100) / 100
}

function ratingColor(r: number) {
  if (r >= 1.2) return '#2ecc71'
  if (r >= 1.0) return '#f1c40f'
  if (r >= 0.8) return '#e67e22'
  return '#e84057'
}

function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatBar({ label, blueVal, redVal }: {
  label: string; blueVal: number; redVal: number
}) {
  const total = blueVal + redVal || 1
  const pct = Math.round((blueVal / total) * 100)
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
        <span style={{ color: '#4e9af1', fontWeight: 700 }}>{blueVal}</span>
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ color: '#e84057', fontWeight: 700 }}>{redVal}</span>
      </div>
      <div style={{ display: 'flex', borderRadius: 999, overflow: 'hidden', height: 6 }}>
        <div style={{ width: `${pct}%`, background: '#4e9af1', transition: 'width 0.5s ease' }} />
        <div style={{ flex: 1, background: '#e84057' }} />
      </div>
    </div>
  )
}

function PlayerTable({ team, totalRounds, highlight }: { team: GridGameTeam; totalRounds: number; highlight?: string }) {
  const sorted = [...team.players].sort((a, b) => b.kills - a.kills)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: team.side === 'ct' ? '#4e9af1' : '#e84057' }}>
          {team.name}
        </span>
        {team.side && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: team.side === 'ct' ? '#4e9af122' : '#e8405722', color: team.side === 'ct' ? '#4e9af1' : '#e84057', fontWeight: 700 }}>{team.side.toUpperCase()}</span>}
        <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '0.9rem' }}>{team.score}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>
            <th style={{ textAlign: 'left', padding: '0.2rem 0.3rem', fontWeight: 600 }}>Player</th>
            <th style={{ textAlign: 'center', padding: '0.2rem 0.3rem', fontWeight: 600 }}>K</th>
            <th style={{ textAlign: 'center', padding: '0.2rem 0.3rem', fontWeight: 600 }}>D</th>
            <th style={{ textAlign: 'center', padding: '0.2rem 0.3rem', fontWeight: 600 }}>A</th>
            <th style={{ textAlign: 'center', padding: '0.2rem 0.3rem', fontWeight: 600 }}>Rating</th>
            <th style={{ textAlign: 'right', padding: '0.2rem 0.3rem', fontWeight: 600 }}>Net Worth</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const rating = calcRating(p, totalRounds)
            const isMvp = p.id === highlight
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--line)', background: isMvp ? 'rgb(241 196 15 / 6%)' : undefined }}>
                <td style={{ padding: '0.3rem 0.3rem', fontWeight: isMvp ? 700 : 400 }}>
                  {isMvp && <span title="MVP" style={{ marginRight: 4 }}>👑</span>}
                  {p.name}
                  {p.firstKill && <span title="First Kill" style={{ marginLeft: 4, fontSize: '0.65rem', color: '#f1c40f' }}>★FK</span>}
                </td>
                <td style={{ textAlign: 'center', padding: '0.3rem', color: '#4e9af1', fontWeight: 700 }}>{p.kills}</td>
                <td style={{ textAlign: 'center', padding: '0.3rem', color: '#e84057' }}>{p.deaths}</td>
                <td style={{ textAlign: 'center', padding: '0.3rem', color: 'var(--muted)' }}>{p.killAssistsGiven}</td>
                <td style={{ textAlign: 'center', padding: '0.3rem' }}>
                  <span style={{ fontWeight: 700, color: ratingColor(rating) }}>{rating.toFixed(2)}</span>
                </td>
                <td style={{ textAlign: 'right', padding: '0.3rem', color: '#f1c40f', fontSize: '0.72rem' }}>{fmtK(p.netWorth)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EconomyBar({ players, label, color }: { players: GridPlayer[]; label: string; color: string }) {
  const total = players.reduce((s, p) => s + p.netWorth, 0)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.15rem' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: '1.05rem', color }}>{fmtK(total)}</div>
    </div>
  )
}

function RadarChart({ aPlayers, bPlayers, aName, bName }: {
  aPlayers: GridPlayer[]; bPlayers: GridPlayer[]; aName: string; bName: string
}) {
  const aAvg = {
    kills: aPlayers.reduce((s, p) => s + p.kills, 0) / (aPlayers.length || 1),
    deaths: aPlayers.reduce((s, p) => s + p.deaths, 0) / (aPlayers.length || 1),
    assists: aPlayers.reduce((s, p) => s + p.killAssistsGiven, 0) / (aPlayers.length || 1),
    netWorth: aPlayers.reduce((s, p) => s + p.netWorth, 0) / (aPlayers.length || 1),
    rating: aPlayers.reduce((s, p) => s + calcRating(p, 25), 0) / (aPlayers.length || 1),
  }
  const bAvg = {
    kills: bPlayers.reduce((s, p) => s + p.kills, 0) / (bPlayers.length || 1),
    deaths: bPlayers.reduce((s, p) => s + p.deaths, 0) / (bPlayers.length || 1),
    assists: bPlayers.reduce((s, p) => s + p.killAssistsGiven, 0) / (bPlayers.length || 1),
    netWorth: bPlayers.reduce((s, p) => s + p.netWorth, 0) / (bPlayers.length || 1),
    rating: bPlayers.reduce((s, p) => s + calcRating(p, 25), 0) / (bPlayers.length || 1),
  }

  const rows = [
    { label: 'Kills TB', a: aAvg.kills.toFixed(1), b: bAvg.kills.toFixed(1), aWin: aAvg.kills >= bAvg.kills },
    { label: 'Deaths TB', a: aAvg.deaths.toFixed(1), b: bAvg.deaths.toFixed(1), aWin: aAvg.deaths <= bAvg.deaths },
    { label: 'Assists TB', a: aAvg.assists.toFixed(1), b: bAvg.assists.toFixed(1), aWin: aAvg.assists >= bAvg.assists },
    { label: 'Net Worth TB', a: fmtK(Math.round(aAvg.netWorth)), b: fmtK(Math.round(bAvg.netWorth)), aWin: aAvg.netWorth >= bAvg.netWorth },
    { label: 'Rating TB', a: aAvg.rating.toFixed(2), b: bAvg.rating.toFixed(2), aWin: aAvg.rating >= bAvg.rating },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.25rem 0.75rem', alignItems: 'center', fontSize: '0.78rem' }}>
        <span style={{ fontWeight: 700, color: '#4e9af1', textAlign: 'right' }}>{aName}</span>
        <span />
        <span style={{ fontWeight: 700, color: '#e84057' }}>{bName}</span>
        {rows.map(r => (
          <>
            <span key={`a-${r.label}`} style={{ textAlign: 'right', fontWeight: r.aWin ? 700 : 400, color: r.aWin ? '#4e9af1' : 'var(--muted)' }}>{r.a}</span>
            <span key={`l-${r.label}`} style={{ textAlign: 'center', color: 'var(--muted-2)', fontSize: '0.65rem', padding: '0.2rem 0' }}>{r.label}</span>
            <span key={`b-${r.label}`} style={{ fontWeight: !r.aWin ? 700 : 400, color: !r.aWin ? '#e84057' : 'var(--muted)' }}>{r.b}</span>
          </>
        ))}
      </div>
    </div>
  )
}

type ClutchEvent = { player: string; team: string; count: number; gameSeq: number }

function ClutchFeed({ events }: { events: ClutchEvent[] }) {
  if (!events.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: 6, background: 'rgb(255 200 0 / 7%)', border: '1px solid rgb(255 200 0 / 20%)' }}>
          <span style={{ fontSize: '1.1rem' }}>{e.count >= 4 ? '🔥' : '⚡'}</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{e.player}</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.76rem' }}> · {e.team} · Map {e.gameSeq}</span>
            <div style={{ fontSize: '0.7rem', color: '#f1c40f', fontWeight: 700 }}>
              {e.count === 2 ? 'Double Kill' : e.count === 3 ? 'Triple Kill' : e.count === 4 ? 'Quadro Kill' : 'ACE 🎖️'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function GridSeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedMap, setSelectedMap] = useState(0)
  const prevStateRef = useRef<GridSeriesState | null>(null)
  const [killFeed, setKillFeed] = useState<{ text: string; ts: number }[]>([])

  const { data: info } = useQuery({
    queryKey: ['grid-series-info', id],
    queryFn: () => apiRequest<GridSeriesInfo>(`/grid/series/${id}`),
    staleTime: 300_000,
  })

  const { data: state } = useQuery({
    queryKey: ['grid-series-state', id],
    queryFn: () => apiRequest<GridSeriesState>(`/grid/series/${id}/state`),
    refetchInterval: (q) => {
      const d = q.state.data as GridSeriesState | undefined
      if (!d?.started || d?.finished) return false
      return 5_000
    },
    staleTime: 0,
  })

  // Kill feed detection
  useEffect(() => {
    if (!state || !prevStateRef.current) { prevStateRef.current = state ?? null; return }
    const prev = prevStateRef.current
    const curGame = state.games[selectedMap]
    const prevGame = prev.games[selectedMap]
    if (!curGame || !prevGame) { prevStateRef.current = state; return }

    curGame.teams.forEach(team => {
      team.players.forEach(p => {
        const prevP = prevGame.teams.flatMap(t => t.players).find(x => x.id === p.id)
        if (prevP && p.kills > prevP.kills) {
          const diff = p.kills - prevP.kills
          if (diff >= 1) {
            setKillFeed(f => [{ text: `${p.name} +${diff} kill${diff > 1 ? 's' : ''} (${team.name})`, ts: Date.now() }, ...f.slice(0, 9)])
          }
        }
      })
    })
    prevStateRef.current = state
  }, [state, selectedMap])

  const teams = info?.teams ?? []
  const [tA, tB] = teams
  const isLive = state?.started && !state?.finished

  const currentGame = state?.games?.[selectedMap]
  const finishedGames = state?.games?.filter(g => g.finished) ?? []

  // MVP per map: highest rating player
  function getMvp(game: GridGame) {
    const allPlayers = game.teams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })))
    const rounds = Math.max(...game.teams.map(t => t.score), 1)
    return allPlayers.reduce((best, p) => calcRating(p, rounds) > calcRating(best, rounds) ? p : best, allPlayers[0])
  }

  // Clutch events across all finished games
  const clutchEvents: ClutchEvent[] = finishedGames.flatMap(g =>
    g.teams.flatMap(team =>
      team.players.flatMap(p =>
        (p.multikills ?? [])
          .filter(m => m.count >= 2)
          .map(m => ({ player: p.name, team: team.name, count: m.count, gameSeq: g.sequenceNumber }))
      )
    )
  )

  if (!info && !state) {
    return (
      <div className="page-padding content-shell">
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>Đang tải...</div>
      </div>
    )
  }

  const seriesScore = state ? `${state.teams[0]?.score ?? 0} : ${state.teams[1]?.score ?? 0}` : '— : —'
  const titleName = info?.title?.name ?? 'Esports'
  const gameTitleId = info?.title?.id ?? ''

  const isCS2 = gameTitleId === '28'
  const heroBg = isCS2
    ? 'linear-gradient(135deg, #0a1a0a 0%, #0f2e10 40%, #071208 100%)'
    : 'linear-gradient(135deg, #1a0800 0%, #3d1500 40%, #180500 100%)'
  const heroOrb1 = isCS2
    ? 'radial-gradient(circle, rgba(80,200,80,0.2) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(220,100,20,0.22) 0%, transparent 70%)'
  const heroOrb2 = isCS2
    ? 'radial-gradient(circle, rgba(40,160,60,0.12) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(180,60,10,0.15) 0%, transparent 70%)'
  const heroBorder = isCS2 ? 'rgba(80,200,80,0.4)' : 'rgba(220,100,20,0.4)'

  return (
    <div className="page-padding content-shell">
      {/* Hero */}
      <section style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: `1px solid ${heroBorder}`, background: heroBg, marginBottom: 0 }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: heroOrb1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: '50%', background: heroOrb2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(7,9,14,0.65) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Link to="/matches" className="link-inline" style={{ fontSize: '0.82rem' }}>← Trận đấu</Link>
          <span style={{ color: 'var(--muted-2)' }}>·</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{info?.tournament?.nameShortened ?? '—'} · {info?.format?.nameShortened ?? state?.format ?? '—'} · {titleName}</span>
          {isLive && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, background: '#ff3b3b22', color: '#ff3b3b' }}>● LIVE</span>}
          {state?.finished && <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgb(255 255 255 / 6%)', color: 'var(--muted)' }}>Kết thúc</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {tA?.baseInfo?.logoUrl && <img src={tA.baseInfo.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain', background: 'rgb(255 255 255 / 8%)', borderRadius: 8, padding: 4 }} />}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{tA?.baseInfo?.name ?? state?.teams?.[0]?.name ?? 'TBD'}</div>
              {state?.teams?.[0]?.won && <div style={{ fontSize: '0.7rem', color: '#2ecc71', fontWeight: 700 }}>🏆 Thắng</div>}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Tỉ số</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{seriesScore}</div>
            {state?.duration && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.35rem' }}>⏱ {fmtDuration(state.duration)}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', textAlign: 'right' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{tB?.baseInfo?.name ?? state?.teams?.[1]?.name ?? 'TBD'}</div>
              {state?.teams?.[1]?.won && <div style={{ fontSize: '0.7rem', color: '#2ecc71', fontWeight: 700 }}>🏆 Thắng</div>}
            </div>
            {tB?.baseInfo?.logoUrl && <img src={tB.baseInfo.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain', background: 'rgb(255 255 255 / 8%)', borderRadius: 8, padding: 4 }} />}
          </div>
        </div>
        </div>
      </section>

      {/* Not started state */}
      {!state?.started && info && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🕐</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Trận đấu chưa bắt đầu</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Bắt đầu lúc: <strong style={{ color: 'var(--text)' }}>{new Date(info.startTimeScheduled).toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--muted-2)' }}>Trang sẽ tự cập nhật khi trận bắt đầu</div>
        </div>
      )}

      {/* Map Tabs */}
      {state && state.games.length > 0 && (
        <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted)' }}>Map:</span>
          {state.games.map((g, i) => (
            <button key={i} onClick={() => setSelectedMap(i)} style={{
              padding: '0.3rem 0.85rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', border: '1px solid var(--line)',
              background: selectedMap === i ? 'var(--accent)' : 'rgb(255 255 255 / 4%)',
              color: selectedMap === i ? '#fff' : undefined,
            }}>
              Map {g.sequenceNumber}
              {g.finished && <span style={{ marginLeft: 4, fontSize: '0.65rem', color: selectedMap === i ? 'rgba(255,255,255,0.7)' : 'var(--muted-2)' }}>✓</span>}
              {!g.finished && g.started && <span style={{ marginLeft: 4, color: '#ff3b3b' }}>●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Current map stats */}
      {currentGame && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Economy comparison */}
          <div className="surface-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span style={{ fontWeight: 700 }}>💰 Economy — Map {currentGame.sequenceNumber}</span>
              {currentGame.finished && (
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>⏱ {fmtDuration(currentGame.duration)}</span>
              )}
            </div>
            {currentGame.teams.map((team, i) => (
              <StatBar
                key={team.id}
                label={i === 0 ? 'Net Worth' : ''}
                blueVal={team.players.reduce((s, p) => s + p.netWorth, 0)}
                redVal={currentGame.teams[1 - i]?.players.reduce((s, p) => s + p.netWorth, 0) ?? 0}
              />
            ))}
            <StatBar
              label="Kills"
              blueVal={currentGame.teams[0]?.players.reduce((s, p) => s + p.kills, 0) ?? 0}
              redVal={currentGame.teams[1]?.players.reduce((s, p) => s + p.kills, 0) ?? 0}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', marginTop: '0.75rem', textAlign: 'center' }}>
              {currentGame.teams[0] && <EconomyBar players={currentGame.teams[0].players} label={currentGame.teams[0].name} color="#4e9af1" />}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{currentGame.teams[0]?.score} – {currentGame.teams[1]?.score}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Round score</span>
              </div>
              {currentGame.teams[1] && <EconomyBar players={currentGame.teams[1].players} label={currentGame.teams[1].name} color="#e84057" />}
            </div>
          </div>

          {/* Player tables */}
          <div className="surface-card">
            <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📊 Thống kê player — Map {currentGame.sequenceNumber}</div>
            {currentGame.finished && (() => {
              const mvp = getMvp(currentGame)
              return (
                <>
                  {mvp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgb(241 196 15 / 8%)', border: '1px solid rgb(241 196 15 / 25%)', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>👑</span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1c40f' }}>{mvp.name}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.76rem' }}> — MVP of Map {currentGame.sequenceNumber}</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{mvp.kills}K / {mvp.deaths}D / {mvp.killAssistsGiven}A · Rating {calcRating(mvp, Math.max(...currentGame.teams.map(t => t.score))).toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                  {currentGame.teams.map(team => (
                    <PlayerTable key={team.id} team={team} totalRounds={Math.max(...currentGame.teams.map(t => t.score))} highlight={mvp?.id} />
                  ))}
                </>
              )
            })()}
            {!currentGame.finished && currentGame.teams.map(team => (
              <PlayerTable key={team.id} team={team} totalRounds={Math.max(...currentGame.teams.map(t => t.score), 1)} />
            ))}
          </div>

          {/* Head to head */}
          {currentGame.teams.length >= 2 && (
            <div className="surface-card">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>⚡ Head-to-Head</div>
              <RadarChart
                aPlayers={currentGame.teams[0].players}
                bPlayers={currentGame.teams[1].players}
                aName={currentGame.teams[0].name}
                bName={currentGame.teams[1].name}
              />
            </div>
          )}
        </div>
      )}

      {/* Kill feed (live) */}
      {isLive && killFeed.length > 0 && (
        <div className="surface-card">
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block' }} />
            Live Kill Feed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {killFeed.slice(0, 6).map((e, i) => (
              <div key={e.ts + i} style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: 6, background: 'rgb(255 255 255 / 4%)', color: i === 0 ? '#fff' : 'var(--muted)', opacity: 1 - i * 0.12 }}>
                ⚔️ {e.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clutch feed */}
      {clutchEvents.length > 0 && (
        <div className="surface-card">
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🔥 Clutch / Multi-kill Highlights</div>
          <ClutchFeed events={clutchEvents} />
        </div>
      )}

      {/* Series summary (all maps) */}
      {finishedGames.length > 1 && (
        <div className="surface-card">
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📈 Tổng kết series</div>
          {state && (
            <RadarChart
              aPlayers={state.teams[0]?.players ?? []}
              bPlayers={state.teams[1]?.players ?? []}
              aName={state.teams[0]?.name ?? 'Team A'}
              bName={state.teams[1]?.name ?? 'Team B'}
            />
          )}
        </div>
      )}

      {/* Match info */}
      <div className="surface-card">
        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Thông tin trận</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem' }}>
          {[
            ['Game', titleName],
            ['Format', info?.format?.nameShortened ?? state?.format ?? '—'],
            ['Giải', info?.tournament?.nameShortened ?? '—'],
            ['Bắt đầu', info?.startTimeScheduled ? new Date(info.startTimeScheduled).toLocaleString('vi-VN') : '—'],
            ['Thời lượng', fmtDuration(state?.duration)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
