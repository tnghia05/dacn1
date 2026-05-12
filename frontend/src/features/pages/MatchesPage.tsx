import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { MatchItem, PaginatedResponse, LoLEsportsEvent } from '../../shared/api/types'
import { Badge, SectionHeader, Tabs } from '../../shared/components/Ui'

type Tab = 'all' | 'live' | 'upcoming' | 'finished'
type GridTab = 'all' | 'cs2' | 'dota2'

type GridTeamBase = { id: string; name: string }
type GridSeries = {
  id: string; startTimeScheduled: string
  format?: { nameShortened: string }
  tournament?: { nameShortened: string }
  title?: { id: string; name: string }
  teams: { baseInfo: GridTeamBase; scoreAdvantage?: number }[]
  seriesScore?: { a: number; b: number }
  finished?: boolean
  started?: boolean
}
type Source = 'pandascore' | 'lolesports' | 'grid'

const GAMES = [
  { value: '', label: 'Tất cả game' },
  { value: 'lol', label: 'LoL' },
  { value: 'valorant', label: 'Valorant' },
  { value: 'csgo', label: 'CS2' },
  { value: 'dota2', label: 'Dota 2' },
  { value: 'ow2', label: 'Overwatch 2' },
  { value: 'rl', label: 'Rocket League' },
]

const ALL_REGIONS = { value: '', label: 'Tất cả khu vực' }
const REGIONS_BY_GAME: Record<string, { value: string; label: string }[]> = {
  lol:      [ALL_REGIONS,
    { value: 'lck', label: 'LCK' },
    { value: 'lpl', label: 'LPL' },
    { value: 'lec', label: 'LEC' },
    { value: 'lcs', label: 'LCS' },
    { value: 'lcp', label: 'LCP' },
    { value: 'pcs', label: 'PCS' },
    { value: 'vcs', label: 'VCS' },
    { value: 'cblol', label: 'CBLOL' },
    { value: 'ljl', label: 'LJL' },
    { value: 'lco', label: 'LCO' },
    { value: 'lck-challengers', label: 'LCK Challengers' },
    { value: 'first-stand', label: 'First Stand' },
    { value: 'americas-cup', label: 'Americas Cup' },
    { value: 'msi', label: 'MSI' },
    { value: 'worlds', label: 'Worlds' },
  ],
  valorant: [ALL_REGIONS, { value: 'vct-pacific', label: 'VCT Pacific' }, { value: 'vct-emea', label: 'VCT EMEA' }, { value: 'vct-americas', label: 'VCT Americas' }, { value: 'vct-cn', label: 'VCT China' }],
  csgo:     [ALL_REGIONS, { value: 'esl-pro-league', label: 'ESL Pro League' }, { value: 'blast-premier', label: 'BLAST Premier' }, { value: 'iem', label: 'IEM' }, { value: 'esl-one', label: 'ESL One' }],
  dota2:    [ALL_REGIONS, { value: 'dpc-na', label: 'DPC NA' }, { value: 'dpc-eu', label: 'DPC EU' }, { value: 'dpc-cn', label: 'DPC CN' }, { value: 'dpc-sea', label: 'DPC SEA' }],
  _default: [ALL_REGIONS],
}

const GAME_LABELS: Record<string, string> = {
  lol: 'LoL', csgo: 'CS2', dota2: 'Dota 2', valorant: 'Valorant',
  ow2: 'OW2', rl: 'RL', mlbb: 'MLBB', kog: 'KoG', r6: 'R6', cod: 'CoD',
}

function formatTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}


interface KalstropTeam {
  id: string; name: string; logoUrl?: string
  oddsDecimal?: number; probability?: number
}
interface KalstropFixture {
  id: string; slug: string; name: string; startTime: string
  status: 'LIVE' | 'PREMATCH' | 'FINISHED'
  competition: string; competitionSlug: string; category: string
  teams: [KalstropTeam, KalstropTeam]
  defaultMarketId?: string
}

const WS_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '')
let _kalstropSocket: Socket | null = null
function getKalstropSocket(): Socket {
  if (!_kalstropSocket || _kalstropSocket.disconnected) {
    _kalstropSocket = io(`${WS_BASE}/kalstrop`, { transports: ['websocket'] })
  }
  return _kalstropSocket
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findMatchingOdds(
  nameA: string, nameB: string,
  fixtures: KalstropFixture[]
): { oddsA: KalstropTeam; oddsB: KalstropTeam } | undefined {
  const na = normalizeName(nameA)
  const nb = normalizeName(nameB)
  for (const f of fixtures) {
    const k0 = normalizeName(f.teams[0].name)
    const k1 = normalizeName(f.teams[1].name)
    if ((k0.includes(na) || na.includes(k0)) && (k1.includes(nb) || nb.includes(k1)))
      return { oddsA: f.teams[0], oddsB: f.teams[1] }
    if ((k0.includes(nb) || nb.includes(k0)) && (k1.includes(na) || na.includes(k1)))
      return { oddsA: f.teams[1], oddsB: f.teams[0] }
  }
  return undefined
}

function OddsPlaceholder() {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginTop: '0.25rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0.2rem 0.55rem', borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--line)', opacity: 0.35 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)', lineHeight: 1 }}>—</div>
      </div>
      <span style={{ fontSize: '0.6rem', color: 'var(--muted-2)' }}>ODDS</span>
      <div style={{ textAlign: 'center', padding: '0.2rem 0.55rem', borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--line)', opacity: 0.35 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)', lineHeight: 1 }}>—</div>
      </div>
    </div>
  )
}

function OddsBtn({ decimal, probability, suspended }: { decimal?: number; probability?: number; suspended?: boolean }) {
  if (!decimal) return null
  const isUnderdog = (probability ?? 0.5) < 0.5
  return (
    <div style={{
      textAlign: 'center', padding: '0.2rem 0.55rem', borderRadius: 5, cursor: 'default',
      background: isUnderdog ? 'rgba(200,155,60,0.12)' : 'var(--surface-2)',
      border: `1px solid ${isUnderdog ? 'rgba(200,155,60,0.45)' : 'var(--line)'}`,
      opacity: suspended ? 0.45 : 1,
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: isUnderdog ? '#c89b3c' : 'var(--fg)', lineHeight: 1 }}>
        {decimal.toFixed(2)}
      </div>
    </div>
  )
}

interface LiveOddsEntry { homeDecimal?: number; awayDecimal?: number; homeProb?: number; awayProb?: number; suspended?: boolean }

function OddsPanel({ oddsA, oddsB, live }: { oddsA: KalstropTeam; oddsB: KalstropTeam; live?: LiveOddsEntry }) {
  const homeD = live?.homeDecimal ?? oddsA.oddsDecimal
  const awayD = live?.awayDecimal ?? oddsB.oddsDecimal
  const homeP = live?.homeProb ?? oddsA.probability
  const awayP = live?.awayProb ?? oddsB.probability
  if (!homeD && !awayD) return null
  return (
    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginTop: '0.25rem', alignItems: 'center' }}>
      <OddsBtn decimal={homeD} probability={homeP} suspended={live?.suspended} />
      <span style={{ fontSize: '0.6rem', color: live ? '#4ade80' : 'var(--muted-2)' }}>{live ? '●' : ''} ODDS</span>
      <OddsBtn decimal={awayD} probability={awayP} suspended={live?.suspended} />
    </div>
  )
}

function LoLEsportsRow({ e, lolOdds, liveOddsMap }: { e: LoLEsportsEvent; lolOdds: KalstropFixture[]; liveOddsMap: Map<string, LiveOddsEntry> }) {
  const [tA, tB] = e.match.teams
  const isLive = e.state === 'inProgress'
  const scoreA = tA?.result?.gameWins ?? 0
  const scoreB = tB?.result?.gameWins ?? 0
  const matchedFixture = (e.state !== 'completed' && tA && tB)
    ? lolOdds.find(f => {
        const na = normalizeName(tA.name ?? tA.code ?? ''), nb = normalizeName(tB.name ?? tB.code ?? '')
        const k0 = normalizeName(f.teams[0].name), k1 = normalizeName(f.teams[1].name)
        return (k0.includes(na)||na.includes(k0))&&(k1.includes(nb)||nb.includes(k1))
          || (k0.includes(nb)||nb.includes(k0))&&(k1.includes(na)||na.includes(k1))
      })
    : undefined
  if (!matchedFixture && e.state === 'unstarted' && tA && tB && lolOdds.length > 0) {
    console.debug('[Odds] No match:', tA.name ?? tA.code, 'vs', tB.name ?? tB.code,
      '| Kalstrop teams:', lolOdds.map(f => `${f.teams[0].name}/${f.teams[1].name}`).join(', '))
  }
  const matched = matchedFixture ? { oddsA: matchedFixture.teams[0], oddsB: matchedFixture.teams[1] } : undefined
  const liveOdds = matchedFixture?.defaultMarketId ? liveOddsMap.get(matchedFixture.defaultMarketId) : undefined
  return (
    <Link to={`/lol-esports/${e.match.id}`} className="match-row">
      <div className="match-team">
        {tA?.image
          ? <img src={tA.image} alt={tA.code} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'var(--surface-2)', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          : <span className="team-logo">{(tA?.code ?? 'TBD').slice(0, 2)}</span>}
        <span>{tA?.code ?? 'TBD'}</span>
      </div>

      <div className="match-mid">
        {isLive ? <Badge tone="live">LIVE</Badge> : e.state === 'unstarted' ? <Badge tone="warn">Sắp đấu</Badge> : <Badge tone="default">Kết thúc</Badge>}
        <div className="match-score">{scoreA} : {scoreB}</div>
        <div>BO{e.match.strategy?.count ?? '?'} · {e.league.name}</div>
        {e.blockName && <div style={{ color: 'var(--muted-2)' }}>{e.blockName}</div>}
        {matched ? <OddsPanel oddsA={matched.oddsA} oddsB={matched.oddsB} live={liveOdds} /> : e.state !== 'completed' ? <OddsPlaceholder /> : null}
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {e.streams.youtube && (
            <a href={`https://www.youtube.com/watch?v=${e.streams.youtube.videoId}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.68rem', color: '#ff0000', textDecoration: 'none', fontWeight: 600 }}
              onClick={(ev) => ev.stopPropagation()}>▶ YT</a>
          )}
          {e.streams.twitch && (
            <a href={`https://www.twitch.tv/${e.streams.twitch.channel}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.68rem', color: '#9146ff', textDecoration: 'none', fontWeight: 600 }}
              onClick={(ev) => ev.stopPropagation()}>● Twitch</a>
          )}
        </div>
      </div>

      <div className="match-team">
        {tB?.image
          ? <img src={tB.image} alt={tB.code} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'var(--surface-2)', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          : <span className="team-logo">{(tB?.code ?? 'TBD').slice(0, 2)}</span>}
        <span>{tB?.code ?? 'TBD'}</span>
      </div>
    </Link>
  )
}

function GridSeriesRow({ s, gridOdds }: { s: GridSeries; gridOdds: KalstropFixture[] }) {
  const [tA, tB] = s.teams
  const now = Date.now()
  const start = new Date(s.startTimeScheduled).getTime()
  const isLive = start < now && start > now - 4 * 3600_000
  const isPast = start < now - 4 * 3600_000
  const titleId = s.title?.id ?? '28'
  const titleLabel = titleId === '28' ? '🔫 CS2' : titleId === '2' ? '🗡️ Dota2' : s.title?.name ?? ''
  const titleColor = titleId === '28' ? '#e8a100' : '#c0392b'
  const matched = !isPast
    ? findMatchingOdds(tA?.baseInfo?.name ?? '', tB?.baseInfo?.name ?? '', gridOdds)
    : undefined
  return (
    <Link to={`/grid/${s.id}`} className="match-row">
      <div className="match-team">
        <span className="team-logo">{(tA?.baseInfo?.name ?? 'TBD').slice(0, 2).toUpperCase()}</span>
        <span>{tA?.baseInfo?.name ?? 'TBD'}</span>
      </div>
      <div className="match-mid">
        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 4, background: titleColor + '22', color: titleColor }}>{titleLabel}</span>
        {isLive ? <Badge tone="live">LIVE</Badge> : isPast ? <Badge tone="default">Kết thúc</Badge> : <Badge tone="warn">Sắp đấu</Badge>}
        {s.seriesScore && (s.seriesScore.a > 0 || s.seriesScore.b > 0) && (
          <div className="match-score">{s.seriesScore.a} : {s.seriesScore.b}</div>
        )}
        <div>{s.format?.nameShortened}{s.tournament?.nameShortened ? ` · ${s.tournament.nameShortened}` : ''}</div>
        <div style={{ color: 'var(--muted-2)' }}>{new Date(s.startTimeScheduled).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</div>
        {matched && <OddsPanel oddsA={matched.oddsA} oddsB={matched.oddsB} />}
      </div>
      <div className="match-team">
        <span className="team-logo">{(tB?.baseInfo?.name ?? 'TBD').slice(0, 2).toUpperCase()}</span>
        <span>{tB?.baseInfo?.name ?? 'TBD'}</span>
      </div>
    </Link>
  )
}

export function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const source = (searchParams.get('source') as Source) || 'pandascore'
  const tab = (searchParams.get('tab') as Tab) || 'all'
  const game = searchParams.get('game') || ''
  const region = searchParams.get('region') || ''
  const page = Number(searchParams.get('page') || 1)
  const lolPage = Number(searchParams.get('lolPage') || 1)

  function setSource(s: Source) { setSearchParams(p => { const n = new URLSearchParams(p); n.set('source', s); n.delete('page'); n.delete('lolPage'); return n }, { replace: true }) }
  function setTab(t: Tab) { setSearchParams(p => { const n = new URLSearchParams(p); n.set('tab', t); n.delete('page'); n.delete('lolPage'); return n }, { replace: true }) }
  function setGame(g: string) { setSearchParams(p => { const n = new URLSearchParams(p); g ? n.set('game', g) : n.delete('game'); n.delete('region'); n.delete('page'); n.delete('lolPage'); return n }, { replace: true }) }
  function setRegion(r: string) { setSearchParams(p => { const n = new URLSearchParams(p); r ? n.set('region', r) : n.delete('region'); n.delete('page'); n.delete('lolPage'); return n }, { replace: true }) }
  function setPage(pg: number | ((p: number) => number)) { setSearchParams(p => { const n = new URLSearchParams(p); n.set('page', String(typeof pg === 'function' ? pg(Number(p.get('page') || 1)) : pg)); return n }, { replace: true }) }
  function setLolPage(pg: number | ((p: number) => number)) { setSearchParams(p => { const n = new URLSearchParams(p); n.set('lolPage', String(typeof pg === 'function' ? pg(Number(p.get('lolPage') || 1)) : pg)); return n }, { replace: true }) }

  const [gridTab, setGridTab] = useState<GridTab>('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches', tab, game, region, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (tab !== 'all') params.set('tab', tab)
      if (game) params.set('game', game)
      if (region) params.set('region', region)
      return apiRequest<PaginatedResponse<MatchItem>>(`/matches?${params}`)
    },
    staleTime: 60_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['matches-stats'],
    queryFn: () => apiRequest<{ live: number; upcoming: number; finished: number; total: number }>('/matches/stats'),
    staleTime: 60_000,
  })

  const wantKalstrop = source === 'lolesports' || source === 'pandascore'
  // For pandascore, only fetch a sport if the game filter matches (or no filter set)
  const wantLol = wantKalstrop && (source === 'lolesports' || !game || game === 'lol')

  const { data: lolOddsLive = [] } = useQuery({
    queryKey: ['kalstrop-lol-live'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/live'),
    enabled: wantLol,
    staleTime: 300_000,
  })
  const { data: lolOddsUpcoming = [] } = useQuery({
    queryKey: ['kalstrop-lol-upcoming'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/upcoming'),
    enabled: wantLol,
    staleTime: 1_800_000,
  })
  const { data: lolOddsPopular = [] } = useQuery({
    queryKey: ['kalstrop-lol-popular'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/lol/popular'),
    enabled: wantLol,
    staleTime: 1_800_000,
  })

  // Competition list (cached 1h) — used to find competition slug for selected region
  type CompetitionMeta = { slug: string; name: string; fixturesCount: number; weight: number }
  const { data: lolCompetitions = [] } = useQuery({
    queryKey: ['kalstrop-lol-competitions'],
    queryFn: () => apiRequest<CompetitionMeta[]>('/kalstrop/lol/competitions'),
    enabled: wantLol && source === 'lolesports',
    staleTime: 3_600_000,
  })

  // Find competition slug matching selected region, then fetch its fixtures
  const matchedCompSlug = region
    ? lolCompetitions.find(c => c.slug.toLowerCase().includes(region.toLowerCase()))?.slug ?? ''
    : ''
  const { data: lolOddsComp = [] } = useQuery({
    queryKey: ['kalstrop-lol-comp-fixtures', matchedCompSlug],
    queryFn: () => apiRequest<KalstropFixture[]>(`/kalstrop/competition/${encodeURIComponent(matchedCompSlug)}/fixtures`),
    enabled: wantLol && source === 'lolesports' && !!matchedCompSlug,
    staleTime: 1_800_000,
  })

  // Deduplicate by id across live + upcoming + popular + competition-specific
  const lolOdds = Object.values(
    [...lolOddsLive, ...lolOddsUpcoming, ...lolOddsPopular, ...lolOddsComp].reduce<Record<string, KalstropFixture>>(
      (acc, f) => { acc[f.id] = f; return acc }, {}
    )
  )

  const [liveOddsMap, setLiveOddsMap] = useState<Map<string, LiveOddsEntry>>(new Map())
  const subscribedRef = useRef<Set<string>>(new Set())

  function subscribeMarkets(fixtures: KalstropFixture[]) {
    const newIds = fixtures.filter(f => f.defaultMarketId && !subscribedRef.current.has(f.defaultMarketId!)).map(f => f.defaultMarketId!)
    if (newIds.length === 0) return
    const socket = getKalstropSocket()
    newIds.forEach(id => subscribedRef.current.add(id))
    socket.emit('subscribe-odds', { marketIds: newIds })
  }

  useEffect(() => {
    if (!wantKalstrop) return
    subscribeMarkets(lolOdds)
  }, [lolOdds, wantKalstrop])

  useEffect(() => {
    if (!wantKalstrop) return
    const parseD = (n: string, d: string) => parseFloat(n) / parseFloat(d) + 1
    const socket = getKalstropSocket()
    const handler = (data: any) => {
      const market = data.markets?.[0]
      if (!market) return
      const sels = market.selections ?? []
      setLiveOddsMap(prev => {
        const next = new Map(prev)
        next.set(data.marketId, {
          homeDecimal: sels[0] ? parseD(sels[0].oddsNumerator, sels[0].oddsDenominator) : undefined,
          awayDecimal: sels[1] ? parseD(sels[1].oddsNumerator, sels[1].oddsDenominator) : undefined,
          homeProb: sels[0] ? parseFloat(sels[0].probability) : undefined,
          awayProb: sels[1] ? parseFloat(sels[1].probability) : undefined,
          suspended: market.status === 'SUSPENDED',
        })
        return next
      })
    }
    socket.on('odds-updated', handler)
    return () => { socket.off('odds-updated', handler) }
  }, [wantKalstrop])

  const wantCs2 = (source === 'grid' || source === 'pandascore') && (!game || game === 'csgo')
  const wantDota2 = (source === 'grid' || source === 'pandascore') && (!game || game === 'dota2')
  const wantR6 = source === 'pandascore' && (!game || game === 'r6')
  const wantKog = source === 'pandascore' && (!game || game === 'kog')
  const wantValorant = source === 'pandascore' && (!game || game === 'valorant')

  const { data: cs2OddsLive = [] } = useQuery({
    queryKey: ['kalstrop-cs2-live'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/cs2/live'),
    enabled: wantCs2,
    staleTime: 300_000,
  })
  const { data: cs2OddsUpcoming = [] } = useQuery({
    queryKey: ['kalstrop-cs2-upcoming'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/cs2/upcoming'),
    enabled: wantCs2 && source === 'pandascore',
    staleTime: 1_800_000,
  })
  const { data: dota2OddsLive = [] } = useQuery({
    queryKey: ['kalstrop-dota2-live'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/dota2/live'),
    enabled: wantDota2,
    staleTime: 300_000,
  })
  const { data: dota2OddsUpcoming = [] } = useQuery({
    queryKey: ['kalstrop-dota2-upcoming'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/dota2/upcoming'),
    enabled: wantDota2 && source === 'pandascore',
    staleTime: 1_800_000,
  })
  const { data: r6Odds = [] } = useQuery({
    queryKey: ['kalstrop-r6-live'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/r6/live'),
    enabled: wantR6,
    staleTime: 300_000,
  })
  const { data: kogOdds = [] } = useQuery({
    queryKey: ['kalstrop-kog-live'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/kog/live'),
    enabled: wantKog,
    staleTime: 300_000,
  })
  const { data: valorantOddsLive = [] } = useQuery({
    queryKey: ['kalstrop-valorant-live'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/valorant/live'),
    enabled: wantValorant,
    staleTime: 300_000,
  })
  const { data: valorantOddsUpcoming = [] } = useQuery({
    queryKey: ['kalstrop-valorant-upcoming'],
    queryFn: () => apiRequest<KalstropFixture[]>('/kalstrop/valorant/upcoming'),
    enabled: wantValorant,
    staleTime: 1_800_000,
  })
  const valorantOdds = [...valorantOddsLive, ...valorantOddsUpcoming]

  const cs2Odds = [...cs2OddsLive, ...cs2OddsUpcoming]
  const dota2Odds = [...dota2OddsLive, ...dota2OddsUpcoming]
  const gridOdds = [...cs2OddsLive, ...dota2OddsLive]

  const pandaOdds: KalstropFixture[] = [...lolOdds, ...cs2Odds, ...dota2Odds, ...r6Odds, ...kogOdds, ...valorantOdds]

  useEffect(() => {
    if (source !== 'pandascore') return
    subscribeMarkets(pandaOdds)
  }, [pandaOdds, source])

  const gridTitleIds = gridTab === 'cs2' ? '28' : gridTab === 'dota2' ? '2' : '28,2'
  const { data: gridSeries = [] } = useQuery({
    queryKey: ['grid-schedule', gridTitleIds],
    queryFn: () => apiRequest<GridSeries[]>(`/grid/schedule?titleIds=${gridTitleIds}&withScores=1`),
    enabled: source === 'grid',
    staleTime: 60_000,
  })

  const now = Date.now()
  const gridLive = gridSeries.filter(s => { const t = new Date(s.startTimeScheduled).getTime(); return t < now && t > now - 4 * 3600_000 })
  const gridUpcoming = gridSeries.filter(s => new Date(s.startTimeScheduled).getTime() > now)
  const gridPast = gridSeries.filter(s => new Date(s.startTimeScheduled).getTime() < now - 4 * 3600_000)

  const { data: lolesportsLive } = useQuery({
    queryKey: ['lol-esports-live'],
    queryFn: () => apiRequest<LoLEsportsEvent[]>('/lol-esports/live'),
    enabled: source === 'lolesports' && (tab === 'all' || tab === 'live'),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const { data: lolesportsSchedule } = useQuery({
    queryKey: ['lol-esports-schedule'],
    queryFn: () => apiRequest<{ events: LoLEsportsEvent[]; pages: object }>('/lol-esports/schedule'),
    enabled: source === 'lolesports' && (tab === 'all' || tab === 'upcoming' || tab === 'finished'),
    staleTime: 120_000,
  })

  const lolesportsEvents: LoLEsportsEvent[] = (() => {
    if (source !== 'lolesports') return []
    const live = lolesportsLive ?? []
    const sched = lolesportsSchedule?.events ?? []
    const filterRegion = (arr: LoLEsportsEvent[]) =>
      region ? arr.filter(e => e.league.slug === region) : arr
    if (tab === 'live') return filterRegion(live)
    if (tab === 'upcoming') return filterRegion(sched.filter(e => e.state === 'unstarted'))
    if (tab === 'finished') return filterRegion(sched.filter(e => e.state === 'completed'))
    return filterRegion([...live, ...sched.filter(e => !live.find(l => l.id === e.id))])
  })()

  const items = data?.items ?? []

  function handleTabChange(id: string) { setTab(id as Tab) }
  function handleGameChange(e: React.ChangeEvent<HTMLSelectElement>) { setGame(e.target.value) }
  function handleRegionChange(e: React.ChangeEvent<HTMLSelectElement>) { setRegion(e.target.value) }

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Lịch thi đấu</p>
        <h1>Trận đấu</h1>
        <p>Theo dõi các trận đang diễn ra, sắp tới và đã kết thúc.</p>
      </section>

      {/* Source toggle */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <button
          onClick={() => setSource('pandascore')}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--line)',
            background: source === 'pandascore' ? 'var(--accent)' : 'var(--surface-2)',
            color: source === 'pandascore' ? '#fff' : 'var(--muted)',
            fontWeight: source === 'pandascore' ? 700 : 400,
          }}
        >
          PandaScore
        </button>
        <button
          onClick={() => setSource('lolesports')}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--line)',
            background: source === 'lolesports' ? '#c89b3c' : 'var(--surface-2)',
            color: source === 'lolesports' ? '#fff' : 'var(--muted)',
            fontWeight: source === 'lolesports' ? 700 : 400,
          }}
        >
          LoL Esports
        </button>
        <button
          onClick={() => setSource('grid')}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--line)',
            background: source === 'grid' ? '#e8a10022' : 'var(--surface-2)',
            color: source === 'grid' ? '#e8a100' : 'var(--muted)',
            fontWeight: source === 'grid' ? 700 : 400,
            borderColor: source === 'grid' ? '#e8a10055' : undefined,
          }}
        >
          🎮 CS2 / Dota2
        </button>
      </div>

      {stats && source === 'pandascore' && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <span className="stat-pill" style={{ background: 'var(--live-soft, #ff3b3b22)', color: 'var(--live, #ff3b3b)', fontWeight: 700 }}>
            🔴 {stats.live} Live
          </span>
          <span className="stat-pill">⏳ {stats.upcoming} Sắp đấu</span>
          <span className="stat-pill">✅ {stats.finished} Kết thúc</span>
        </div>
      )}

      {/* GRID sub-tabs */}
      {source === 'grid' && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
          {(['all', 'cs2', 'dota2'] as const).map(t => (
            <button key={t} className="tab" onClick={() => setGridTab(t)}
              style={{ background: gridTab === t ? 'var(--accent)' : undefined, color: gridTab === t ? '#fff' : undefined, fontWeight: gridTab === t ? 700 : undefined }}>
              {t === 'all' ? 'Tất cả' : t === 'cs2' ? '🔫 CS2' : '🗡️ Dota2'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs
          tabs={[
            { id: 'all', label: 'Tất cả' },
            { id: 'live', label: '🔴 Trực tiếp' },
            { id: 'upcoming', label: 'Sắp đấu' },
            { id: 'finished', label: 'Đã kết thúc' },
          ]}
          active={tab}
          onChange={handleTabChange}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <select className="tab" value={game} onChange={handleGameChange}>
            {GAMES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          {(() => {
            const effectiveGame = source === 'lolesports' ? 'lol' : game
            const opts = REGIONS_BY_GAME[effectiveGame] ?? REGIONS_BY_GAME._default
            if (opts.length <= 1) return null
            return (
              <select className="tab" value={region} onChange={handleRegionChange}>
                {opts.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            )
          })()}
        </div>
      </div>

      <div className="section-stack">
        <SectionHeader
          title={source === 'lolesports' ? 'LoL Esports' : source === 'grid' ? '🎮 CS2 & Dota2' : 'Theo giải'}
          subtitle={
            source === 'lolesports'
              ? `${lolesportsEvents.length} trận`
              : source === 'grid'
                ? `${gridSeries.length} trận`
                : isLoading ? 'Đang tải...' : `${data?.total ?? 0} trận`
          }
        />

        {/* GRID CS2/Dota2 list */}
        {source === 'grid' && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {gridLive.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff3b3b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block' }} />
                  Đang diễn ra
                </div>
                {gridLive.map(s => <GridSeriesRow key={s.id} s={s} gridOdds={gridOdds} />)}
              </>
            )}
            {gridUpcoming.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginTop: gridLive.length ? '0.5rem' : 0 }}>⏰ Sắp diễn ra</div>
                {gridUpcoming.map(s => <GridSeriesRow key={s.id} s={s} gridOdds={gridOdds} />)}
              </>
            )}
            {gridPast.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginTop: '0.5rem' }}>✅ Đã kết thúc</div>
                {gridPast.slice(0, 20).map(s => <GridSeriesRow key={s.id} s={s} gridOdds={gridOdds} />)}
              </>
            )}
            {gridSeries.length === 0 && (
              <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Không có trận nào.</div>
            )}
          </div>
        )}

        {source === 'lolesports' && (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {lolesportsEvents.length === 0 ? (
              <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                {(tab === 'live' && !lolesportsLive) || (tab !== 'live' && !lolesportsSchedule)
                  ? 'Đang tải...'
                  : 'Không có trận nào.'}
              </div>
            ) : (
              (() => {
              const LOL_PAGE_SIZE = 20
              const totalPages = Math.ceil(lolesportsEvents.length / LOL_PAGE_SIZE)
              const paged = lolesportsEvents.slice((lolPage - 1) * LOL_PAGE_SIZE, lolPage * LOL_PAGE_SIZE)
              return (<>
                {paged.map(e => <LoLEsportsRow key={e.id} e={e} lolOdds={lolOdds} liveOddsMap={liveOddsMap} />)}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button className="tab" disabled={lolPage === 1} onClick={() => setLolPage(p => p - 1)}>← Trước</button>
                    <span style={{ alignSelf: 'center', fontSize: '0.84rem', color: 'var(--muted)' }}>Trang {lolPage} / {totalPages}</span>
                    <button className="tab" disabled={lolPage >= totalPages} onClick={() => setLolPage(p => p + 1)}>Tiếp →</button>
                  </div>
                )}
              </>)
            })()
            )}
          </div>
        )}

        {source === 'pandascore' && (<>

        {isLoading && (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="match-row" style={{ opacity: 0.35, pointerEvents: 'none', minHeight: 64 }} />
            ))}
          </div>
        )}

        {isError && (
          <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
            Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {items.map((m) => {
                const [teamA, teamB] = m.teams
                const pandaMatchedFixture = (m.status !== 'finished' && teamA && teamB)
                  ? pandaOdds.find(f => {
                      const na = normalizeName(teamA.name ?? teamA.acronym ?? ''), nb = normalizeName(teamB.name ?? teamB.acronym ?? '')
                      const k0 = normalizeName(f.teams[0].name), k1 = normalizeName(f.teams[1].name)
                      return (k0.includes(na)||na.includes(k0))&&(k1.includes(nb)||nb.includes(k1))
                        || (k0.includes(nb)||nb.includes(k0))&&(k1.includes(na)||na.includes(k1))
                    })
                  : undefined
                const pandaMatched = pandaMatchedFixture ? { oddsA: pandaMatchedFixture.teams[0], oddsB: pandaMatchedFixture.teams[1] } : undefined
                const pandaLive = pandaMatchedFixture?.defaultMarketId ? liveOddsMap.get(pandaMatchedFixture.defaultMarketId) : undefined
                return (
                  <Link key={m._id} to={`/matches/${m._id}`} className="match-row">
                    {teamA
                      ? <div className="match-team">
                          {teamA.imageUrl
                            ? <img src={teamA.imageUrl} alt={teamA.acronym ?? teamA.name} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'var(--surface-2)', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            : <span className="team-logo">{(teamA.acronym ?? teamA.name).slice(0, 2).toUpperCase()}</span>}
                          <span>{teamA.acronym ?? teamA.name}</span>
                        </div>
                      : <div className="match-team" style={{ color: 'var(--muted)' }}><span>TBD</span></div>}

                    <div className="match-mid">
                      {m.status === 'live' ? <Badge tone="live">LIVE</Badge>
                        : m.status === 'not_started' ? <Badge tone="warn">Sắp đấu</Badge>
                        : <Badge tone="default">Kết thúc</Badge>}
                      <div className="match-score">
                        {m.status === 'not_started' ? 'vs' : `${teamA?.score ?? '?'} : ${teamB?.score ?? '?'}`}
                      </div>
                      {m.numberOfGames && <div>BO{m.numberOfGames}{m.game ? ` · ${GAME_LABELS[m.game] ?? m.game.toUpperCase()}` : ''}</div>}
                      <div>{m.leagueName ?? m.tournamentName ?? ''}</div>
                      <div style={{ color: 'var(--muted-2)' }}>
                        {m.status === 'finished' && m.endedAt ? `Kết thúc ${formatTime(m.endedAt)}` : formatTime(m.startsAt)}
                      </div>
                      {pandaMatched ? <OddsPanel oddsA={pandaMatched.oddsA} oddsB={pandaMatched.oddsB} live={pandaLive} /> : m.status !== 'finished' ? <OddsPlaceholder /> : null}
                    </div>

                    {teamB
                      ? <div className="match-team">
                          {teamB.imageUrl
                            ? <img src={teamB.imageUrl} alt={teamB.acronym ?? teamB.name} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'var(--surface-2)', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            : <span className="team-logo">{(teamB.acronym ?? teamB.name).slice(0, 2).toUpperCase()}</span>}
                          <span>{teamB.acronym ?? teamB.name}</span>
                        </div>
                      : <div className="match-team"><span style={{ color: 'var(--muted)' }}>TBD</span></div>}
                  </Link>
                )
              })}

              {items.length === 0 && (
                <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                  Chưa có trận nào trong nhóm này.
                </div>
              )}
            </div>

            {data && data.total > data.limit && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button className="tab" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  ← Trước
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.84rem', color: 'var(--muted)' }}>
                  Trang {page} / {Math.ceil(data.total / data.limit)}
                </span>
                <button className="tab" disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>
                  Tiếp →
                </button>
              </div>
            )}
          </>
        )}
        </>)}
      </div>
    </div>
  )
}
