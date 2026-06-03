import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type {
  PandaScoreSerie,
  PandaScoreStanding,
  PandaScoreTeamRef,
  PandaScoreSerieMatch,
  PandaScorePlayer,
} from '../../shared/api/types'
import { Badge, Tabs } from '../../shared/components/Ui'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(d?: string | null) {
  if (!d) return '?'
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function fmtDay(d?: string | null) {
  if (!d) return '?'
  const dt = new Date(d)
  return dt.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function fmtTime(d?: string | null) {
  if (!d) return '--:--'
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function matchStatusLabel(status: PandaScoreSerieMatch['status']) {
  const map = { running: 'Live', not_started: 'Sắp diễn ra', finished: 'Kết thúc', canceled: 'Huỷ', postponed: 'Hoãn' }
  return map[status] ?? status
}

function matchStatusTone(status: PandaScoreSerieMatch['status']): 'live' | 'warn' | 'default' {
  if (status === 'running') return 'live'
  if (status === 'finished') return 'default'
  return 'warn'
}

// ── Team avatar ──────────────────────────────────────────────────────────────

function TeamLogo({ team, size = 28 }: { team?: PandaScoreTeamRef; size?: number }) {
  if (!team) return <span style={{ width: size, height: size, borderRadius: 4, background: 'var(--surface-2)', display: 'inline-block' }} />
  if (team.image_url) {
    return (
      <img
        src={team.image_url}
        alt={team.acronym ?? team.name}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, background: 'var(--surface-2)' }}
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
      {(team.acronym ?? team.name).slice(0, 2).toUpperCase()}
    </span>
  )
}

// ── Tab: Lịch trình ──────────────────────────────────────────────────────────

function ScheduleTab({ slug }: { slug: string }) {
  const { data: matches = [], isLoading } = useQuery<PandaScoreSerieMatch[]>({
    queryKey: ['serie-matches', slug],
    queryFn: () => apiRequest(`/pandascore/series/${slug}/matches`, { noAuth: true }),
    staleTime: 1000 * 60 * 2,
  })

  // State lưu tuần đang chọn. Mặc định là null (Tất cả) hoặc tự động chọn tuần hiện tại
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all')

  if (isLoading) return <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Đang tải lịch trình…</p>
  if (!matches.length) return <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Không có trận nào.</p>

  // Sắp xếp trận đấu theo thời gian tăng dần (chronological)
  const sortedMatches = [...matches].sort((a, b) => {
    const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0
    const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0
    return da - db
  })

  // Tìm ngày bắt đầu của trận đấu đầu tiên để làm mốc tính Tuần
  const firstMatchWithDate = sortedMatches.find(m => m.scheduled_at)
  const tournamentStartDate = firstMatchWithDate?.scheduled_at 
    ? new Date(new Date(firstMatchWithDate.scheduled_at).toISOString().slice(0, 10) + 'T00:00:00')
    : new Date()

  // Gán thông tin Tuần (Week Number) cho từng trận đấu
  const matchesWithWeeks = sortedMatches.map(m => {
    if (!m.scheduled_at) return { ...m, week: 1 }
    const matchDate = new Date(new Date(m.scheduled_at).toISOString().slice(0, 10) + 'T00:00:00')
    
    // Tính khoảng cách ngày
    const diffMs = matchDate.getTime() - tournamentStartDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // Cứ 7 ngày tính là 1 tuần (Tuần 1 bắt đầu từ ngày 0-6, Tuần 2 từ ngày 7-13...)
    const weekNum = Math.max(1, Math.floor(diffDays / 7) + 1)
    return { ...m, week: weekNum }
  })

  // Lấy danh sách các tuần duy nhất có trong giải đấu
  const weeksList = Array.from(new Set(matchesWithWeeks.map(m => m.week))).sort((a, b) => a - b)

  // Lọc các trận đấu thuộc tuần đang được chọn
  const filteredMatches = selectedWeek === 'all' 
    ? matchesWithWeeks 
    : matchesWithWeeks.filter(m => m.week === selectedWeek)

  // Nhóm các trận đấu đã lọc theo Ngày
  const groups: Record<string, typeof matchesWithWeeks> = {}
  for (const m of filteredMatches) {
    const key = m.scheduled_at
      ? new Date(m.scheduled_at).toISOString().slice(0, 10)
      : 'TBD'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }

  // Tự động set tuần đầu tiên khi danh sách tải xong (nếu đang ở trạng thái 'all' ban đầu)
  // Bạn có thể giữ 'all' để xem tất cả hoặc set mặc định là tuần đầu tiên để gọn màn hình.
  // Ở đây, chọn mặc định 'all' để người dùng có cái nhìn tổng quan trước, hoặc đổi sang Tuần 1 tuỳ thích.

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Thanh chọn Tuần (Week Selector Pills Bar) */}
      {weeksList.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.4rem',
          borderBottom: '1px solid var(--line)',
          scrollbarWidth: 'none', // Ẩn scrollbar Firefox
          msOverflowStyle: 'none' // Ẩn scrollbar IE
        }} className="week-selector-bar">
          <button
            onClick={() => setSelectedWeek('all')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: selectedWeek === 'all' ? 'var(--primary)' : 'var(--surface-2)',
              color: selectedWeek === 'all' ? '#fff' : 'var(--muted)',
              border: `1px solid ${selectedWeek === 'all' ? 'var(--primary)' : 'var(--line)'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Tất cả trận
          </button>
          
          {weeksList.map((wk) => {
            const isSelected = selectedWeek === wk
            return (
              <button
                key={wk}
                onClick={() => setSelectedWeek(wk)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: isSelected ? 'var(--primary)' : 'var(--surface-2)',
                  color: isSelected ? '#fff' : 'var(--muted)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--line)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                Tuần {wk}
              </button>
            )
          })}
        </div>
      )}

      {/* Danh sách các trận đấu đã gom nhóm */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {Object.entries(groups).map(([day, dayMatches]) => (
          <div key={day}>
            <p
              style={{
                margin: '0 0 0.6rem',
                fontSize: '0.78rem',
                color: 'var(--muted-2)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}
            >
              <span>{day === 'TBD' ? 'TBD' : fmtDay(day + 'T00:00:00')}</span>
              {selectedWeek === 'all' && dayMatches[0] && (
                <span style={{ fontSize: '0.67rem', color: 'var(--primary)', opacity: 0.8 }}>
                  Tuần {dayMatches[0].week}
                </span>
              )}
            </p>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {dayMatches.map((m) => {
                const [t1, t2] = m.opponents ?? []
                const r1 = m.results?.find((r) => r.team_id === t1?.opponent?.id)
                const r2 = m.results?.find((r) => r.team_id === t2?.opponent?.id)

                return (
                  <div
                    key={m.id}
                    className="surface-card"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    {/* Team 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TeamLogo team={t1?.opponent} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t1?.opponent?.acronym ?? t1?.opponent?.name ?? 'TBD'}
                      </span>
                    </div>

                    {/* Score / time */}
                    <div style={{ textAlign: 'center', minWidth: 90 }}>
                      {m.status === 'finished' ? (
                        <span style={{ fontSize: '1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {r1?.score ?? 0} — {r2?.score ?? 0}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Badge tone={matchStatusTone(m.status)}>{matchStatusLabel(m.status)}</Badge>
                          <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>
                            {fmtTime(m.scheduled_at)}
                            {m.number_of_games ? ` · BO${m.number_of_games}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {t2?.opponent?.acronym ?? t2?.opponent?.name ?? 'TBD'}
                      </span>
                      <TeamLogo team={t2?.opponent} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Bảng xếp hạng ───────────────────────────────────────────────────────

const MEDALS: Record<number, { icon: string; glow: string; border: string }> = {
  1: { icon: '🥇', glow: 'rgba(255,215,0,0.06)', border: 'rgba(255,215,0,0.25)' },
  2: { icon: '🥈', glow: 'rgba(192,192,192,0.05)', border: 'rgba(192,192,192,0.2)' },
  3: { icon: '🥉', glow: 'rgba(205,127,50,0.06)', border: 'rgba(205,127,50,0.22)' },
}

function StandingsTab({ tournamentId }: { tournamentId: number | undefined }) {
  const { data: standings = [], isLoading } = useQuery<PandaScoreStanding[]>({
    queryKey: ['tournament-standings', tournamentId],
    queryFn: () => apiRequest(`/pandascore/tournaments/${tournamentId}/standings`, { noAuth: true }),
    enabled: Boolean(tournamentId),
    staleTime: 1000 * 60 * 5,
  })

  if (!tournamentId) return <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Giải này chưa có tournament cụ thể.</p>
  if (isLoading) return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--surface-2)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
  if (!standings.length) return <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Chưa có bảng xếp hạng.</p>

  const qualifyLine = Math.floor(standings.length / 2)

  return (
    <div style={{ display: 'grid', gap: '0.3rem' }}>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 56px 120px 48px 48px 48px',
        padding: '0 1rem 0.5rem',
        fontSize: '0.67rem', fontWeight: 700,
        color: 'var(--muted-2)', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span>#</span>
        <span>Đội</span>
        <span style={{ textAlign: 'center' }}>Tổng</span>
        <span style={{ textAlign: 'center' }}>Tỉ lệ thắng</span>
        <span style={{ textAlign: 'center', color: '#4ade80' }}>T</span>
        <span style={{ textAlign: 'center', color: 'var(--muted)' }}>H</span>
        <span style={{ textAlign: 'center', color: '#f87171' }}>B</span>
      </div>

      {standings.map((s, i) => {
        const medal = MEDALS[s.rank]
        const winRate = s.total > 0 ? s.wins / s.total : 0
        const showPlayoffDivider = standings.length >= 4 && i === qualifyLine
        const showRelegDivider = standings.length >= 4 && i === standings.length - 2

        return (
          <div key={s.team.id}>
            {/* Playoffs separator */}
            {showPlayoffDivider && (
              <div style={{ position: 'relative', margin: '0.5rem 0 0.3rem' }}>
                <div style={{ borderTop: '1px dashed rgba(74,222,128,0.4)' }} />
                <span style={{
                  position: 'absolute', right: '1rem', top: -9,
                  fontSize: '0.6rem', color: '#4ade80',
                  background: 'var(--bg)', padding: '0 0.45rem',
                  fontWeight: 700, letterSpacing: '0.07em',
                }}>PLAYOFFS ↑</span>
              </div>
            )}

            {/* Relegation separator */}
            {showRelegDivider && (
              <div style={{ position: 'relative', margin: '0.5rem 0 0.3rem' }}>
                <div style={{ borderTop: '1px dashed rgba(248,113,113,0.4)' }} />
                <span style={{
                  position: 'absolute', right: '1rem', top: -9,
                  fontSize: '0.6rem', color: '#f87171',
                  background: 'var(--bg)', padding: '0 0.45rem',
                  fontWeight: 700, letterSpacing: '0.07em',
                }}>RELEGATION ↓</span>
              </div>
            )}

            {/* Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 56px 120px 48px 48px 48px',
                alignItems: 'center',
                padding: '0.62rem 1rem',
                borderRadius: 10,
                background: medal ? medal.glow : 'transparent',
                border: `1px solid ${medal ? medal.border : 'transparent'}`,
                transition: 'background 0.14s',
              }}
              onMouseEnter={e => { if (!medal) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!medal) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Rank / medal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {medal
                  ? <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{medal.icon}</span>
                  : <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', display: 'block', textAlign: 'center' }}>{s.rank}</span>
                }
              </div>

              {/* Team */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <TeamLogo team={s.team} size={28} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.91rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.team.name}
                  </p>
                  {s.team.acronym && s.team.acronym !== s.team.name && (
                    <p style={{ margin: 0, fontSize: '0.67rem', color: 'var(--muted-2)', lineHeight: 1.1 }}>{s.team.acronym}</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.91rem', fontVariantNumeric: 'tabular-nums' }}>
                {s.total}
              </div>

              {/* Win-rate bar */}
              <div style={{ padding: '0 0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${winRate * 100}%`,
                      borderRadius: 999,
                      background: winRate >= 0.65
                        ? 'linear-gradient(90deg,#16a34a,#4ade80)'
                        : winRate >= 0.4
                        ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                        : 'linear-gradient(90deg,#dc2626,#f87171)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.67rem', color: 'var(--muted-2)', fontVariantNumeric: 'tabular-nums', minWidth: 26, textAlign: 'right' }}>
                    {Math.round(winRate * 100)}%
                  </span>
                </div>
              </div>

              {/* W */}
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.91rem', color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{s.wins}</div>
              {/* D */}
              <div style={{ textAlign: 'center', fontWeight: 500, fontSize: '0.91rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{s.draws}</div>
              {/* L */}
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.91rem', color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>{s.losses}</div>
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.2rem', padding: '0.75rem 1rem 0', flexWrap: 'wrap', alignItems: 'center' }}>
        {standings.length >= 4 && <>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.69rem', color: '#4ade80' }}>
            <span style={{ width: 10, height: 2, borderRadius: 1, background: '#4ade80', display: 'inline-block' }} />
            Vào playoffs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.69rem', color: '#f87171' }}>
            <span style={{ width: 10, height: 2, borderRadius: 1, background: '#f87171', display: 'inline-block' }} />
            Xuống hạng
          </span>
        </>}
        <span style={{ marginLeft: 'auto', fontSize: '0.69rem', color: 'var(--muted-2)' }}>
          T = Thắng · H = Hoà · B = Thua
        </span>
      </div>
    </div>
  )
}


// ── Tab: Đội tham gia ─────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  top:     { label: 'TOP',  color: '#f59e0b' },
  jun:     { label: 'JGL',  color: '#10b981' },
  jungle:  { label: 'JGL',  color: '#10b981' },
  mid:     { label: 'MID',  color: '#6366f1' },
  bot:     { label: 'BOT',  color: '#ef4444' },
  adc:     { label: 'BOT',  color: '#ef4444' },
  sup:     { label: 'SUP',  color: '#06b6d4' },
  support: { label: 'SUP',  color: '#06b6d4' },
  carry:   { label: 'CRY',  color: '#8b5cf6' },
  offlane: { label: 'OFF',  color: '#f97316' },
  entry:   { label: 'ENT',  color: '#ec4899' },
  igl:     { label: 'IGL',  color: '#eab308' },
  awper:   { label: 'AWP',  color: '#14b8a6' },
}

function roleMeta(role?: string) {
  if (!role) return null
  return ROLE_LABELS[role.toLowerCase()] ?? { label: role.toUpperCase().slice(0, 3), color: 'var(--muted)' }
}

function PlayerAvatar({ player, size = 36 }: { player: PandaScorePlayer; size?: number }) {
  if (player.image_url) {
    return (
      <img
        src={player.image_url}
        alt={player.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface-3)', flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--surface-3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'var(--muted)',
      flexShrink: 0,
    }}>
      {player.name[0]?.toUpperCase()}
    </div>
  )
}



function TeamsTab({ tournamentId }: { tournamentId: number | undefined }) {
  const { data: teams = [], isLoading } = useQuery<PandaScoreTeamRef[]>({
    queryKey: ['tournament-teams', tournamentId],
    queryFn: () => apiRequest(`/pandascore/tournaments/${tournamentId}/teams`, { noAuth: true }),
    enabled: Boolean(tournamentId),
    staleTime: 1000 * 60 * 10,
  })

  if (!tournamentId) return <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Giải này chưa có tournament cụ thể.</p>
  if (isLoading) return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--surface-2)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
  if (!teams.length) return <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Chưa có đội nào.</p>

  return <SplitShowcaseView teams={teams} />
}

// ── SplitShowcaseView (Giao diện 2 cột chuẩn Esports) ──────────────────────────

function SplitShowcaseView({ teams }: { teams: PandaScoreTeamRef[] }) {
  const [selectedId, setSelectedId] = useState<number>(teams[0]?.id || 0)
  const selectedTeam = teams.find(t => t.id === selectedId) || teams[0]
  const players = selectedTeam?.players ?? []

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '1.5rem',
      alignItems: 'flex-start',
      minHeight: '520px',
      position: 'relative',
    }} className="split-roster-layout">
      {/* Cột trái: Danh sách các đội bóng/gaming */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <p style={{
          fontSize: '0.67rem',
          fontWeight: 800,
          color: 'var(--muted-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 0.5rem 0.25rem'
        }}>
          Danh sách đội ({teams.length})
        </p>
        
        {teams.map((t) => {
          const isSelected = t.id === selectedId
          return (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              style={{
                width: '100%',
                background: isSelected ? 'var(--surface-2)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--line)'}`,
                boxShadow: isSelected ? '0 0 12px rgba(99,102,241,0.15)' : 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--line)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.01)'
                }
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: '4px',
                  background: 'var(--primary)'
                }} />
              )}
              
              <TeamLogo team={t} size={36} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: isSelected ? '#fff' : 'var(--muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {t.name}
                </p>
                {t.acronym && t.acronym !== t.name && (
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-2)', lineHeight: 1.2 }}>
                    {t.acronym} {t.location ? `· ${t.location}` : ''}
                  </p>
                )}
              </div>

              <span style={{
                fontSize: '0.67rem',
                fontWeight: 600,
                color: isSelected ? 'var(--primary)' : 'var(--muted-2)',
                background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--surface-3)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                {(t.players ?? []).length} P
              </span>
            </button>
          )
        })}
      </div>

      {/* Cột phải: Chi tiết đội tuyển & Thẻ Roster của từng Player */}
      <div style={{
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '1.25rem',
        alignSelf: 'stretch',
        position: 'sticky',
        top: '20px'
      }}>
        {/* Banner Đội tuyển */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--line)',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            background: 'var(--surface-3)',
            borderRadius: '12px',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <TeamLogo team={selectedTeam} size={48} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              {selectedTeam?.name}
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--muted-2)', display: 'flex', gap: '0.5rem' }}>
              {selectedTeam?.acronym && <span>Ký hiệu: <strong>{selectedTeam.acronym}</strong></span>}
              {selectedTeam?.location && <span>· Quốc gia: <strong>{selectedTeam.location}</strong></span>}
            </p>
          </div>
        </div>

        {/* Danh sách Player dạng Grid Cards */}
        {players.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '1rem'
          }}>
            {players.map((p) => {
              const role = roleMeta(p.role)
              const roleColor = role?.color || 'var(--muted)'
              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--surface-2)',
                    border: `1px solid var(--line)`,
                    borderRadius: '14px',
                    padding: '1rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                  className="player-card"
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = roleColor + '60'
                    e.currentTarget.style.boxShadow = `0 6px 16px ${roleColor}12`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Neon Glow Circle ở background phía sau avatar */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: roleColor,
                    opacity: 0.05,
                    filter: 'blur(12px)',
                    zIndex: 0
                  }} />

                  {/* Player Avatar */}
                  <div style={{ position: 'relative', zIndex: 1, marginBottom: '0.75rem' }}>
                    <PlayerAvatar player={p} size={54} />
                    
                    {/* Role badge tròn gắn góc dưới avatar */}
                    {role && (
                      <span style={{
                        position: 'absolute',
                        bottom: -2, right: -2,
                        width: '18px', height: '18px',
                        borderRadius: '50%',
                        background: roleColor,
                        color: '#fff',
                        fontSize: '0.52rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--surface-2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }} title={role.label}>
                        {role.label[0]}
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                    <p style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: '#fff',
                      lineHeight: 1.2
                    }}>
                      {p.name}
                    </p>
                    <p style={{
                      margin: '0.15rem 0 0.4rem',
                      fontSize: '0.7rem',
                      color: 'var(--muted-2)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {[p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      fontSize: '0.67rem',
                      color: 'var(--muted-2)',
                      background: 'var(--surface-3)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '8px',
                      width: 'fit-content',
                      margin: '0 auto'
                    }}>
                      {p.nationality && <span>🌐 {p.nationality}</span>}
                      {p.age && (
                        <>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span>{p.age}t</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            color: 'var(--muted-2)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</span>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Đội tuyển này chưa có danh sách tuyển thủ chính thức.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

type DetailTab = 'schedule' | 'standings' | 'teams'

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'schedule', label: 'Lịch trình' },
  { id: 'standings', label: 'Bảng xếp hạng' },
  { id: 'teams', label: 'Đội tham gia' },
]

export function TournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [tab, setTab] = useState<DetailTab>('schedule')

  const { data: serie, isLoading } = useQuery<PandaScoreSerie>({
    queryKey: ['serie-detail', slug],
    queryFn: () => apiRequest(`/pandascore/series/${slug}`, { noAuth: true }),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 10,
  })

  // pick first tournament id for standings / teams
  const firstTournamentId = serie?.tournaments?.[0]?.id

  const leagueImg = serie?.league?.image_url
  const gameSlug = serie?.videogame?.slug

  return (
    <div className="page-padding content-shell">
      {/* ← back */}
      <Link to="/tournaments" className="link-inline" style={{ fontSize: '0.84rem' }}>
        ← Thư viện giải
      </Link>

      {/* ── Hero header ── */}
      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'linear-gradient(135deg, #0c1521 0%, #162232 60%, #0c1521 100%)',
          minHeight: 200,
        }}
      >
        {/* glow */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)',
          }}
        />

        {/* league logo watermark */}
        {leagueImg && (
          <div
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.12,
              pointerEvents: 'none',
            }}
          >
            <img src={leagueImg} alt="" style={{ width: 160, height: 160, objectFit: 'contain' }} />
          </div>
        )}

        <div
          style={{
            position: 'relative',
            padding: '1.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          {isLoading ? (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ height: 16, width: 80, borderRadius: 4, background: 'var(--surface-3)' }} />
              <div style={{ height: 28, width: 280, borderRadius: 4, background: 'var(--surface-3)' }} />
              <div style={{ height: 14, width: 200, borderRadius: 4, background: 'var(--surface-3)' }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge tone="live">Đang diễn ra</Badge>
                {gameSlug && <Badge tone="warn">{gameSlug.toUpperCase()}</Badge>}
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                }}
              >
                {serie?.full_name ?? slug}
              </h1>

              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {serie?.league?.name && <span>{serie.league.name}</span>}
                {(serie?.begin_at || serie?.end_at) && (
                  <span>
                    · {fmt(serie.begin_at)} – {fmt(serie.end_at)}
                  </span>
                )}
                {firstTournamentId && (
                  <span>· {serie.tournaments?.length} phase</span>
                )}
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Tabs ── */}
      <Tabs
        tabs={DETAIL_TABS}
        active={tab}
        onChange={(id) => setTab(id as DetailTab)}
      />

      {/* ── Tab content ── */}
      {tab === 'schedule' && slug && <ScheduleTab slug={slug} />}
      {tab === 'standings' && <StandingsTab tournamentId={firstTournamentId} />}
      {tab === 'teams' && <TeamsTab tournamentId={firstTournamentId} />}
    </div>
  )
}
