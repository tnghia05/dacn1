import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { MatchItem, LoLEsportsEvent, LoLLiveStatsWindow, PostgameStats, PostgameParticipant, TimelinePoint, Prediction, PandaScoreStanding } from '../../shared/api/types'
import { IMG } from '../../shared/data/mock'
import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'
import { useAuth } from '../../contexts/AuthContext'

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
function TeamLogo({ teamName, teamAcronym, imageUrl, size = 28 }: { teamName: string; teamAcronym?: string; imageUrl?: string; size?: number }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={teamAcronym ?? teamName}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, background: 'var(--surface-2)', padding: 2 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: 'var(--surface-3)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: 'var(--muted)',
      }}
    >
      {(teamAcronym ?? teamName).slice(0, 2).toUpperCase()}
    </span>
  )
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

  const lplUrl = streams.lpl?.url
  const bilibiliUrl = streams.bilibili?.url
  const hasExternal = !!(lplUrl || bilibiliUrl)

  if (!hasYoutube && !hasTwitch) {
    return (
      <div>
        <div className="video-placeholder" style={{ backgroundImage: `url(${IMG.stream})` }}>
          <span className="video-play">▶</span>
          <p style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Stream chưa có sẵn
          </p>
        </div>
        {hasExternal && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
            {lplUrl && (
              <a href={lplUrl.startsWith('http') ? lplUrl : `https://lpl.qq.com/es/live.shtml`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.9rem', borderRadius: 6, background: 'rgb(0 164 255 / 15%)', border: '1px solid rgb(0 164 255 / 40%)', fontSize: '0.8rem', fontWeight: 600, color: '#00a4ff', textDecoration: 'none' }}>
                🎮 Xem trực tiếp trên LPL →
              </a>
            )}
            {bilibiliUrl && (
              <a href={bilibiliUrl.startsWith('http') ? bilibiliUrl : `https://www.bilibili.com`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.9rem', borderRadius: 6, background: 'rgb(0 180 214 / 15%)', border: '1px solid rgb(0 180 214 / 40%)', fontSize: '0.8rem', fontWeight: 600, color: '#00b4d6', textDecoration: 'none' }}>
                📺 Xem trên Bilibili →
              </a>
            )}
          </div>
        )}
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

function GoldDiffChart({ data, blueTeam, redTeam }: { data: TimelinePoint[]; blueTeam: string; redTeam: string }) {
  if (!data.length) return null
  const W = 600, H = 140, PAD = { top: 24, bottom: 28, left: 8, right: 8 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxAbs = Math.max(...data.map(d => Math.abs(d.diff)), 500)
  const maxMin = data[data.length - 1].minute || 1

  const xScale = (min: number) => PAD.left + (min / maxMin) * innerW
  const yScale = (diff: number) => PAD.top + innerH / 2 - (diff / maxAbs) * (innerH / 2)
  const zeroY = PAD.top + innerH / 2

  // Build SVG path for the area above/below zero
  const pts = data.map(d => ({ x: xScale(d.minute), y: yScale(d.diff), diff: d.diff }))

  const bluePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    + ` L${pts[pts.length - 1].x.toFixed(1)},${zeroY} L${pts[0].x.toFixed(1)},${zeroY} Z`

  const minuteMarks = Array.from({ length: Math.floor(maxMin / 5) + 1 }, (_, i) => i * 5)

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        {/* Zero line */}
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

        {/* Blue advantage area */}
        <clipPath id="clip-above"><rect x={PAD.left} y={PAD.top} width={innerW} height={innerH / 2} /></clipPath>
        <path d={bluePath} fill="#4e9af1" fillOpacity={0.45} clipPath="url(#clip-above)" />

        {/* Red advantage area */}
        <clipPath id="clip-below"><rect x={PAD.left} y={zeroY} width={innerW} height={innerH / 2} /></clipPath>
        <path d={bluePath} fill="#e84057" fillOpacity={0.45} clipPath="url(#clip-below)" />

        {/* Line */}
        <polyline
          points={pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} strokeLinejoin="round"
        />

        {/* Minute labels */}
        {minuteMarks.map(m => (
          <text key={m} x={xScale(m).toFixed(1)} y={H - 4} textAnchor="middle"
            fontSize={9} fill="rgba(255,255,255,0.35)">{m < 10 ? `0${m}` : m}</text>
        ))}

        {/* Team labels */}
        <text x={PAD.left + 4} y={PAD.top + 11} fontSize={9} fill="#4e9af1" fontWeight={700}>{blueTeam}</text>
        <text x={PAD.left + 4} y={H - PAD.bottom - 4} fontSize={9} fill="#e84057" fontWeight={700}>{redTeam}</text>
      </svg>
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

function useCountUp(target: number, active: boolean, duration = 700) {
  const [val, setVal] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!active || !target) { setVal(0); return }
    let current = 0
    const steps = 45
    const inc = target / steps
    timerRef.current = setInterval(() => {
      current += inc
      if (current >= target) {
        setVal(target)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setVal(parseFloat(current.toFixed(2)))
      }
    }, duration / steps)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active, target, duration])
  return val
}

function PredictionPanel({ matchId, matchStatus, teams, oddsA, oddsB, visible }: {
  matchId: string
  matchStatus: string
  teams: Array<{ name?: string; acronym?: string }>
  oddsA?: number
  oddsB?: number
  visible: boolean
}) {
  const { user, refreshUser } = useAuth()
  const qc = useQueryClient()
  const [bet, setBet] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<0 | 1 | null>(null)

  const betN = parseInt(bet, 10)
  const potentialA = oddsA && betN > 0 ? Math.floor(betN * oddsA) : null
  const potentialB = oddsB && betN > 0 ? Math.floor(betN * oddsB) : null
  const animOddsA = useCountUp(oddsA ?? 0, visible)
  const animOddsB = useCountUp(oddsB ?? 0, visible)
  const animPotA = useCountUp(potentialA ?? 0, visible && !!potentialA)
  const animPotB = useCountUp(potentialB ?? 0, visible && !!potentialB)

  const { data: myPred } = useQuery({
    queryKey: ['my-pred', matchId],
    queryFn: () => apiRequest<Prediction | null>(`/points/predictions/match/${matchId}`),
    enabled: !!user && !!matchId,
  })

  const placeMutation = useMutation({
    mutationFn: (body: { matchId: string; teamIndex: number; pointsBet: number; oddsSnapshot: number }) =>
      apiRequest<Prediction>('/points/predictions', { method: 'POST', body }),
    onSuccess: (pred) => {
      setSuccess(`✅ Đã đặt ${pred.pointsBet.toLocaleString('vi-VN')} điểm cho ${pred.teamName}`)
      setError('')
      setBet('')
      qc.invalidateQueries({ queryKey: ['my-pred', matchId] })
      qc.invalidateQueries({ queryKey: ['points-me'] })
      refreshUser()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Đặt cược thất bại'),
  })

  function handleConfirm() {
    if (selectedTeam === null) { setError('Vui lòng chọn một đội'); return }
    const pts = parseInt(bet, 10)
    if (!pts || pts < 1) { setError('Nhập số điểm hợp lệ (tối thiểu 1)'); return }
    const odds = selectedTeam === 0 ? oddsA : oddsB
    if (!odds) { setError('Không có odds cho đội này'); return }
    setError('')
    placeMutation.mutate({ matchId, teamIndex: selectedTeam, pointsBet: pts, oddsSnapshot: odds })
  }

  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Bạn cần đăng nhập để tham gia dự đoán.</span>
      <Link to="/auth/login"><Btn>Đăng nhập để cược</Btn></Link>
    </div>
  )

  if (matchStatus === 'finished' || matchStatus === 'live') return (
    <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
      {matchStatus === 'live'
        ? '🔴 Trận đang diễn ra — không thể đặt cược'
        : '🏁 Trận đã kết thúc'}
    </div>
  )

  if (myPred) {
    const STATUS_COLOR: Record<string, string> = { pending: '#fb923c', won: '#4ade80', lost: '#f87171', cancelled: 'var(--muted)' }
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dự đoán của bạn</p>
        <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgb(255 255 255 / 4%)', border: '1px solid var(--line)', display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{myPred.teamName}</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted-2)', fontVariantNumeric: 'tabular-nums' }}>
            Cược: {myPred.pointsBet.toLocaleString('vi-VN')} điểm · Odds: {myPred.oddsAtBet.toFixed(2)}
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: STATUS_COLOR[myPred.status] }}>
              {myPred.status === 'pending' ? '⏳ Đang chờ kết quả' : myPred.status === 'won' ? '🏆 Thắng!' : myPred.status === 'lost' ? '❌ Thua' : '🚫 Đã huỷ'}
            </span>
            {myPred.status === 'won' && (
              <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>+{(myPred.pointsWon ?? 0).toLocaleString('vi-VN')} điểm</span>
            )}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-2)' }}>Mỗi trận chỉ được dự đoán một lần.</p>
      </div>
    )
  }

  if (!oddsA && !oddsB) return null

  const selPotential = selectedTeam === 0 ? animPotA : selectedTeam === 1 ? animPotB : null
  const canConfirm = selectedTeam !== null && !placeMutation.isPending

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* Step hint */}
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-2)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <span style={{ color: selectedTeam !== null ? '#4ade80' : '#63b3ed', fontWeight: 700 }}>①</span> Chọn đội
        <span style={{ opacity: 0.3 }}>→</span>
        <span style={{ color: betN > 0 ? '#4ade80' : selectedTeam !== null ? '#63b3ed' : 'var(--muted-2)', fontWeight: 700 }}>②</span> Nhập điểm
        <span style={{ opacity: 0.3 }}>→</span>
        <span style={{ color: canConfirm && betN > 0 ? '#63b3ed' : 'var(--muted-2)', fontWeight: 700 }}>③</span> Xác nhận
      </p>

      {/* Selectable odds cards */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {([0, 1] as const).map(idx => {
          const isA = idx === 0
          const odds = isA ? oddsA : oddsB
          const animOdds = isA ? animOddsA : animOddsB
          const teamName = teams[idx]?.name ?? (isA ? 'Đội A' : 'Đội B')
          const isSelected = selectedTeam === idx
          const isOther = selectedTeam !== null && selectedTeam !== idx
          const clr = isA ? '#e4b84d' : '#e2e8f0'
          const clrRgb = isA ? '228,184,77' : '226,232,240'
          if (!odds) return null
          return (
            <button
              key={idx}
              onClick={() => { setSelectedTeam(isSelected ? null : idx); setError('') }}
              style={{
                flex: 1,
                padding: '1.1rem 0.85rem 0.9rem',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
                transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease, box-shadow 0.28s ease, border-color 0.2s ease',
                background: isSelected
                  ? `linear-gradient(160deg, rgba(${clrRgb},0.14) 0%, rgba(${clrRgb},0.06) 100%)`
                  : 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: isSelected ? `1.5px solid rgba(${clrRgb},0.85)` : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: isSelected
                  ? `0 0 28px rgba(${clrRgb},0.4), 0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`
                  : '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                transform: isSelected ? 'scale(1.06) translateY(-3px)' : isOther ? 'scale(0.93) translateY(3px)' : 'scale(1)',
                opacity: isOther ? 0.38 : 1,
              }}
            >
              {/* Top glow ray */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '80%', height: '1.5px',
                  background: `linear-gradient(90deg, transparent, rgba(${clrRgb},0.95), transparent)`,
                  borderRadius: '999px',
                }} />
              )}
              {/* Inner radial glow */}
              {isSelected && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 50% -10%, rgba(${clrRgb},0.18) 0%, transparent 65%)`,
                  pointerEvents: 'none',
                }} />
              )}

              <p style={{
                margin: 0, fontSize: '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: isSelected ? clr : 'rgba(255,255,255,0.35)',
                transition: 'color 0.22s',
              }}>{teamName}</p>

              <p style={{
                margin: '0.4rem 0 0', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                color: clr,
                textShadow: isSelected
                  ? `0 0 28px rgba(${clrRgb},0.75), 0 2px 4px rgba(0,0,0,0.5)`
                  : `0 0 12px rgba(${clrRgb},0.3)`,
                transition: 'all 0.22s ease',
              }}>
                {animOdds.toFixed(2)}
              </p>

              <div style={{ marginTop: '0.55rem', minHeight: '1.1rem' }}>
                {isSelected ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.2rem 0.65rem', borderRadius: '999px',
                    background: `rgba(${clrRgb},0.18)`, border: `1px solid rgba(${clrRgb},0.55)`,
                    fontSize: '0.62rem', color: clr, fontWeight: 700, letterSpacing: '0.06em',
                  }}>✓ ĐÃ CHỌN</span>
                ) : (
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>bấm để chọn</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Points input */}
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <label style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Số điểm cược</label>
        <div style={{ position: 'relative' }}>
          <input
            type="number" min={1} placeholder="0"
            value={bet}
            onChange={e => { setBet(e.target.value); setError(''); setSuccess('') }}
            style={{
              width: '100%', padding: '0.75rem 3.5rem 0.75rem 1rem',
              borderRadius: '12px',
              border: `1.5px solid ${betN > 0 ? 'rgba(99,179,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text)', fontSize: '1.15rem', fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: betN > 0 ? '0 0 0 3px rgba(99,179,237,0.12)' : 'none',
            }}
          />
          <span style={{
            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, pointerEvents: 'none',
          }}>điểm</span>
        </div>
        {selPotential !== null && selPotential > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.85rem', borderRadius: '10px',
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Tiềm năng nhận:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
              +{Math.floor(selPotential).toLocaleString('vi-VN')} điểm
            </span>
          </div>
        )}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        style={{
          width: '100%', padding: '0.9rem 1rem',
          borderRadius: '12px', border: 'none',
          cursor: canConfirm ? 'pointer' : 'not-allowed',
          fontSize: '0.92rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff',
          background: canConfirm
            ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)'
            : 'rgba(255,255,255,0.07)',
          boxShadow: canConfirm
            ? '0 4px 24px rgba(79,70,229,0.55), 0 1px 0 rgba(255,255,255,0.15) inset'
            : 'none',
          transform: canConfirm ? 'translateY(-1px)' : 'none',
          opacity: canConfirm ? 1 : 0.35,
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {placeMutation.isPending
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>⏳ Đang xử lý…</span>
          : '✔ Xác nhận dự đoán'}
      </button>

      {error && (
        <div style={{ display: 'flex', gap: '0.4rem', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <span style={{ fontSize: '0.82rem', color: '#f87171' }}>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', gap: '0.4rem', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <span style={{ fontSize: '0.82rem', color: '#4ade80' }}>{success}</span>
        </div>
      )}
      <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--muted-2)', textAlign: 'center' }}>1 điểm = 1 đơn vị · Thắng được nhân theo odds lúc đặt</p>
    </div>
  )
}


export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedGameIdx, setSelectedGameIdx] = useState(0)
  const [showPrediction, setShowPrediction] = useState(false)
  const [predAnimIn, setPredAnimIn] = useState(false)

  function togglePrediction() {
    if (!showPrediction) {
      setShowPrediction(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setPredAnimIn(true)))
    } else {
      setPredAnimIn(false)
      setTimeout(() => setShowPrediction(false), 380)
    }
  }

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
    enabled: Boolean(isPandaScore && pandaMatchIdOrSlug),
    staleTime: 60_000,
  })

  const {
    data: pandaMatchOpponents,
    isLoading: isLoadingPandaOpponents,
    isError: isErrorPandaOpponents,
  } = useQuery({
    queryKey: ['pandascore-match-opponents', pandaMatchIdOrSlug],
    queryFn: () => apiRequest<unknown>(`/pandascore/matches/${pandaMatchIdOrSlug}/opponents`),
    enabled: Boolean(isPandaScore && pandaMatchIdOrSlug),
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

  const { data: timeline } = useQuery({
    queryKey: ['lol-timeline', selectedGameId],
    queryFn: () => apiRequest<TimelinePoint[]>(`/lol-esports/timeline/${selectedGameId}`),
    enabled: isLoL && !!selectedGameId && selectedGame?.state === 'completed',
    staleTime: 10 * 60_000,
  })

  const serieSlug = panda?.serie?.slug
  const { data: serieDetail } = useQuery<any>({
    queryKey: ['pandascore-serie-detail', serieSlug],
    queryFn: () => apiRequest<any>(`/pandascore/series/${serieSlug}`),
    enabled: Boolean(serieSlug),
    staleTime: 10 * 60_000,
  })

  const tournaments = Array.isArray(serieDetail?.tournaments) ? serieDetail.tournaments : []
  const regularTournament = tournaments.find((t: any) => {
    const name = (t.name || '').toLowerCase()
    return name.includes('regular') || name.includes('group') || name.includes('swiss') || name.includes('vòng bảng') || name.includes('stage 1') || name.includes('stage 2')
  }) ?? tournaments.find((t: any) => {
    const name = (t.name || '').toLowerCase()
    return !name.includes('playoff') && !name.includes('final') && !name.includes('knockout')
  }) ?? tournaments[0]

  const tournamentId = regularTournament?.id ?? panda?.tournament?.id
  const { data: standings = [], isLoading: isLoadingStandings } = useQuery<PandaScoreStanding[]>({
    queryKey: ['tournament-standings', tournamentId],
    queryFn: () => apiRequest<PandaScoreStanding[]>(`/pandascore/tournaments/${tournamentId}/standings`, { noAuth: true }),
    enabled: Boolean(tournamentId),
    staleTime: 1000 * 60 * 5,
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
          {kalstropFixtureWithOdds && match.status === 'not_started' && id && (
            <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
              <button
                onClick={togglePrediction}
                style={{
                  background: showPrediction
                    ? 'rgba(99,179,237,0.18)'
                    : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${showPrediction ? 'rgba(99,179,237,0.55)' : 'rgba(255,255,255,0.18)'}`,
                  color: showPrediction ? '#93c5fd' : '#fff',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  transition: 'all 0.22s ease',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {showPrediction ? '× Đóng' : '🎯 Dự đoán ngay'}
              </button>
            </div>
          )}
        </div>
      </section>

      {id && showPrediction && (
        <>
          {/* Backdrop */}
          <div
            onClick={togglePrediction}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.52)',
              backdropFilter: 'blur(3px)',
              zIndex: 98,
              opacity: predAnimIn ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
          {/* Drawer */}
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'clamp(280px, 33vw, 460px)',
              background: 'var(--surface, #0d1117)',
              borderLeft: '1px solid var(--line)',
              boxShadow: '-12px 0 48px rgba(0,0,0,0.6)',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              transform: predAnimIn ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.42s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎯 Dự đoán kết quả</p>
              <button onClick={togglePrediction} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '0 0.2rem' }}>×</button>
            </div>
            {/* Match info strip */}
            {kalstropFixtureWithOdds && (
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--line)', flexShrink: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                {match.teams[0]?.name ?? 'Team A'}
                <span style={{ margin: '0 0.5rem', opacity: 0.4 }}>vs</span>
                {match.teams[1]?.name ?? 'Team B'}
              </div>
            )}
            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              <PredictionPanel
                matchId={id}
                matchStatus={match.status}
                teams={match.teams}
                oddsA={kalstropFixtureWithOdds?.teams[0].oddsDecimal}
                oddsB={kalstropFixtureWithOdds?.teams[1].oddsDecimal}
                visible={predAnimIn}
              />
            </div>
          </div>
        </>
      )}

      <div className="two-col">
        <div className="section-stack">
          {/* Pre-match Kalstrop widget — at the top */}
          {isLoL && kalstropFixtureWithOdds?.preMatchWidgetUrl && richEvent?.state !== 'completed' && (
            <PreMatchWidgetCollapsible fixture={kalstropFixtureWithOdds} />
          )}

          {/* Stream */}
          {isLoL && (
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
                    <p style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--muted)' }}>Không tìm thấy stream live cho trận này.</p>
                  </div>
                )}
              </div>
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
              {/* Gold difference timeline */}
              {timeline && timeline.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chênh lệch vàng</p>
                  <GoldDiffChart
                    data={timeline}
                    blueTeam={richEvent?.match.teams[0]?.code ?? 'Blue'}
                    redTeam={richEvent?.match.teams[1]?.code ?? 'Red'}
                  />
                </div>
              )}
              {isPostgameLoading && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '1rem 0' }}>Đang tải...</div>}
              {!isPostgameLoading && postgame && (
                <PostgameTable stats={postgame}
                  blueTeamName={richEvent?.match.teams[0]?.name ?? richEvent?.match.teams[0]?.code ?? 'Blue'}
                  redTeamName={richEvent?.match.teams[1]?.name ?? richEvent?.match.teams[1]?.code ?? 'Red'} />
              )}
              {!isPostgameLoading && !postgame && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '1rem 0' }}>Không có dữ liệu chi tiết cho ván này.</div>}
            </div>
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
          {/* League card (with fallback to match data) */}
          {(liveEvent?.league.image || match?.leagueName) && (
            <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              {liveEvent?.league.image ? (
                <img src={liveEvent.league.image} alt={liveEvent.league.name} style={{ width: 44, height: 44, objectFit: 'contain' }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem'
                }}>
                  {(match.leagueName ?? match.tournamentName ?? 'G').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  {liveEvent?.league.name ?? match.leagueName ?? match.tournamentName}
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'var(--muted)' }}>
                  {liveEvent?.blockName ?? match.serieName ?? 'Giải đấu chuyên nghiệp'}
                </p>
              </div>
            </div>
          )}

          {/* Leaderboard / Standings */}
          <div className="surface-card" style={{ padding: '1.25rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🏆</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bảng xếp hạng</h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--muted)' }}>
                  {regularTournament?.name ?? panda?.tournament?.name ?? match.tournamentName ?? 'Đang diễn ra'}
                </p>
              </div>
            </div>

            {isLoadingStandings && (
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 38, borderRadius: 8, background: 'var(--surface-2)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            )}

            {!isLoadingStandings && standings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
                Chưa có dữ liệu xếp hạng chính thức.
              </div>
            )}

            {!isLoadingStandings && standings.length > 0 && (
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                {/* Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 52px 42px',
                  padding: '0 0.5rem 0.4rem',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  color: 'var(--muted-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <span style={{ textAlign: 'center' }}>#</span>
                  <span>Đội</span>
                  <span style={{ textAlign: 'center' }}>H.Số</span>
                  <span style={{ textAlign: 'right' }}>%</span>
                </div>

                {/* Rows */}
                {standings.map((s, idx) => {
                  const winRate = s.total > 0 ? s.wins / s.total : 0
                  const idA = match?.teams[0]?.externalId
                  const idB = match?.teams[1]?.externalId
                  const nameA = (match?.teams[0]?.name ?? '').toLowerCase()
                  const nameB = (match?.teams[1]?.name ?? '').toLowerCase()
                  const acronymA = (match?.teams[0]?.acronym ?? '').toLowerCase()
                  const acronymB = (match?.teams[1]?.acronym ?? '').toLowerCase()
                  const sName = s.team.name.toLowerCase()
                  const sAcronym = (s.team.acronym ?? '').toLowerCase()

                  const isCompTeam = (idA && s.team.id === idA) ||
                                     (idB && s.team.id === idB) ||
                                     sName.includes(nameA) || nameA.includes(sName) ||
                                     sName.includes(nameB) || nameB.includes(sName) ||
                                     (acronymA && sAcronym === acronymA) ||
                                     (acronymB && sAcronym === acronymB)

                  const playoffCutoff = standings.length >= 10 ? 6 : (standings.length >= 8 ? 4 : 4)
                  const showPlayoffDivider = idx === playoffCutoff - 1

                  // Medal icon/text style
                  const isTop3 = s.rank <= 3
                  const medalIcons = ['🥇', '🥈', '🥉']
                  const medalIcon = isTop3 ? medalIcons[s.rank - 1] : null

                  return (
                    <div key={s.team.id}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '28px 1fr 52px 42px',
                          alignItems: 'center',
                          padding: '0.5rem',
                          borderRadius: 8,
                          background: isCompTeam
                            ? `${hero.accent}20`
                            : 'transparent',
                          border: isCompTeam
                            ? `1px solid ${hero.accent}45`
                            : '1px solid transparent',
                          boxShadow: isCompTeam ? `0 0 10px ${hero.accent}12` : undefined,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Rank */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {medalIcon ? (
                            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{medalIcon}</span>
                          ) : (
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                              {s.rank}
                            </span>
                          )}
                        </div>

                        {/* Team */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                          <TeamLogo teamName={s.team.name} teamAcronym={s.team.acronym} imageUrl={s.team.image_url} size={22} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontWeight: isCompTeam ? 800 : 600,
                              fontSize: '0.82rem',
                              color: isCompTeam ? '#fff' : 'var(--muted-2)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {s.team.name}
                            </p>
                          </div>
                          {isCompTeam && (
                            <span style={{
                              display: 'inline-flex',
                              padding: '0.08rem 0.35rem',
                              background: hero.accent,
                              color: '#000',
                              fontSize: '0.58rem',
                              fontWeight: 900,
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              lineHeight: 1,
                              flexShrink: 0
                            }}>
                              Trận này
                            </span>
                          )}
                        </div>

                        {/* Record W-L */}
                        <div style={{
                          textAlign: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: isCompTeam ? '#fff' : 'var(--muted)',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {s.wins}-{s.losses}
                        </div>

                        {/* Win Rate */}
                        <div style={{
                          textAlign: 'right',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: winRate >= 0.6
                            ? '#4ade80'
                            : winRate >= 0.4
                            ? '#fbbf24'
                            : '#f87171',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {Math.round(winRate * 100)}%
                        </div>
                      </div>

                      {/* Playoff dotted divider */}
                      {showPlayoffDivider && (
                        <div style={{ position: 'relative', margin: '0.35rem 0.5rem' }}>
                          <div style={{ borderTop: '1px dashed rgba(74,222,128,0.25)' }} />
                          <span style={{
                            position: 'absolute', right: '0.5rem', top: -7,
                            fontSize: '0.55rem', color: 'rgba(74,222,128,0.7)',
                            background: 'var(--surface)', padding: '0 0.3rem',
                            fontWeight: 700, letterSpacing: '0.05em',
                          }}>Playoffs ↑</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {panda?.serie?.slug && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--line)', paddingTop: '0.85rem', textAlign: 'center' }}>
                <Link to={`/tournaments/${panda.serie.slug}`} style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  Chi tiết giải đấu ➔
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
