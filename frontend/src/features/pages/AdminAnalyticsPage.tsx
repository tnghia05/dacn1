import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { AiModerationStat, Sentiment4Distribution, ToxicByGame, AdminAlert } from '../../shared/api/types'
import { AITag, ChartBars, SectionHeader } from '../../shared/components/Ui'

const SENT_COLOR: Record<string, string> = {
  positive: '#22c55e',
  negative: '#f97316',
  neutral: '#6b7280',
  toxic: '#ef4444',
}

export function AdminAnalyticsPage() {
  const qc = useQueryClient()

  const { data: statsRaw } = useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: () => apiRequest<AiModerationStat[]>('/admin/ai/stats?days=7'),
    staleTime: 5 * 60_000,
  })

  const { data: sentiment } = useQuery({
    queryKey: ['admin-ai-sentiment'],
    queryFn: () => apiRequest<Sentiment4Distribution[]>('/admin/ai/sentiment'),
    staleTime: 5 * 60_000,
  })

  const { data: toxicByGame } = useQuery({
    queryKey: ['admin-ai-toxic-game'],
    queryFn: () => apiRequest<ToxicByGame[]>('/admin/ai/toxic-by-game'),
    staleTime: 5 * 60_000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['admin-ai-alerts'],
    queryFn: () => apiRequest<AdminAlert[]>('/admin/ai/alerts?limit=10'),
    staleTime: 60_000,
  })

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/ai/alerts/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ai-alerts'] }),
  })

  // KPI totals from 7-day stats
  const totals = (statsRaw ?? []).reduce(
    (acc, r) => ({
      approved: acc.approved + (r.approved ?? 0),
      rejected: acc.rejected + (r.rejected ?? 0),
      under_review: acc.under_review + (r.under_review ?? 0),
    }),
    { approved: 0, rejected: 0, under_review: 0 },
  )
  const totalComments = totals.approved + totals.rejected + totals.under_review
  const approvalRate = totalComments > 0 ? Math.round((totals.approved / totalComments) * 100) : 0

  // Chart: approved per day
  const approvedChart = (statsRaw ?? []).map((r) => ({
    label: r.date.slice(5),
    value: r.approved ?? 0,
  }))

  const unreadAlerts = (alerts ?? []).filter((a) => !a.isRead)

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin · AI Analytics</p>
        <h1>AI Health</h1>
        <p>Thống kê kiểm duyệt, phân phối cảm xúc và cảnh báo toxicity spike từ PhoBERT.</p>
      </section>

      {/* KPIs */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Approved (7 ngày)</p>
          <p className="kpi-value">{totals.approved.toLocaleString()}</p>
          <p className="kpi-trend" style={{ color: '#22c55e' }}>Tỉ lệ {approvalRate}%</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Rejected (7 ngày)</p>
          <p className="kpi-value">{totals.rejected.toLocaleString()}</p>
          <p className="kpi-trend" style={{ color: '#ef4444' }}>
            {totalComments > 0 ? Math.round((totals.rejected / totalComments) * 100) : 0}% tổng số
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Chờ duyệt tay</p>
          <p className="kpi-value">{totals.under_review.toLocaleString()}</p>
          <p className="kpi-trend" style={{ color: '#f97316' }}>under_review</p>
        </div>
      </div>

      <div className="two-col">
        {/* Approved per day chart */}
        {approvedChart.length > 0 ? (
          <ChartBars title="Comments approved / ngày" data={approvedChart} />
        ) : (
          <div className="chart-card">
            <h3 className="chart-title">Comments approved / ngày</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>Chưa có dữ liệu.</p>
          </div>
        )}

        {/* Sentiment4 distribution */}
        <div className="ai-panel">
          <p className="ai-panel-title">Phân phối Sentiment4</p>
          {!sentiment || sentiment.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem' }}>
              {sentiment.map((s) => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: SENT_COLOR[s.label] ?? 'var(--text)', fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {s.count.toLocaleString()} ({Math.round(s.ratio * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${s.ratio * 100}%`, height: '100%', background: SENT_COLOR[s.label] ?? '#6b7280', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="two-col">
        {/* Toxic rate by game */}
        <div className="surface-card">
          <SectionHeader title="Toxic rate theo game" action={<AITag>AI</AITag>} />
          {!toxicByGame || toxicByGame.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: '0.5rem' }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
              {toxicByGame.slice(0, 8).map((g) => (
                <div key={g.game} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ minWidth: 80, fontSize: '0.82rem', fontWeight: 600 }}>{g.game}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${g.toxicRate * 100}%`, height: '100%', background: '#ef4444', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
                    {Math.round(g.toxicRate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toxicity spike alerts */}
        <div className="surface-card">
          <SectionHeader
            title={`Cảnh báo Toxicity Spike${unreadAlerts.length > 0 ? ` (${unreadAlerts.length} mới)` : ''}`}
            subtitle="Raid toxic được phát hiện tự động"
            action={<AITag>AI</AITag>}
          />
          {!alerts || alerts.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: '0.5rem' }}>Không có cảnh báo nào.</p>
          ) : (
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem' }}>
              {alerts.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.6rem',
                    borderRadius: 6,
                    background: a.isRead ? 'transparent' : 'rgba(239,68,68,0.07)',
                    border: a.isRead ? 'none' : '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>
                      #{a.tag}
                      {!a.isRead && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#ef4444' }}>● NEW</span>}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      3h: {Math.round(a.ratio3h * 100)}% toxic · 24h: {Math.round(a.ratio24h * 100)}% toxic
                      · {new Date(a.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!a.isRead && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => markRead(a.id)}
                    >
                      Đã đọc
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
