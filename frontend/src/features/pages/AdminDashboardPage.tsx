import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../shared/api/client'
import type { AdminOverview } from '../../shared/api/types'
import { SectionHeader } from '../../shared/components/Ui'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function shortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiRequest<AdminOverview>('/admin/ai/overview'),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const chartMax = data
    ? Math.max(...data.activity7d.map((d) => d.posts + d.comments), 1)
    : 1

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin</p>
        <h1>Tổng quan</h1>
        <p>Số liệu hoạt động chính trong 24 giờ — tự cập nhật mỗi phút.</p>
      </section>

      {/* KPI cards */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Người dùng</p>
          <p className="kpi-value">{isLoading ? '—' : fmt(data!.users.total)}</p>
          <p className="kpi-trend">+ {isLoading ? '…' : data!.users.today} hôm nay</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Bài viết</p>
          <p className="kpi-value">{isLoading ? '—' : fmt(data!.posts.total)}</p>
          <p className="kpi-trend">+ {isLoading ? '…' : data!.posts.today} hôm nay</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Bình luận</p>
          <p className="kpi-value">{isLoading ? '—' : fmt(data!.comments.total)}</p>
          <p className="kpi-trend">+ {isLoading ? '…' : data!.comments.today} hôm nay</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Chờ kiểm duyệt</p>
          <p className="kpi-value" style={{ color: data?.moderation.pendingReview ? '#fca5a5' : 'inherit' }}>
            {isLoading ? '—' : data!.moderation.pendingReview}
          </p>
          <p className="kpi-trend" style={{ color: 'var(--muted)' }}>
            {isLoading ? '…' : `${data!.moderation.queue} chờ AI`}
          </p>
        </div>
      </div>

      <div className="two-col">
        {/* Activity chart */}
        <div className="surface-card">
          <SectionHeader title="Hoạt động 7 ngày" />
          {isLoading || !data?.activity7d.length ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
              {isLoading ? 'Đang tải…' : 'Chưa có dữ liệu'}
            </p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', height: 80 }}>
                {data.activity7d.map((d) => {
                  const total = d.posts + d.comments
                  const h = Math.round((total / chartMax) * 80)
                  const postH = Math.round((d.posts / Math.max(total, 1)) * h)
                  const cmtH = h - postH
                  return (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${shortDate(d.date)}: ${d.posts} bài, ${d.comments} cmt`}>
                      <div style={{ width: '100%', background: 'var(--accent)', borderRadius: '2px 2px 0 0', height: postH }} />
                      <div style={{ width: '100%', background: 'rgba(139,92,246,0.6)', height: cmtH }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem' }}>
                {data.activity7d.map((d) => (
                  <div key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--muted)' }}>
                    {shortDate(d.date)}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--muted)' }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', marginRight: 4 }} />Bài viết</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(139,92,246,0.6)', marginRight: 4 }} />Bình luận</span>
              </div>
            </div>
          )}
        </div>

        {/* Moderation panel */}
        <div className="surface-card">
          <SectionHeader title="Kiểm duyệt" />
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--muted)' }}>Chờ review thủ công</span>
              <span style={{ fontWeight: 700, color: data?.moderation.pendingReview ? '#fca5a5' : 'inherit' }}>
                {isLoading ? '…' : data!.moderation.pendingReview}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--muted)' }}>Hàng chờ AI</span>
              <span style={{ fontWeight: 700 }}>{isLoading ? '…' : data!.moderation.queue}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Link to="/admin/moderation" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none' }}>→ Vào trang kiểm duyệt</Link>
              <Link to="/admin/analytics" style={{ fontSize: '0.82rem', color: 'var(--muted)', textDecoration: 'none' }}>→ Thống kê AI chi tiết</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
