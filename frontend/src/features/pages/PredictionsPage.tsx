import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { Prediction } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, Tabs } from '../../shared/components/Ui'
import { useState } from 'react'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

const STATUS_LABEL: Record<Prediction['status'], { label: string; color: string }> = {
  pending: { label: '⏳ Đang chờ', color: '#fb923c' },
  won: { label: '🏆 Thắng', color: '#4ade80' },
  lost: { label: '❌ Thua', color: '#f87171' },
  cancelled: { label: '🚫 Huỷ', color: 'var(--muted)' },
}

type ListResp = { items: Prediction[]; total: number }

export function PredictionsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'all' | 'pending' | 'won' | 'lost'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['my-predictions'],
    queryFn: () => apiRequest<ListResp>('/points/predictions?limit=50'),
    enabled: !!user,
  })

  if (!user) {
    return (
      <div className="page-padding content-shell">
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>Bạn chưa đăng nhập.</p>
          <Link to="/auth/login"><Btn>Đăng nhập</Btn></Link>
        </div>
      </div>
    )
  }

  const all: Prediction[] = data?.items ?? []
  const filtered = tab === 'all' ? all : all.filter(p => p.status === tab)

  const totalBet = all.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.pointsBet, 0)
  const totalWon = all.filter(p => p.status === 'won').reduce((s, p) => s + (p.pointsWon ?? 0), 0)
  const pending = all.filter(p => p.status === 'pending').length
  const winRate = all.filter(p => p.status === 'won' || p.status === 'lost').length > 0
    ? Math.round(all.filter(p => p.status === 'won').length / all.filter(p => p.status === 'won' || p.status === 'lost').length * 100)
    : null

  return (
    <div className="page-padding content-shell">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <Link to="/points" style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>← Điểm tích lũy</Link>
      </div>

      <section className="hero-panel compact">
        <p className="eyebrow">Dự đoán trận đấu</p>
        <h1>Lịch sử dự đoán</h1>
        <p>Đặt cược bằng điểm, thắng theo odds Kalstrop thực tế.</p>
      </section>

      {/* Stats */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Tổng cược</p>
          <p className="kpi-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{totalBet.toLocaleString('vi-VN')}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Tổng thắng</p>
          <p className="kpi-value" style={{ color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums' }}>{totalWon.toLocaleString('vi-VN')}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Đang chờ</p>
          <p className="kpi-value" style={{ color: '#fb923c' }}>{pending}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Tỉ lệ thắng</p>
          <p className="kpi-value" style={{ color: '#4ade80' }}>{winRate !== null ? `${winRate}%` : '—'}</p>
        </div>
      </div>

      <div>
        <Tabs
          tabs={[
            { id: 'all', label: `Tất cả (${all.length})` },
            { id: 'pending', label: `⏳ Chờ (${all.filter(p => p.status === 'pending').length})` },
            { id: 'won', label: `🏆 Thắng (${all.filter(p => p.status === 'won').length})` },
            { id: 'lost', label: `❌ Thua (${all.filter(p => p.status === 'lost').length})` },
          ]}
          active={tab}
          onChange={v => setTab(v as typeof tab)}
        />

        {isLoading && (
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="surface-card" style={{ height: '80px', opacity: 0.3 }} />)}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
            {tab === 'all' ? (
              <>
                <p style={{ marginBottom: '1rem' }}>Bạn chưa có dự đoán nào.</p>
                <Link to="/matches"><Btn>Xem trận đấu</Btn></Link>
              </>
            ) : `Không có dự đoán nào trong mục này.`}
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.75rem' }}>
          {filtered.map(pred => {
            const st = STATUS_LABEL[pred.status]
            const pnl = pred.status === 'won' ? (pred.pointsWon ?? 0) - pred.pointsBet : pred.status === 'lost' ? -pred.pointsBet : null
            return (
              <div key={pred._id} className="surface-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                <div style={{ flex: '1 1 180px', display: 'grid', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>🏳 {pred.teamName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)' }}>
                    Cược: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{pred.pointsBet.toLocaleString('vi-VN')} điểm</strong>
                    {' '}· Odds: <strong>{pred.oddsAtBet.toFixed(2)}</strong>
                    {' '}· {timeAgo(pred.createdAt)}
                  </span>
                  <Link to={`/matches/${pred.matchId}`} style={{ fontSize: '0.72rem', color: 'var(--accent-2)' }}>
                    Xem trận →
                  </Link>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'grid', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: st.color }}>{st.label}</span>
                  {pred.status === 'won' && (
                    <span style={{ fontSize: '0.8rem', color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
                      +{(pred.pointsWon ?? 0).toLocaleString('vi-VN')} điểm
                    </span>
                  )}
                  {pnl !== null && (
                    <span style={{ fontSize: '0.72rem', color: pnl >= 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                      P&L: {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('vi-VN')}
                    </span>
                  )}
                  {pred.status === 'pending' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-2)', fontVariantNumeric: 'tabular-nums' }}>
                      Tiềm năng: +{Math.floor(pred.pointsBet * pred.oddsAtBet).toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
