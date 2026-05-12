import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { LoLEsportsEvent, LoLLiveStatsWindow, PostgameStats, PostgameParticipant } from '../../shared/api/types'
import { IMG } from '../../shared/data/mock'
import { Badge, SectionHeader } from '../../shared/components/Ui'

interface KalstropTeam { id: string; name: string; logoUrl?: string; oddsDecimal?: number; probability?: number }
interface KalstropFixture { id: string; slug: string; name: string; startTime: string; status: string; competition: string; competitionSlug: string; category: string; teams: [KalstropTeam, KalstropTeam]; preMatchWidgetUrl?: string; tournamentSlug?: string; categorySlug?: string }

function PreMatchWidgetCollapsible({ fixture }: { fixture: KalstropFixture }) {
  const [show, setShow] = React.useState(false)
  const tA = fixture.teams[0], tB = fixture.teams[1]
  return (
    <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setShow(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: 'none', border: 'none', borderBottom: show ? '1px solid var(--line)' : 'none', cursor: 'pointer', color: 'inherit' }}>
        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>📊 Thống kê trước trận</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{tA.name} vs {tB.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--muted)' }}>{show ? '▲' : '▼'}</span>
      </button>
      {show && <iframe src={fixture.preMatchWidgetUrl} style={{ width: '100%', height: 560, border: 'none', display: 'block' }} loading="lazy" />}
    </div>
  )
}
function normName(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, '') }
function findKalstrop(nA: string, nB: string, list: KalstropFixture[]): KalstropFixture | undefined {
  const a = normName(nA), b = normName(nB)
  return list.find(f => {
    const k0 = normName(f.teams[0].name), k1 = normName(f.teams[1].name)
    return (k0.includes(a) || a.includes(k0)) && (k1.includes(b) || b.includes(k1))
        || (k0.includes(b) || b.includes(k0)) && (k1.includes(a) || a.includes(k1))
  })
}

const DRAGON_EMOJI: Record<string, string> = {
  fire: '🔥', ocean: '🌊', mountain: '⛰️', cloud: '💨', hextech: '⚡', chemtech: '☣️', elder: '👁️',
}

function fmtGold(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(1)}k` : String(g)
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}


const ROLE_LABEL: Record<string, string> = {
  top: 'Top', jungle: 'Jungle', mid: 'Mid', bottom: 'Bot', support: 'Sup',
}

function champIcon(championId: string) {
  if (!championId) return null
  const name = championId.replace(/\s/g, '').replace(/'/g, '')
  return `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${name}.png`
}

function PlayerRow({ p, color }: { p: PostgameParticipant; color: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--line)' }}>
      <td style={{ padding: '0.45rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 160 }}>
        {champIcon(p.championId)
          ? <img src={champIcon(p.championId)!} alt={p.championId} style={{ width: 28, height: 28, borderRadius: 4, border: `2px solid ${color}` }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          : <span style={{ width: 28, height: 28, borderRadius: 4, background: color, opacity: 0.3, display: 'inline-block' }} />
        }
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{p.summonerName || `Player ${p.participantId}`}</p>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--muted)' }}>{p.championId} · {ROLE_LABEL[p.role] ?? p.role}</p>
        </div>
      </td>
      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
        <span style={{ color: '#4ade80' }}>{p.kills}</span>
        <span style={{ color: 'var(--muted)' }}>/</span>
        <span style={{ color: '#f87171' }}>{p.deaths}</span>
        <span style={{ color: 'var(--muted)' }}>/</span>
        <span style={{ color: '#60a5fa' }}>{p.assists}</span>
      </td>
      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>{p.creepScore}</td>
      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#fbbf24' }}>{fmtGold(p.totalGold)}</td>
      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-2)' }}>Lv{p.level}</td>
    </tr>
  )
}

function PostgameTable({ stats, blueTeamName, redTeamName }: { stats: PostgameStats; blueTeamName: string; redTeamName: string }) {
  const thStyle: React.CSSProperties = { padding: '0.3rem 0.5rem', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 500, textAlign: 'center', borderBottom: '1px solid var(--line)' }
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {[
        { team: stats.blueTeam, name: blueTeamName, color: '#4e9af1', side: 'Blue' },
        { team: stats.redTeam, name: redTeamName, color: '#e84057', side: 'Red' },
      ].map(({ team, name, color, side }) => (
        <div key={side}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {fmtGold(team.totalGold)} · {team.totalKills}K · {team.towers}T · {team.barons}B ·{' '}
              {team.dragons.map((d, i) => <span key={i} title={d}>{DRAGON_EMOJI[d] ?? '🐉'}</span>)}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Champion / Tên</th>
                  <th style={thStyle}>K/D/A</th>
                  <th style={thStyle}>CS</th>
                  <th style={thStyle}>Vàng</th>
                  <th style={thStyle}>Lv</th>
                </tr>
              </thead>
              <tbody>
                {team.participants.map((p) => <PlayerRow key={p.participantId} p={p} color={color} />)}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function StreamEmbed({ streams, isLive }: { streams: LoLEsportsEvent['streams']; isLive: boolean }) {
  const [provider, setProvider] = useState<'youtube' | 'twitch'>(
    streams.youtube ? 'youtube' : 'twitch'
  )
  const hasYoutube = !!streams.youtube
  const hasTwitch = !!streams.twitch

  if (!hasYoutube && !hasTwitch) {
    return (
      <div className="video-placeholder" style={{ backgroundImage: `url(${IMG.stream})` }}>
        <span className="video-play">▶</span>
        <p style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          Stream chưa có sẵn
        </p>
      </div>
    )
  }

  return (
    <div>
      {hasYoutube && hasTwitch && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <button onClick={() => setProvider('youtube')} style={{ background: provider === 'youtube' ? '#ff0000' : 'rgb(255 255 255 / 5%)', color: provider === 'youtube' ? '#fff' : undefined, border: '1px solid var(--line)', borderRadius: 6, padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            ▶ YouTube
          </button>
          <button onClick={() => setProvider('twitch')} style={{ background: provider === 'twitch' ? '#9146ff' : 'rgb(255 255 255 / 5%)', color: provider === 'twitch' ? '#fff' : undefined, border: '1px solid var(--line)', borderRadius: 6, padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            ● Twitch
          </button>
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
        {provider === 'youtube' && streams.youtube && (
          <iframe src={`https://www.youtube.com/embed/${streams.youtube.videoId}?autoplay=${isLive ? 1 : 0}&mute=1`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube" />
        )}
        {provider === 'twitch' && streams.twitch && (
          <iframe src={`https://player.twitch.tv/?channel=${streams.twitch.channel}&parent=${window.location.hostname}&autoplay=${isLive}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Twitch" />
        )}
      </div>
      {provider === 'youtube' && streams.youtube && (
        <a href={`https://www.youtube.com/watch?v=${streams.youtube.videoId}`} target="_blank" rel="noopener noreferrer" className="link-inline" style={{ fontSize: '0.78rem', marginTop: '0.4rem', display: 'inline-block' }}>Mở trên YouTube →</a>
      )}
      {provider === 'twitch' && streams.twitch && (
        <a href={`https://www.twitch.tv/${streams.twitch.channel}`} target="_blank" rel="noopener noreferrer" className="link-inline" style={{ fontSize: '0.78rem', marginTop: '0.4rem', display: 'inline-block' }}>Mở trên Twitch →</a>
      )}
    </div>
  )
}

export function LoLEsportsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedGameIdx, setSelectedGameIdx] = useState(0)

  useEffect(() => {
    document.body.classList.add('bg-lol-worlds')
    return () => {
      document.body.classList.remove('bg-lol-worlds')
    }
  }, [])

  const pageBgStyle: React.CSSProperties = {
    minHeight: '100vh',
    // Background is applied on <body> to cover beyond `.app-shell`.
    // Keep this wrapper transparent.
    background: 'transparent',
  }

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['lol-esports-event', id],
    queryFn: () => apiRequest<LoLEsportsEvent>(`/lol-esports/event/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  })

  const liveGameId = event?.liveGameId
  const selectedGame = event?.match.games[selectedGameIdx]
  const selectedGameId = selectedGame?.id

  const { data: liveStats } = useQuery({
    queryKey: ['lol-live-stats', liveGameId],
    queryFn: () => apiRequest<LoLLiveStatsWindow>(`/lol-esports/live-stats/${liveGameId}`),
    enabled: !!liveGameId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const selectedGameFirstFrameTime = selectedGame?.state === 'completed'
    ? (selectedGame as any).vods?.[0]?.firstFrameTime
    : undefined

  const { data: postgame, isLoading: isPostgameLoading } = useQuery({
    queryKey: ['lol-postgame', selectedGameId, selectedGameFirstFrameTime],
    queryFn: () => {
      const params = selectedGameFirstFrameTime
        ? `?firstFrameTime=${encodeURIComponent(selectedGameFirstFrameTime)}`
        : ''
      return apiRequest<PostgameStats>(`/lol-esports/postgame/${selectedGameId}${params}`)
    },
    enabled: !!selectedGameId && selectedGame?.state === 'completed',
    staleTime: 5 * 60_000,
  })

  const teamAName = event?.match.teams[0]?.name ?? event?.match.teams[0]?.code ?? ''
  const teamBName = event?.match.teams[1]?.name ?? event?.match.teams[1]?.code ?? ''

  const { data: kalstropLive = [] } = useQuery({
    queryKey: ['kalstrop-lol-live-loldetail'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/live'),
    enabled: !!event && event.state !== 'completed',
    staleTime: 30_000,
    refetchInterval: event?.state === 'inProgress' ? 30_000 : false,
  })

  const liveKalstrop = findKalstrop(teamAName, teamBName, kalstropLive)

  const { data: kalstropUpcoming = [] } = useQuery({
    queryKey: ['kalstrop-lol-upcoming-loldetail'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/upcoming'),
    enabled: !!event && event.state !== 'completed' && !liveKalstrop,
    staleTime: 120_000,
  })

  const kalstropMatch = liveKalstrop ?? findKalstrop(teamAName, teamBName, kalstropUpcoming)


  if (isLoading) {
    return (
      <div style={pageBgStyle}>
        <div className="page-padding content-shell">
          <div className="surface-card" style={{ height: 220, opacity: 0.3 }} />
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {[1, 2].map((i) => <div key={i} className="surface-card" style={{ height: 120, opacity: 0.3 }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div style={pageBgStyle}>
        <div className="page-padding content-shell">
          <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
            Không tìm thấy trận đấu.{' '}
            <Link to="/matches" className="link-inline">← Quay lại</Link>
          </div>
        </div>
      </div>
    )
  }

  const [tA, tB] = event.match.teams
  const isLive = event.state === 'inProgress'
  const frame = liveStats?.frames?.[liveStats.frames.length - 1]
  const gameTime = liveStats?.gameMetadata?.gameTime ?? 0

  const blueTeamName = tA?.name ?? 'Blue'
  const redTeamName = tB?.name ?? 'Red'

  return (
    <div style={pageBgStyle}>
      <div className="page-padding content-shell">
        {/* Hero */}
        <section style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid rgba(200,155,60,0.4)', background: 'linear-gradient(135deg, #0a1628 0%, #0d2244 45%, #071020 100%)', minHeight: 220 }}>
          <div style={{ position: 'relative', padding: '1.5rem 1.75rem', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/matches" className="link-inline" style={{ fontSize: '0.82rem' }}>← Lịch trận</Link>
              <span style={{ color: 'var(--muted-2)' }}>·</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {event.league.name} · BO{event.match.strategy?.count ?? '?'} · LoL
              </span>
              {isLive && <Badge tone="live">LIVE</Badge>}
              {event.state === 'completed' && <Badge tone="default">Kết thúc</Badge>}
              {event.state === 'unstarted' && <Badge tone="warn">Sắp đấu</Badge>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {tA?.image ? <img src={tA.image} alt={tA.code} style={{ width: 52, height: 52, objectFit: 'contain', background: 'rgb(255 255 255 / 8%)', borderRadius: 8, padding: 4 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }} /> : <span style={{ fontSize: '2rem' }}>{(tA?.code ?? '??').slice(0, 2)}</span>}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{tA?.name ?? 'TBD'}</h2>
                  {tA?.record && <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>{tA.record.wins}W – {tA.record.losses}L</p>}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Tỉ số</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                  {event.state === 'unstarted'
                    ? <span style={{ color: 'var(--muted-2)' }}>vs</span>
                    : <>{tA?.result?.gameWins ?? 0} <span style={{ color: 'var(--muted-2)' }}>:</span> {tB?.result?.gameWins ?? 0}</>
                  }
                </div>
                {event.blockName && <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>{event.blockName}</p>}
                {kalstropMatch && (kalstropMatch.teams[0].oddsDecimal || kalstropMatch.teams[1].oddsDecimal) && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.6rem' }}>
                    {kalstropMatch.teams.map((t, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '0.35rem 0.75rem', borderRadius: 7, background: 'rgb(255 255 255 / 7%)', border: '1px solid rgb(255 255 255 / 12%)', minWidth: 64 }}>
                        <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginBottom: 1 }}>{t.name}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t.oddsDecimal?.toFixed(2) ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', justifyContent: 'flex-end', textAlign: 'right' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{tB?.name ?? 'TBD'}</h2>
                  {tB?.record && <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>{tB.record.wins}W – {tB.record.losses}L</p>}
                </div>
                {tB?.image ? <img src={tB.image} alt={tB.code} style={{ width: 52, height: 52, objectFit: 'contain', background: 'rgb(255 255 255 / 8%)', borderRadius: 8, padding: 4 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }} /> : <span style={{ fontSize: '2rem' }}>{(tB?.code ?? '??').slice(0, 2)}</span>}
              </div>
            </div>
          </div>
        </section>

      {/* Pre-match stats top, stream below */}
      {kalstropMatch && event.state !== 'completed' && kalstropMatch.preMatchWidgetUrl && (
        <PreMatchWidgetCollapsible fixture={kalstropMatch} />
      )}

      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{isLive ? 'Đang phát trực tiếp' : 'VOD / Stream'}</span>
          </div>
          {event.league.image && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src={event.league.image} alt={event.league.name} style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{event.league.name}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '0.75rem 1rem 1rem' }}>
          <StreamEmbed streams={event.streams} isLive={isLive} />
        </div>
      </div>

      {/* Live stats panel — horizontal */}
      {frame && (
        <div className="surface-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Stats</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>⏱</span>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em' }}>{fmtTime(gameTime)}</span>
            </div>
          </div>

          {/* Gold bar */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#4e9af1' }}>{fmtGold(frame.blueTeam.totalGold)}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', alignSelf: 'center' }}>Tổng vàng</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#e84057' }}>{fmtGold(frame.redTeam.totalGold)}</span>
            </div>
            <div style={{ display: 'flex', borderRadius: 999, overflow: 'hidden', height: 10 }}>
              {(() => {
                const total = frame.blueTeam.totalGold + frame.redTeam.totalGold || 1
                const pct = Math.round((frame.blueTeam.totalGold / total) * 100)
                return <>
                  <div style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#3b82f6,#4e9af1)', transition: 'width 0.6s ease' }} />
                  <div style={{ flex: 1, background: 'linear-gradient(90deg,#e84057,#c0392b)' }} />
                </>
              })()}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {[
              { label: 'Kills', blue: frame.blueTeam.totalKills, red: frame.redTeam.totalKills, icon: '⚔️' },
              { label: 'Trụ', blue: frame.blueTeam.towers, red: frame.redTeam.towers, icon: '🏰' },
              { label: 'Ức chế', blue: frame.blueTeam.inhibitors, red: frame.redTeam.inhibitors, icon: '💎' },
              { label: 'Baron', blue: frame.blueTeam.barons, red: frame.redTeam.barons, icon: '🐍' },
              { label: 'Rồng', blue: frame.blueTeam.dragons.length, red: frame.redTeam.dragons.length, icon: '🐉' },
            ].map(({ label, blue, red, icon }) => (
              <div key={label} style={{ background: 'rgb(255 255 255 / 4%)', borderRadius: 8, padding: '0.5rem 0.25rem', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{icon}</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span style={{ color: '#4e9af1' }}>{blue}</span>
                  <span style={{ color: 'var(--muted-2)', fontSize: '0.7rem' }}>-</span>
                  <span style={{ color: '#e84057' }}>{red}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Dragons detail */}
          {(frame.blueTeam.dragons.length > 0 || frame.redTeam.dragons.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#4e9af1', fontWeight: 600, minWidth: 30 }}>{tA?.code}</span>
                {frame.blueTeam.dragons.length === 0
                  ? <span style={{ fontSize: '0.7rem', color: 'var(--muted-2)' }}>—</span>
                  : frame.blueTeam.dragons.map((d, i) => <span key={i} title={d} style={{ fontSize: '1.1rem' }}>{DRAGON_EMOJI[d] ?? '🐉'}</span>)}
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                {frame.redTeam.dragons.length === 0
                  ? <span style={{ fontSize: '0.7rem', color: 'var(--muted-2)' }}>—</span>
                  : frame.redTeam.dragons.map((d, i) => <span key={i} title={d} style={{ fontSize: '1.1rem' }}>{DRAGON_EMOJI[d] ?? '🐉'}</span>)}
                <span style={{ fontSize: '0.7rem', color: '#e84057', fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{tB?.code}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game tabs + Postgame + Match info */}
      <div className="section-stack">
        {/* Game tabs */}
        {event.match.games.length > 0 && (
          <div className="surface-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Ván đấu · BO{event.match.strategy?.count ?? '?'}</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {event.match.games.map((g, idx) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGameIdx(idx)}
                    style={{
                      padding: '0.3rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      cursor: 'pointer', border: '1px solid var(--line)',
                      background: selectedGameIdx === idx ? 'var(--accent)' : 'rgb(255 255 255 / 4%)',
                      color: selectedGameIdx === idx ? '#fff' : undefined,
                    }}
                  >
                    Ván {g.number}
                    {g.state === 'inProgress' && <span style={{ marginLeft: 4, color: '#ff3b3b' }}>●</span>}
                    {g.state === 'completed' && <span style={{ marginLeft: 4, color: 'var(--muted-2)', fontSize: '0.7rem' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Postgame breakdown */}
        {selectedGame?.state === 'completed' && (
          <div className="surface-card">
            <SectionHeader title={`Thống kê — Ván ${selectedGame.number}`} />
            {isPostgameLoading && (
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '1rem 0' }}>Đang tải...</div>
            )}
            {!isPostgameLoading && postgame && (
              <PostgameTable stats={postgame} blueTeamName={blueTeamName} redTeamName={redTeamName} />
            )}
            {!isPostgameLoading && !postgame && (
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '1rem 0' }}>Không có dữ liệu chi tiết cho ván này.</div>
            )}
          </div>
        )}

        {/* Match info */}
        <div className="surface-card">
          <SectionHeader title="Thông tin trận" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', marginTop: '0.5rem' }}>
            {[
              ['League', event.league.name],
              ['Format', `BO${event.match.strategy?.count ?? '?'}`],
              ['Game', 'League of Legends'],
              ...(event.blockName ? [['Tuần', event.blockName]] : []),
              ['Bắt đầu', new Date(event.startTime).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
