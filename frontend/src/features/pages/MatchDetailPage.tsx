import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { MatchItem, LoLEsportsEvent, LoLLiveStatsWindow, PostgameStats, PostgameParticipant } from '../../shared/api/types'
import { IMG } from '../../shared/data/mock'
import { Badge, SectionHeader } from '../../shared/components/Ui'

interface KalstropTeam { id: string; name: string; logoUrl?: string; oddsDecimal?: number; probability?: number }
interface KalstropFixture { id: string; slug: string; name: string; startTime: string; status: string; competition: string; competitionSlug: string; category: string; teams: [KalstropTeam, KalstropTeam]; preMatchWidgetUrl?: string }
function normName(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, '') }
function findKalstrop(nA: string, nB: string, list: KalstropFixture[]): KalstropFixture | undefined {
  const a = normName(nA), b = normName(nB)
  return list.find(f => {
    const k0 = normName(f.teams[0].name), k1 = normName(f.teams[1].name)
    return (k0.includes(a) || a.includes(k0)) && (k1.includes(b) || b.includes(k1))
        || (k0.includes(b) || b.includes(k0)) && (k1.includes(a) || a.includes(k1))
  })
}
function OddsDetailPanel({ fixture }: { fixture: KalstropFixture }) {
  const [tA, tB] = fixture.teams
  if (!tA.oddsDecimal && !tB.oddsDecimal) return null
  const isUnderdogA = (tA.probability ?? 0.5) < 0.5
  const isUnderdogB = (tB.probability ?? 0.5) < 0.5
  const btn = (t: KalstropTeam, isUnderdog: boolean) => (
    <div style={{ textAlign: 'center', padding: '0.5rem 1.2rem', borderRadius: 8,
      background: isUnderdog ? 'rgba(200,155,60,0.12)' : 'rgb(255 255 255 / 6%)',
      border: `1px solid ${isUnderdog ? 'rgba(200,155,60,0.5)' : 'rgb(255 255 255 / 12%)'}` }}>
      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginBottom: 2 }}>{t.name}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isUnderdog ? '#c89b3c' : '#fff', lineHeight: 1 }}>{t.oddsDecimal?.toFixed(2) ?? '—'}</div>
      {t.probability != null && <div style={{ fontSize: '0.6rem', color: 'var(--muted-2)', marginTop: 2 }}>{Math.round(t.probability * 100)}%</div>}
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tỉ lệ cược</span>
      {btn(tA, isUnderdogA)}
      <span style={{ fontSize: '0.7rem', color: 'var(--muted-2)' }}>vs</span>
      {btn(tB, isUnderdogB)}
    </div>
  )
}

const GAME_LABELS: Record<string, string> = {
  lol: 'LoL', csgo: 'CS2', dota2: 'Dota 2', valorant: 'Valorant',
  ow2: 'OW2', rl: 'RL', mlbb: 'MLBB',
}

const GAME_BG: Record<string, string> = {
  lol:      'linear-gradient(135deg, #0a1628 0%, #0d2244 40%, #071020 100%)',
  csgo:     'linear-gradient(135deg, #0d1a0d 0%, #1a3a1a 40%, #0a1208 100%)',
  dota2:    'linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #1a0800 100%)',
  valorant: 'linear-gradient(135deg, #1a0808 0%, #3d0f0f 40%, #1a0505 100%)',
  ow2:      'linear-gradient(135deg, #0d1a2e 0%, #1a3a5c 40%, #0a1520 100%)',
  rl:       'linear-gradient(135deg, #0d0a1a 0%, #2e1a5c 40%, #0a0812 100%)',
  mlbb:     'linear-gradient(135deg, #1a0a00 0%, #4a1a00 40%, #1a0800 100%)',
  default:  'linear-gradient(135deg, rgb(7 9 14) 0%, rgb(14 20 35) 100%)',
}

const GAME_BORDER: Record<string, string> = {
  lol:      'rgba(200,155,60,0.45)',
  csgo:     'rgba(80,200,80,0.45)',
  dota2:    'rgba(220,80,20,0.45)',
  valorant: 'rgba(220,50,50,0.45)',
  ow2:      'rgba(250,160,20,0.45)',
  rl:       'rgba(120,80,255,0.45)',
  mlbb:     'rgba(255,120,20,0.45)',
}

const GAME_ACCENT: Record<string, string> = {
  lol: '#c89b3c',
  csgo: '#78ff78',
  dota2: '#ff6a3d',
  valorant: '#ff4655',
  ow2: '#ff9f1a',
  rl: '#8a63ff',
  mlbb: '#ff7a18',
  default: '#66a3ff',
}

// Put this file under `frontend/public/` so it can be served as `/worlds-banner.9a5e2788.png`
const LOL_BG_IMAGE_URL = '/worlds-banner.9a5e2788.png'

function heroBg(game?: string) {
  const key = (game || 'default').toLowerCase()
  const base = GAME_BG[key] ?? GAME_BG.default
  const accent = GAME_ACCENT[key] ?? GAME_ACCENT.default
  const layers: string[] = []

  // LoL: add Worlds banner image behind the gradients
  if (key === 'lol') {
    layers.push(`url("${LOL_BG_IMAGE_URL}")`)
  }

  // Multiple layers to avoid “flat black sides”
  layers.push(
    base,
    `radial-gradient(850px circle at 15% 35%, ${accent}35 0%, transparent 55%)`,
    `radial-gradient(700px circle at 85% 45%, ${accent}22 0%, transparent 58%)`,
    `radial-gradient(900px circle at 50% 120%, rgb(255 255 255 / 6%) 0%, transparent 60%)`,
  )

  const backgroundImage = layers.join(', ')
  const backgroundSize = key === 'lol'
    ? 'cover, cover, cover, cover, cover'
    : 'cover'
  const backgroundPosition = key === 'lol'
    ? 'center, center, center, center, center'
    : 'center'

  return { bg: backgroundImage, accent, border: GAME_BORDER[key] ?? 'var(--line)', backgroundSize, backgroundPosition }
}

function formatTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

function getString(obj: Record<string, any>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === 'string' ? v : undefined
}

function safeUrl(url?: string) {
  return typeof url === 'string' && url.startsWith('http') ? url : undefined
}

function fmtCompact(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function pickNumber(obj: any, paths: string[]): number | undefined {
  for (const path of paths) {
    const parts = path.split('.')
    let cur: any = obj
    for (const p of parts) {
      cur = cur?.[p]
      if (cur === undefined || cur === null) break
    }
    if (typeof cur === 'number' && !Number.isNaN(cur)) return cur
  }
  return undefined
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
      {(hasYoutube && hasTwitch) && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {hasYoutube && (
            <button
              className={`tab ${provider === 'youtube' ? 'tab-active' : ''}`}
              onClick={() => setProvider('youtube')}
              style={{ background: provider === 'youtube' ? '#ff0000' : 'rgb(255 255 255 / 5%)', color: provider === 'youtube' ? '#fff' : undefined, border: '1px solid var(--line)', borderRadius: 6, padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ▶ YouTube
            </button>
          )}
          {hasTwitch && (
            <button
              className={`tab ${provider === 'twitch' ? 'tab-active' : ''}`}
              onClick={() => setProvider('twitch')}
              style={{ background: provider === 'twitch' ? '#9146ff' : 'rgb(255 255 255 / 5%)', color: provider === 'twitch' ? '#fff' : undefined, border: '1px solid var(--line)', borderRadius: 6, padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ● Twitch
            </button>
          )}
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
        {provider === 'youtube' && streams.youtube && (
          <iframe
            src={`https://www.youtube.com/embed/${streams.youtube.videoId}?autoplay=${isLive ? 1 : 0}&mute=1`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Stream YouTube"
          />
        )}
        {provider === 'twitch' && streams.twitch && (
          <iframe
            src={`https://player.twitch.tv/?channel=${streams.twitch.channel}&parent=${window.location.hostname}&autoplay=${isLive}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            title="Stream Twitch"
          />
        )}
      </div>

      {provider === 'youtube' && streams.youtube && (
        <a
          href={`https://www.youtube.com/watch?v=${streams.youtube.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-inline"
          style={{ fontSize: '0.78rem', marginTop: '0.4rem', display: 'inline-block' }}
        >
          Mở trên YouTube →
        </a>
      )}
      {provider === 'twitch' && streams.twitch && (
        <a
          href={`https://www.twitch.tv/${streams.twitch.channel}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-inline"
          style={{ fontSize: '0.78rem', marginTop: '0.4rem', display: 'inline-block' }}
        >
          Mở trên Twitch →
        </a>
      )}
    </div>
  )
}

function GameTracker({ games }: { games: LoLEsportsEvent['match']['games']; teams: LoLEsportsEvent['match']['teams'] }) {
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {games.map((g) => (
        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: g.state === 'inProgress' ? 'var(--accent-soft)' : 'rgb(255 255 255 / 4%)', border: `1px solid ${g.state === 'inProgress' ? 'var(--accent)' : 'var(--line)'}` }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, minWidth: 40 }}>
            Ván {g.number}
          </span>
          {g.state === 'completed' && (
            <Badge tone="default">Xong</Badge>
          )}
          {g.state === 'inProgress' && (
            <Badge tone="live">LIVE</Badge>
          )}
          {g.state === 'unstarted' && (
            <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>Chưa bắt đầu</span>
          )}
        </div>
      ))}
    </div>
  )
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

function GoldBar({ blue, red }: { blue: number; red: number }) {
  const total = blue + red || 1
  const bluePct = Math.round((blue / total) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
        <span style={{ color: '#4e9af1' }}>{fmtGold(blue)}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 400 }}>Vàng</span>
        <span style={{ color: '#e84057' }}>{fmtGold(red)}</span>
      </div>
      <div style={{ display: 'flex', borderRadius: 999, overflow: 'hidden', height: 8, background: '#e84057' }}>
        <div style={{ width: `${bluePct}%`, background: '#4e9af1', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function StatRow({ label, blue, red }: { label: string; blue: number | string; red: number | string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#4e9af1', textAlign: 'left' }}>{blue}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', minWidth: 80 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e84057', textAlign: 'right' }}>{red}</span>
    </div>
  )
}

function LiveStatsPanel({ stats, teamBlue, teamRed }: {
  stats: LoLLiveStatsWindow
  teamBlue: string
  teamRed: string
}) {
  const frame = stats.frames[stats.frames.length - 1]
  if (!frame) return null

  const { blueTeam, redTeam } = frame
  const gameTime = stats.gameMetadata?.gameTime ?? 0

  return (
    <div className="surface-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <SectionHeader title="Live Stats" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{fmtTime(gameTime)}</span>
        </div>
      </div>

      {/* Team labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4e9af1' }}>🔵 {teamBlue}</span>
        <span />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e84057', textAlign: 'right' }}>🔴 {teamRed}</span>
      </div>

      <GoldBar blue={blueTeam.totalGold} red={redTeam.totalGold} />

      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0' }}>
        <StatRow label="Kills" blue={blueTeam.totalKills} red={redTeam.totalKills} />
        <StatRow label="Trụ" blue={blueTeam.towers} red={redTeam.towers} />
        <StatRow label="Ức chế" blue={blueTeam.inhibitors} red={redTeam.inhibitors} />
        <StatRow label="Baron" blue={blueTeam.barons} red={redTeam.barons} />
      </div>

      {/* Dragons */}
      <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', color: '#4e9af1', fontWeight: 600 }}>Rồng</p>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {blueTeam.dragons.length === 0
              ? <span style={{ fontSize: '0.7rem', color: 'var(--muted-2)' }}>—</span>
              : blueTeam.dragons.map((d, i) => (
                <span key={i} title={d} style={{ fontSize: '1rem' }}>{DRAGON_EMOJI[d] ?? '🐉'}</span>
              ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', color: '#e84057', fontWeight: 600 }}>Rồng</p>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {redTeam.dragons.length === 0
              ? <span style={{ fontSize: '0.7rem', color: 'var(--muted-2)' }}>—</span>
              : redTeam.dragons.map((d, i) => (
                <span key={i} title={d} style={{ fontSize: '1rem' }}>{DRAGON_EMOJI[d] ?? '🐉'}</span>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreMatchWidgetCollapsible({ fixture }: { fixture: KalstropFixture }) {
  const [show, setShow] = useState(false)
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

const ROLE_LABEL: Record<string, string> = { top: 'Top', jungle: 'Jungle', mid: 'Mid', bottom: 'Bot', support: 'Sup' }
function champIcon(championId: string) {
  if (!championId) return null
  const name = championId.replace(/\s/g, '').replace(/'/g, '')
  return `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${name}.png`
}

function PostgameTable({ stats, blueTeamName, redTeamName }: { stats: PostgameStats; blueTeamName: string; redTeamName: string }) {
  const color = (side: 'blue' | 'red') => side === 'blue' ? '#4e9af1' : '#e84057'
  const thStyle: React.CSSProperties = { padding: '0.3rem 0.5rem', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 500, textAlign: 'center', borderBottom: '1px solid var(--line)' }
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {([{ team: stats.blueTeam, name: blueTeamName, side: 'blue' as const }, { team: stats.redTeam, name: redTeamName, side: 'red' as const }]).map(({ team, name, side }) => (
        <div key={side}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color(side), display: 'inline-block' }} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{team.totalGold >= 1000 ? `${(team.totalGold/1000).toFixed(1)}k` : team.totalGold} · {team.totalKills}K · {team.towers}T · {team.barons}B</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead><tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>Champion / Tên</th>
                <th style={thStyle}>K/D/A</th><th style={thStyle}>CS</th><th style={thStyle}>Vàng</th><th style={thStyle}>Lv</th>
              </tr></thead>
              <tbody>{team.participants.map((p: PostgameParticipant) => (
                <tr key={p.participantId} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '0.45rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 160 }}>
                    {champIcon(p.championId) ? <img src={champIcon(p.championId)!} alt={p.championId} style={{ width: 28, height: 28, borderRadius: 4, border: `2px solid ${color(side)}` }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : null}
                    <div><p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{p.summonerName || `Player ${p.participantId}`}</p><p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--muted)' }}>{p.championId} · {ROLE_LABEL[p.role] ?? p.role}</p></div>
                  </td>
                  <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 700 }}><span style={{ color: '#4ade80' }}>{p.kills}</span>/<span style={{ color: '#f87171' }}>{p.deaths}</span>/<span style={{ color: '#60a5fa' }}>{p.assists}</span></td>
                  <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>{p.creepScore}</td>
                  <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#fbbf24' }}>{p.totalGold >= 1000 ? `${(p.totalGold/1000).toFixed(1)}k` : p.totalGold}</td>
                  <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-2)' }}>Lv{p.level}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedGameIdx, setSelectedGameIdx] = useState(0)

  const { data: match, isLoading, isError } = useQuery({
    queryKey: ['match', id],
    queryFn: () => apiRequest<MatchItem>(`/matches/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  })

  const isLoL = match?.game === 'lol'
  const isPandaScore = match?.provider === 'pandascore'
  const pandaMatchIdOrSlug = match?.externalId

  const {
    data: pandaMatchDetail,
    isLoading: isLoadingPandaDetail,
    isError: isErrorPandaDetail,
  } = useQuery({
    queryKey: ['pandascore-match-detail', pandaMatchIdOrSlug],
    queryFn: () => apiRequest<unknown>(`/pandascore/matches/${pandaMatchIdOrSlug}`),
    enabled: Boolean(!isLoL && isPandaScore && pandaMatchIdOrSlug),
    staleTime: 60_000,
  })

  const {
    data: pandaMatchOpponents,
    isLoading: isLoadingPandaOpponents,
    isError: isErrorPandaOpponents,
  } = useQuery({
    queryKey: ['pandascore-match-opponents', pandaMatchIdOrSlug],
    queryFn: () => apiRequest<unknown>(`/pandascore/matches/${pandaMatchIdOrSlug}/opponents`),
    enabled: Boolean(!isLoL && isPandaScore && pandaMatchIdOrSlug),
    staleTime: 5 * 60_000,
  })

  // IMPORTANT: Hooks must be called consistently on every render.
  // So we compute PandaScore-derived arrays and call useQueries() BEFORE any early returns.
  const panda = isRecord(pandaMatchDetail) ? (pandaMatchDetail as any) : null
  const pandaDetailedStats = panda
    ? (typeof panda.detailed_stats === 'boolean' ? panda.detailed_stats : undefined)
    : undefined
  const pandaGames = panda && Array.isArray((panda as any).games) ? ((panda as any).games as any[]) : []
  const statsGameSlug = (match?.game ?? '').toLowerCase()
  const pandaGameIdsForStats =
    !isLoL && isPandaScore && pandaDetailedStats
      ? pandaGames.map((g) => String(g?.id ?? '')).filter(Boolean)
      : []

  const gameDetailsQueries = useQueries({
    queries: pandaGameIdsForStats.map((gid) => ({
      queryKey: ['pandascore-game', statsGameSlug, gid],
      queryFn: () => apiRequest<any>(`/pandascore/${statsGameSlug}/games/${gid}`),
      enabled: Boolean(gid && statsGameSlug),
      staleTime: 10 * 60_000,
    })),
  })

  const { data: liveEvents } = useQuery({
    queryKey: ['lol-esports-live'],
    queryFn: () => apiRequest<LoLEsportsEvent[]>('/lol-esports/live'),
    enabled: isLoL,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const teamAName = match?.teams[0]?.name ?? match?.teams[0]?.acronym ?? ''
  const teamBName = match?.teams[1]?.name ?? match?.teams[1]?.acronym ?? ''

  const { data: kalstropLive = [] } = useQuery({
    queryKey: ['kalstrop-lol-live-detail'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/live'),
    enabled: isLoL && match?.status !== 'finished',
    staleTime: 30_000,
    refetchInterval: isLoL && match?.status !== 'finished' ? 30_000 : false,
  })

  const liveKalstropFixture = findKalstrop(teamAName, teamBName, kalstropLive)

  const { data: kalstropUpcoming = [] } = useQuery({
    queryKey: ['kalstrop-lol-upcoming-detail'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/upcoming'),
    enabled: isLoL && !liveKalstropFixture && match?.status === 'not_started',
    staleTime: 120_000,
  })

  const upcomingKalstropFixture = liveKalstropFixture ?? findKalstrop(teamAName, teamBName, kalstropUpcoming)

  const { data: kalstropDetails } = useQuery({
    queryKey: ['kalstrop-fixture-details', upcomingKalstropFixture?.id],
    queryFn: () => apiRequest<any>(`/kalstrop/fixture/${upcomingKalstropFixture!.id}/details`),
    enabled: !!upcomingKalstropFixture && !upcomingKalstropFixture.teams[0].oddsDecimal,
    staleTime: 30_000,
  })

  const kalstropFixtureWithOdds: KalstropFixture | undefined = (() => {
    if (!upcomingKalstropFixture) return undefined
    if (upcomingKalstropFixture.teams[0].oddsDecimal) return upcomingKalstropFixture
    if (!kalstropDetails) return undefined
    const odds: any[] = kalstropDetails?.fixture?.defaultMarketsInfo?.defaultMarket?.odds
      ?? kalstropDetails?.defaultMarket?.odds
      ?? kalstropDetails?.odds ?? []
    if (odds.length < 2) return undefined
    const parseOdd = (o: any) => ({ decimal: (o?.oddsDecimal ?? (parseFloat(o?.oddsNumerator) / parseFloat(o?.oddsDenominator) + 1)) || undefined, probability: o?.probability != null ? parseFloat(o.probability) : undefined })
    const enriched = { ...upcomingKalstropFixture, teams: [
      { ...upcomingKalstropFixture.teams[0], ...parseOdd(odds[0]) },
      { ...upcomingKalstropFixture.teams[1], ...parseOdd(odds[1]) },
    ] as [KalstropTeam, KalstropTeam] }
    return enriched
  })()

  const liveEvent = liveEvents?.find((e) => {
    if (!match) return false
    const [tA, tB] = match.teams
    const names = [tA?.name?.toLowerCase(), tB?.name?.toLowerCase(), tA?.acronym?.toLowerCase(), tB?.acronym?.toLowerCase()].filter(Boolean)
    return e.match.teams.some((t) =>
      names.some((n) => n && (t.name.toLowerCase().includes(n) || t.code.toLowerCase() === n))
    )
  }) ?? null

  const liveGameId = liveEvent?.liveGameId

  const { data: liveStats } = useQuery({
    queryKey: ['lol-live-stats', liveGameId],
    queryFn: () => apiRequest<LoLLiveStatsWindow>(`/lol-esports/live-stats/${liveGameId}`),
    enabled: !!liveGameId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const { data: lolesportsScheduleForDetail } = useQuery({
    queryKey: ['lol-esports-schedule-detail'],
    queryFn: () => apiRequest<{ events: LoLEsportsEvent[]; pages: object }>('/lol-esports/schedule'),
    enabled: isLoL,
    staleTime: 120_000,
  })

  function matchesLoLEvent(e: LoLEsportsEvent): boolean {
    if (!match) return false
    const [tA, tB] = match.teams
    const STOP = new Set(['gaming', 'esports', 'team', 'the', 'in', 'of', 'and'])
    function teamMatch(pName: string | undefined, pCode: string | undefined, lt: LoLEsportsEvent['match']['teams'][0]): boolean {
      // Exact code/acronym match (highest priority)
      if (pCode && pCode.length >= 2 && lt.code.toLowerCase() === pCode.toLowerCase()) return true
      // Significant name-word overlap (exclude stop words and short tokens)
      const pandaWords = (pName ?? '').toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !STOP.has(w))
      const lolWords = lt.name.toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !STOP.has(w))
      return pandaWords.length > 0 && pandaWords.some(pw => lolWords.some(lw => lw === pw || lw.startsWith(pw) || pw.startsWith(lw)))
    }
    const lolTeams = e.match.teams
    const aMatched = lolTeams.some(lt => teamMatch(tA?.name, tA?.acronym, lt))
    const bMatched = lolTeams.some(lt => teamMatch(tB?.name, tB?.acronym, lt))
    return aMatched && bMatched
  }

  const lolesportsEventAny: LoLEsportsEvent | null = liveEvent ?? (
    lolesportsScheduleForDetail?.events?.find(matchesLoLEvent) ?? null
  )

  const lolesportsEventId = lolesportsEventAny?.id ?? null

  const { data: eventDetails } = useQuery({
    queryKey: ['lol-esports-event-detail', lolesportsEventId],
    queryFn: () => apiRequest<LoLEsportsEvent>(`/lol-esports/event/${lolesportsEventId}`),
    enabled: isLoL && !!lolesportsEventId,
    staleTime: 30_000,
  })

  const richEvent = eventDetails ?? lolesportsEventAny
  const selectedGame = richEvent?.match.games[selectedGameIdx]
  const selectedGameId = selectedGame?.id
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
    enabled: isLoL && !!selectedGameId && selectedGame?.state === 'completed',
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <div className="page-padding content-shell">
        <div className="surface-card" style={{ height: 220, opacity: 0.3 }} />
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {[1, 2].map((i) => <div key={i} className="surface-card" style={{ height: 120, opacity: 0.3 }} />)}
        </div>
      </div>
    )
  }

  if (isError || !match) {
    return (
      <div className="page-padding content-shell">
        <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
          Không tìm thấy trận đấu.{' '}
          <Link to="/matches" className="link-inline">← Quay lại</Link>
        </div>
      </div>
    )
  }

  const [teamA, teamB] = match.teams
  const gameLabel = GAME_LABELS[match.game] ?? match.game?.toUpperCase() ?? ''
  const isLive = match.status === 'live'
  const hero = heroBg(match.game)

  const displayTeamA = liveEvent?.match.teams[0] ?? null
  const displayTeamB = liveEvent?.match.teams[1] ?? null

  const pandaStreams = panda && Array.isArray((panda as any).streams_list) ? ((panda as any).streams_list as any[]) : []
  const pandaMainStream = pandaStreams.find((s) => isRecord(s) && s.main) ?? pandaStreams[0] ?? null
  const pandaMainStreamUrl = pandaMainStream && isRecord(pandaMainStream) ? safeUrl(getString(pandaMainStream, 'raw_url')) : undefined

  const pandaOppData = isRecord(pandaMatchOpponents) ? (pandaMatchOpponents as any) : null
  const pandaOpponentsFull = pandaOppData && Array.isArray(pandaOppData.opponents) ? (pandaOppData.opponents as any[]) : []

  return (
    <div className="page-padding content-shell">
      {/* Hero header */}
      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          border: `1px solid ${hero.border}`,
          backgroundImage: hero.bg,
          backgroundColor: '#07090e',
          backgroundSize: hero.backgroundSize,
          backgroundPosition: hero.backgroundPosition,
          minHeight: '220px',
        }}
      >
        {/* Soft vignette + readability overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              'linear-gradient(135deg, rgb(0 0 0 / 12%) 0%, rgb(0 0 0 / 58%) 100%)',
              'radial-gradient(1200px circle at 50% 40%, rgb(0 0 0 / 0%) 0%, rgb(0 0 0 / 45%) 70%, rgb(0 0 0 / 62%) 100%)',
            ].join(', '),
          }}
        />

        {/* Decorative side glows (themed per game) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -120,
            top: -90,
            width: 420,
            height: 420,
            background: `radial-gradient(circle at 40% 40%, ${hero.accent}55 0%, transparent 65%)`,
            filter: 'blur(10px)',
            opacity: 0.9,
            pointerEvents: 'none',
            transform: 'rotate(-12deg)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -140,
            bottom: -120,
            width: 520,
            height: 520,
            background: `radial-gradient(circle at 60% 50%, ${hero.accent}45 0%, transparent 65%)`,
            filter: 'blur(14px)',
            opacity: 0.75,
            pointerEvents: 'none',
            transform: 'rotate(10deg)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(90deg, rgb(0 0 0 / 55%) 0%, rgb(0 0 0 / 0%) 18%, rgb(0 0 0 / 0%) 82%, rgb(0 0 0 / 55%) 100%)',
            pointerEvents: 'none',
            opacity: 0.55,
          }}
        />
        <div style={{ position: 'relative', padding: '1.5rem 1.75rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/matches" className="link-inline" style={{ fontSize: '0.82rem' }}>← Lịch trận</Link>
            <span style={{ color: 'var(--muted-2)' }}>·</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {liveEvent?.league.name ?? match.leagueName ?? match.tournamentName ?? ''}
              {match.numberOfGames ? ` · BO${match.numberOfGames}` : ''}
              {gameLabel ? ` · ${gameLabel}` : ''}
            </span>
            {isLive && <Badge tone="live">LIVE</Badge>}
            {match.status === 'not_started' && <Badge tone="warn">Sắp đấu</Badge>}
            {match.status === 'finished' && <Badge tone="default">Kết thúc</Badge>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1.5rem' }}>
            {/* Team A */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {(displayTeamA?.image || teamA?.imageUrl) ? (
                <img
                  src={displayTeamA?.image ?? teamA?.imageUrl}
                  alt={displayTeamA?.code ?? teamA?.acronym}
                  style={{ width: 52, height: 52, objectFit: 'contain', background: 'rgb(255 255 255 / 8%)', borderRadius: 8, padding: 4 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
                />
              ) : (
                <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{(teamA?.acronym ?? '??').slice(0, 2)}</span>
              )}
              <div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {match.region?.toUpperCase() ?? ''} · {gameLabel}
                </p>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
                  {displayTeamA?.name ?? teamA?.name ?? 'TBD'}
                </h2>
                {displayTeamA?.record && (
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>
                    {displayTeamA.record.wins}W – {displayTeamA.record.losses}L
                  </p>
                )}
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tỉ số</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {match.status === 'not_started'
                  ? <span style={{ color: 'var(--muted-2)' }}>vs</span>
                  : <>
                      {displayTeamA?.result?.gameWins ?? teamA?.score ?? '?'}
                      {' '}<span style={{ color: 'var(--muted-2)' }}>:</span>{' '}
                      {displayTeamB?.result?.gameWins ?? teamB?.score ?? '?'}
                    </>
                }
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>
                {match.status === 'not_started'
                  ? formatTime(match.startsAt)
                  : match.status === 'finished'
                  ? `Kết thúc ${formatTime(match.endedAt)}`
                  : formatTime(match.startsAt)}
              </p>
            </div>

            {/* Team B */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', justifyContent: 'flex-end', textAlign: 'right' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {match.region?.toUpperCase() ?? ''} · {gameLabel}
                </p>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
                  {displayTeamB?.name ?? teamB?.name ?? 'TBD'}
                </h2>
                {displayTeamB?.record && (
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>
                    {displayTeamB.record.wins}W – {displayTeamB.record.losses}L
                  </p>
                )}
              </div>
              {(displayTeamB?.image || teamB?.imageUrl) ? (
                <img
                  src={displayTeamB?.image ?? teamB?.imageUrl}
                  alt={displayTeamB?.code ?? teamB?.acronym}
                  style={{ width: 52, height: 52, objectFit: 'contain', background: 'rgb(255 255 255 / 8%)', borderRadius: 8, padding: 4 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
                />
              ) : (
                <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{(teamB?.acronym ?? '??').slice(0, 2)}</span>
              )}
            </div>
          </div>
          {kalstropFixtureWithOdds && <OddsDetailPanel fixture={kalstropFixtureWithOdds} />}
        </div>
      </section>

      <div className="two-col">
        <div className="section-stack">
          {/* Game tracker */}
          {liveEvent && liveEvent.match.games.length > 0 && (
            <div className="surface-card">
              <SectionHeader
                title="Diễn biến trận"
                subtitle={`BO${liveEvent.match.strategy?.count ?? match.numberOfGames ?? '?'}`}
              />
              <GameTracker games={liveEvent.match.games} teams={liveEvent.match.teams} />
            </div>
          )}

          {/* Live stats */}
          {liveStats && liveEvent && (
            <LiveStatsPanel
              stats={liveStats}
              teamBlue={liveEvent.match.teams[0]?.code ?? 'Blue'}
              teamRed={liveEvent.match.teams[1]?.code ?? 'Red'}
            />
          )}

          {/* LoL Esports game tabs + postgame */}
          {isLoL && richEvent && richEvent.match.games.length > 0 && (
            <div className="surface-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Ván đấu · BO{richEvent.match.strategy?.count ?? match?.numberOfGames ?? '?'}</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {richEvent.match.games.map((g, idx) => (
                    <button key={g.id} onClick={() => setSelectedGameIdx(idx)}
                      style={{ padding: '0.3rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--line)',
                        background: selectedGameIdx === idx ? 'var(--accent)' : 'rgb(255 255 255 / 4%)', color: selectedGameIdx === idx ? '#fff' : undefined }}>
                      Ván {g.number}
                      {g.state === 'inProgress' && <span style={{ marginLeft: 4, color: '#ff3b3b' }}>●</span>}
                      {g.state === 'completed' && <span style={{ marginLeft: 4, color: 'var(--muted-2)', fontSize: '0.7rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isLoL && selectedGame?.state === 'completed' && (
            <div className="surface-card">
              <SectionHeader title={`Thống kê — Ván ${selectedGame.number}`} />
              {isPostgameLoading && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '1rem 0' }}>Đang tải...</div>}
              {!isPostgameLoading && postgame && (
                <PostgameTable stats={postgame}
                  blueTeamName={richEvent?.match.teams[0]?.name ?? richEvent?.match.teams[0]?.code ?? 'Blue'}
                  redTeamName={richEvent?.match.teams[1]?.name ?? richEvent?.match.teams[1]?.code ?? 'Red'} />
              )}
              {!isPostgameLoading && !postgame && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '1rem 0' }}>Không có dữ liệu chi tiết cho ván này.</div>}
            </div>
          )}

          {/* Pre-match Kalstrop widget */}
          {isLoL && kalstropFixtureWithOdds?.preMatchWidgetUrl && richEvent?.state !== 'completed' && (
            <PreMatchWidgetCollapsible fixture={kalstropFixtureWithOdds} />
          )}

          {/* Match info */}
          {isLoL && richEvent && (
            <div className="surface-card">
              <SectionHeader title="Thông tin trận" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', marginTop: '0.5rem' }}>
                {([
                  ['League', richEvent.league.name],
                  ['Format', `BO${richEvent.match.strategy?.count ?? match?.numberOfGames ?? '?'}`],
                  ['Game', 'League of Legends'],
                  ...(richEvent.blockName ? [['Tuần', richEvent.blockName]] as [string,string][] : []),
                  ['Bắt đầu', richEvent.startTime ? new Date(richEvent.startTime).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : (match?.startsAt ? new Date(match.startsAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—')],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoL && lolesportsEventId && (
            <div className="surface-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Xem đầy đủ trên trang LoL Esports</span>
              <a href={`/lol/esports/${lolesportsEventId}`}
                style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', padding: '0.35rem 0.9rem', border: '1px solid var(--accent)', borderRadius: 6 }}>
                Chi tiết LoL Esports →
              </a>
            </div>
          )}

          {/* PandaScore game-by-game + roster + stream */}
          {!isLoL && isPandaScore && panda && (
            <>
              {/* Stats table (dynamic per game) */}
              {pandaDetailedStats && pandaGameIdsForStats.length > 0 && (
                <div className="surface-card">
                  <SectionHeader
                    title="Thống kê (PandaScore)"
                    subtitle={`KDA · Gold · Damage… theo từng ván (${GAME_LABELS[statsGameSlug] ?? statsGameSlug})`}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.75rem' }}>
                    {gameDetailsQueries.every((q) => q.isLoading) && (
                      <div style={{ color: 'var(--muted)' }}>Đang tải thống kê…</div>
                    )}
                    {gameDetailsQueries.some((q) => q.isError) && (
                      <div style={{ color: 'var(--muted)' }}>
                        Không lấy được stats từ PandaScore. (Endpoint này cần gói Historical/Real-time của PandaScore)
                      </div>
                    )}

                    {gameDetailsQueries
                      .map((q) => q.data)
                      .filter(Boolean)
                      .map((game: any) => {
                        const teams = Array.isArray(game?.teams) ? game.teams : []
                        const position = game?.position ?? game?.number ?? game?.id
                        const gameHasPlayerDamage =
                          teams.some((t: any) =>
                            Array.isArray(t?.players) &&
                            t.players.some((p: any) =>
                              typeof pickNumber(p, [
                                'total_damage.to_champions',
                                'total_damage.dealt_to_champions',
                                'damage_to_champions',
                                'damage',
                                'adr',
                                'acs',
                              ]) === 'number'
                            )
                          )
                        const gameHasGold =
                          teams.some((t: any) =>
                            Array.isArray(t?.players) &&
                            t.players.some((p: any) => typeof p?.gold_earned === 'number')
                          ) || teams.some((t: any) => typeof t?.gold_earned === 'number')
                        const gameHasKDA =
                          teams.some((t: any) =>
                            Array.isArray(t?.players) &&
                            t.players.some((p: any) =>
                              typeof p?.kills === 'number' || typeof p?.deaths === 'number' || typeof p?.assists === 'number'
                            )
                          )
                        return (
                          <div key={String(game?.id ?? position)} style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '0.6rem 0.75rem', background: 'rgb(255 255 255 / 4%)', borderBottom: '1px solid var(--line)', fontWeight: 800, color: 'var(--muted-2)' }}>
                              Ván {String(position ?? '—')}
                            </div>

                            <div style={{ padding: '0.75rem' }}>
                              {teams.length === 0 ? (
                                <div style={{ color: 'var(--muted)' }}>Không có team stats.</div>
                              ) : (
                                <div style={{ display: 'grid', gap: '0.9rem' }}>
                                  {teams.map((t: any) => {
                                    const tPlayers = Array.isArray(t?.players) ? t.players : []
                                    const tName = typeof t?.name === 'string' ? t.name : (typeof t?.acronym === 'string' ? t.acronym : 'Team')
                                    const tKills = pickNumber(t, ['kills', 'total_kills'])
                                    const tDeaths = pickNumber(t, ['deaths', 'total_deaths'])
                                    const tAssists = pickNumber(t, ['assists', 'total_assists'])
                                    const tGold = pickNumber(t, ['gold_earned', 'gold', 'total_gold', 'money'])
                                    const tDamage = pickNumber(t, [
                                      'total_damage.to_champions',
                                      'total_damage.dealt_to_champions',
                                      'damage_to_champions',
                                      'damage',
                                      'total_damage',
                                      'adr',
                                      'acs',
                                    ])
                                    const tCs = pickNumber(t, ['cs', 'creep_score'])
                                    const tTowers = pickNumber(t, ['tower_kills', 'towers'])
                                    const tDragons = pickNumber(t, ['dragon_kills', 'dragons'])
                                    const tBarons = pickNumber(t, ['baron_kills', 'barons'])

                                    const teamChips: Array<{ label: string; value: string }> = []
                                    if (typeof tKills === 'number') teamChips.push({ label: 'Kills', value: String(tKills) })
                                    if (typeof tDeaths === 'number') teamChips.push({ label: 'Deaths', value: String(tDeaths) })
                                    if (typeof tAssists === 'number') teamChips.push({ label: 'Assists', value: String(tAssists) })
                                    if (typeof tGold === 'number') teamChips.push({ label: 'Gold', value: fmtCompact(tGold) })
                                    if (typeof tDamage === 'number') teamChips.push({ label: 'Dmg', value: fmtCompact(tDamage) })
                                    if (typeof tCs === 'number') teamChips.push({ label: 'CS', value: String(tCs) })
                                    if (typeof tTowers === 'number') teamChips.push({ label: 'Towers', value: String(tTowers) })
                                    if (typeof tDragons === 'number') teamChips.push({ label: 'Dragons', value: String(tDragons) })
                                    if (typeof tBarons === 'number') teamChips.push({ label: 'Barons', value: String(tBarons) })

                                    return (
                                      <div key={String(t?.id ?? tName)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: 8, flexWrap: 'wrap' }}>
                                          <div style={{ fontWeight: 800, color: 'var(--muted-2)' }}>{tName}</div>
                                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {teamChips.length === 0 ? (
                                              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>—</span>
                                            ) : (
                                              teamChips.map((c) => (
                                                <span key={c.label} style={{ fontSize: '0.75rem', color: 'var(--muted)', border: '1px solid var(--line)', background: 'rgb(255 255 255 / 3%)', padding: '0.18rem 0.5rem', borderRadius: 999 }}>
                                                  {c.label}: <b style={{ color: 'var(--muted-2)' }}>{c.value}</b>
                                                </span>
                                              ))
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
                                          <table className="data-table" style={{ minWidth: 620 }}>
                                            <thead>
                                              <tr>
                                                <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem' }}>Player</th>
                                                {gameHasKDA && (
                                                  <>
                                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem' }}>K</th>
                                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem' }}>D</th>
                                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem' }}>A</th>
                                                  </>
                                                )}
                                                {gameHasGold && (
                                                  <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem' }}>Gold</th>
                                                )}
                                                {gameHasPlayerDamage && (
                                                  <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem' }}>Damage</th>
                                                )}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {tPlayers.length === 0 ? (
                                                <tr><td colSpan={6} style={{ padding: '0.65rem', color: 'var(--muted)' }}>Không có player stats.</td></tr>
                                              ) : (
                                                tPlayers.map((p: any) => {
                                                  const dmg = pickNumber(p, [
                                                    'total_damage.to_champions',
                                                    'total_damage.dealt_to_champions',
                                                    'damage_to_champions',
                                                    'damage',
                                                    'adr',
                                                    'acs',
                                                  ])
                                                  return (
                                                    <tr key={String(p?.id ?? p?.name)}>
                                                      <td style={{ padding: '0.55rem 0.6rem' }}>{String(p?.name ?? '—')}</td>
                                                      {gameHasKDA && (
                                                        <>
                                                          <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>{typeof p?.kills === 'number' ? p.kills : '—'}</td>
                                                          <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>{typeof p?.deaths === 'number' ? p.deaths : '—'}</td>
                                                          <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>{typeof p?.assists === 'number' ? p.assists : '—'}</td>
                                                        </>
                                                      )}
                                                      {gameHasGold && (
                                                        <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>{fmtCompact(typeof p?.gold_earned === 'number' ? p.gold_earned : undefined)}</td>
                                                      )}
                                                      {gameHasPlayerDamage && (
                                                        <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>{fmtCompact(typeof dmg === 'number' ? dmg : undefined)}</td>
                                                      )}
                                                    </tr>
                                                  )
                                                })
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {pandaGames.length > 0 && (
                <div className="surface-card">
                  <SectionHeader title="Diễn biến (PandaScore)" subtitle={`Tổng ván: ${pandaGames.length}`} />
                  <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                    {pandaGames
                      .slice()
                      .sort((a, b) => (Number(a?.position ?? 0) - Number(b?.position ?? 0)))
                      .map((g) => {
                        const pos = Number(g?.position ?? 0)
                        const status = String(g?.status ?? '')
                        const begin = typeof g?.begin_at === 'string' ? g.begin_at : undefined
                        const end = typeof g?.end_at === 'string' ? g.end_at : undefined
                        const winnerId =
                          isRecord(g?.winner) && typeof (g.winner as any).id === 'number'
                            ? (g.winner as any).id
                            : undefined
                        const winnerName = winnerId
                          ? (pandaOpponentsFull.find((t) => isRecord(t) && t.id === winnerId)?.name as string | undefined)
                          : undefined

                        return (
                          <div
                            key={String(g?.id ?? `${pos}-${status}`)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              padding: '0.6rem 0.75rem',
                              borderRadius: 10,
                              border: '1px solid var(--line)',
                              background: status === 'finished' ? 'rgb(255 255 255 / 4%)' : 'rgb(255 255 255 / 3%)',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--muted-2)' }}>
                                Ván {pos || '—'}
                              </span>
                              {status && (
                                <Badge tone={status === 'running' ? 'live' : status === 'finished' ? 'default' : 'warn'}>
                                  {status}
                                </Badge>
                              )}
                              {winnerName && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                                  Winner: <b style={{ color: 'var(--muted-2)' }}>{winnerName}</b>
                                </span>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--muted)' }}>
                              <div>{begin ? `BĐ ${formatTime(begin)}` : '—'}</div>
                              <div>{end ? `KT ${formatTime(end)}` : ''}</div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {pandaOpponentsFull.length > 0 && (
                <div className="surface-card">
                  <SectionHeader title="Đội hình (PandaScore)" subtitle="Danh sách tuyển thủ theo đội" />
                  <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.75rem' }}>
                    {pandaOpponentsFull.map((t) => {
                      const teamName = typeof t?.name === 'string' ? t.name : '—'
                      const teamImg = safeUrl(t?.image_url)
                      const players = Array.isArray(t?.players) ? t.players : []
                      return (
                        <div key={String(t?.id ?? teamName)} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '0.75rem', background: 'rgb(255 255 255 / 3%)' }}>
                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            {teamImg ? <img src={teamImg} alt={teamName} style={{ width: 28, height: 28, objectFit: 'contain' }} /> : null}
                            <div style={{ fontWeight: 800, color: 'var(--muted-2)' }}>{teamName}</div>
                            {t?.acronym ? <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({String(t.acronym)})</span> : null}
                          </div>
                          {players.length === 0 ? (
                            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Không có dữ liệu player.</div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                              {players.map((p: any) => (
                                <div key={String(p?.id ?? p?.slug ?? p?.name)} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '0.5rem 0.6rem', background: 'rgb(0 0 0 / 14%)' }}>
                                  <div style={{ fontWeight: 700 }}>{String(p?.name ?? '—')}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    {p?.nationality ? String(p.nationality) : '—'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {pandaMainStreamUrl && (
                <div className="surface-card">
                  <SectionHeader title="Stream (PandaScore)" subtitle="Link stream official (nếu có)" />
                  <a href={pandaMainStreamUrl} target="_blank" rel="noopener noreferrer" className="link-inline">
                    {pandaMainStreamUrl}
                  </a>
                </div>
              )}
            </>
          )}

          {/* PandaScore raw detail */}
          {!isLoL && isPandaScore && pandaMatchIdOrSlug && (
            <div className="surface-card">
              <SectionHeader
                title="PandaScore (raw)"
                subtitle="Dữ liệu chi tiết trận đấu trả về nguyên bản từ PandaScore"
              />
              <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)' }}>
                  <span><b style={{ color: 'var(--muted-2)' }}>Match</b>: {String(pandaMatchIdOrSlug)}</span>
                  {(isLoadingPandaDetail || isLoadingPandaOpponents) && <Badge tone="warn">Đang tải…</Badge>}
                  {(isErrorPandaDetail || isErrorPandaOpponents) && <Badge tone="default">Lỗi tải</Badge>}
                </div>

                <details>
                  <summary style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--muted-2)', fontWeight: 700 }}>
                    Xem JSON match detail
                  </summary>
                  <pre style={{ marginTop: '0.6rem', padding: '0.75rem', borderRadius: 10, overflow: 'auto', maxHeight: 520, background: 'rgb(255 255 255 / 4%)', border: '1px solid var(--line)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    {pandaMatchDetail ? JSON.stringify(pandaMatchDetail, null, 2) : '—'}
                  </pre>
                </details>

                <details>
                  <summary style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--muted-2)', fontWeight: 700 }}>
                    Xem JSON opponents
                  </summary>
                  <pre style={{ marginTop: '0.6rem', padding: '0.75rem', borderRadius: 10, overflow: 'auto', maxHeight: 420, background: 'rgb(255 255 255 / 4%)', border: '1px solid var(--line)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    {pandaMatchOpponents ? JSON.stringify(pandaMatchOpponents, null, 2) : '—'}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>

        <aside className="section-stack">
          {/* Stream embed */}
          <div className="surface-card">
            <SectionHeader title="Stream trực tiếp" />
            <div style={{ marginTop: '0.5rem' }}>
              {liveEvent?.streams ? (
                <StreamEmbed streams={liveEvent.streams} isLive={isLive} />
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="video-placeholder" style={{ backgroundImage: `url(${IMG.stream})` }}>
                    <span className="video-play">▶</span>
                  </div>
                  <p style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {isLoL ? 'Không tìm thấy stream live cho trận này.' : 'Stream có sẵn trên Twitch / YouTube khi trận live.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* League logo */}
          {liveEvent?.league.image && (
            <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={liveEvent.league.image} alt={liveEvent.league.name} style={{ width: 40, height: 40, objectFit: 'contain' }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{liveEvent.league.name}</p>
                {liveEvent.blockName && (
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--muted)' }}>{liveEvent.blockName}</p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
