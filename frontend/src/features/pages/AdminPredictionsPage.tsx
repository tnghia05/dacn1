import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiRequest, ApiError } from '../../shared/api/client'
import { SectionHeader } from '../../shared/components/Ui'

type PendingSummaryItem = {
  matchId: string
  matchName: string
  teams: Array<{ name?: string; score?: number }>
  matchStatus: string
  count: number
  totalPoints: number
}

type PredictionTicket = {
  _id: string
  userId: string
  displayName: string
  teamName: string
  teamIndex: number
  pointsBet: number
  oddsAtBet: number
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  createdAt: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  live:        { label: '🔴 Đang live', color: '#f87171' },
  finished:    { label: '🏁 Kết thúc',  color: 'var(--muted)' },
  not_started: { label: '⏳ Chưa bắt đầu', color: '#fbbf24' },
}

const TICKET_STATUS_COLOR: Record<string, string> = {
  pending: '#fbbf24', won: '#4ade80', lost: '#f87171', cancelled: 'var(--muted)',
}

function TicketList({ matchId }: { matchId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tickets', matchId],
    queryFn: () => apiRequest<PredictionTicket[]>(`/points/predictions/admin/match/${matchId}`),
    staleTime: 30_000,
  })

  if (isLoading) return <p style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '0.5rem 0' }}>Đang tải…</p>
  if (!data?.length) return <p style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '0.5rem 0' }}>Không có phiếu cược.</p>

  return (
    <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 70px 90px 70px', gap: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>
        <span>Người dùng</span><span>Đội chọn</span><span style={{ textAlign: 'right' }}>Điểm cược</span><span style={{ textAlign: 'right' }}>Odds</span><span style={{ textAlign: 'right' }}>Tiềm năng</span><span style={{ textAlign: 'center' }}>TT</span>
      </div>
      {data.map(t => (
        <div key={String(t._id)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 70px 90px 70px', gap: '0.5rem', padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.displayName}</span>
          <span style={{ color: 'var(--muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.teamName}</span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.pointsBet.toLocaleString('vi-VN')}</span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#e4b84d' }}>{t.oddsAtBet.toFixed(2)}×</span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>{Math.floor(t.pointsBet * t.oddsAtBet).toLocaleString('vi-VN')}</span>
          <span style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: TICKET_STATUS_COLOR[t.status] ?? 'var(--muted)' }}>{t.status}</span>
        </div>
      ))}
    </div>
  )
}

function MatchPredictionRow({ item, onDone }: { item: PendingSummaryItem; onDone: () => void }) {
  const [msg, setMsg] = useState('')
  const [expanded, setExpanded] = useState(false)

  const settleMut = useMutation({
    mutationFn: (winnerTeamIndex: number) =>
      apiRequest<{ settled: number }>(`/points/predictions/settle/${item.matchId}`, {
        method: 'POST', body: { winnerTeamIndex },
      }),
    onSuccess: (r) => { setMsg(`✅ Settle ${r.settled} dự đoán`); onDone() },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : 'Lỗi settle'),
  })

  const cancelMut = useMutation({
    mutationFn: () =>
      apiRequest<{ cancelled: number }>(`/points/predictions/cancel/${item.matchId}`, { method: 'POST' }),
    onSuccess: (r) => { setMsg(`✅ Huỷ & hoàn điểm ${r.cancelled} dự đoán`); onDone() },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : 'Lỗi cancel'),
  })

  const busy = settleMut.isPending || cancelMut.isPending
  const st = STATUS_LABEL[item.matchStatus] ?? { label: item.matchStatus, color: 'var(--muted)' }

  return (
    <div className="surface-card" style={{ display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <Link to={`/matches/${item.matchId}`} style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', textDecoration: 'none' }}>
            {item.matchName || `${item.teams[0]?.name ?? '?'} vs ${item.teams[1]?.name ?? '?'}`}
          </Link>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: st.color }}>{st.label}</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Dự đoán chờ</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>{item.count}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Điểm đặt cược</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
              {item.totalPoints.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          disabled={busy}
          onClick={() => { if (confirm(`Xác nhận ${item.teams[0]?.name ?? 'Đội A'} thắng?`)) settleMut.mutate(0) }}
          style={{ padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: '#15803d', color: '#fff', opacity: busy ? 0.6 : 1 }}
        >
          🏆 {item.teams[0]?.name ?? 'Đội A'} thắng
        </button>
        <button
          disabled={busy}
          onClick={() => { if (confirm(`Xác nhận ${item.teams[1]?.name ?? 'Đội B'} thắng?`)) settleMut.mutate(1) }}
          style={{ padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: '#1d4ed8', color: '#fff', opacity: busy ? 0.6 : 1 }}
        >
          🏆 {item.teams[1]?.name ?? 'Đội B'} thắng
        </button>
        <button
          disabled={busy}
          onClick={() => { if (confirm('Huỷ tất cả và hoàn điểm?')) cancelMut.mutate() }}
          style={{ padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: 'rgba(127,29,29,0.8)', color: '#fff', opacity: busy ? 0.6 : 1 }}
        >
          🚫 Huỷ & hoàn điểm
        </button>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ marginLeft: 'auto', padding: '0.4rem 0.75rem', borderRadius: '7px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          {expanded ? '▲ Ẩn phiếu' : `▼ Xem ${item.count} phiếu`}
        </button>
        {msg && <span style={{ fontSize: '0.78rem', color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</span>}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.5rem' }}>
          <TicketList matchId={item.matchId} />
        </div>
      )}
    </div>
  )
}

export function AdminPredictionsPage() {
  const qc = useQueryClient()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-predictions-pending'],
    queryFn: () => apiRequest<PendingSummaryItem[]>('/points/predictions/admin/pending'),
    staleTime: 30_000,
  })

  const totalPending = data?.reduce((s, r) => s + r.count, 0) ?? 0
  const totalPoints  = data?.reduce((s, r) => s + r.totalPoints, 0) ?? 0

  function handleDone() {
    qc.invalidateQueries({ queryKey: ['admin-predictions-pending'] })
  }

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin</p>
        <h1>Quản lý dự đoán</h1>
        <p>Settle kết quả và hoàn điểm cho các dự đoán đang chờ xử lý.</p>
      </section>

      {/* KPIs */}
      <div className="quick-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi">
          <p className="kpi-label">Trận có dự đoán chờ</p>
          <p className="kpi-value">{isLoading ? '—' : data?.length ?? 0}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Tổng dự đoán chờ</p>
          <p className="kpi-value" style={{ color: totalPending > 0 ? '#fbbf24' : 'inherit' }}>{isLoading ? '—' : totalPending}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Tổng điểm đang đặt</p>
          <p className="kpi-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {isLoading ? '—' : totalPoints.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <SectionHeader title="Dự đoán đang chờ settle" />
          <button
            onClick={() => refetch()}
            style={{ padding: '0.35rem 0.85rem', borderRadius: '7px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.78rem' }}
          >
            ↻ Làm mới
          </button>
        </div>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
          Hệ thống tự động settle khi trận kết thúc. Dùng trang này để xử lý thủ công hoặc override.
        </p>
      </div>

      {isLoading && (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Đang tải…</p>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</p>
          <p>Không có dự đoán nào đang chờ xử lý.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {data?.map(item => (
          <MatchPredictionRow key={item.matchId} item={item} onDone={handleDone} />
        ))}
      </div>
    </div>
  )
}
