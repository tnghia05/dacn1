import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../shared/api/client'
import type { AdminOverview } from '../../shared/api/types'

// ── helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
function shortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  alert,
}: {
  icon: string
  label: string
  value: string
  sub: string
  accent: string
  alert?: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${alert ? 'rgba(248,113,113,0.3)' : 'var(--line)'}`,
      borderRadius: 14,
      padding: '1.1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* glow accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: alert
          ? 'linear-gradient(90deg, #f87171, #ef4444)'
          : `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.04em', color: alert ? '#f87171' : 'var(--text)', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>{sub}</p>
    </div>
  )
}

function QuickLink({
  to,
  icon,
  label,
  desc,
  color,
}: {
  to: string
  icon: string
  label: string
  desc: string
  color: string
}) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        gap: '0.85rem',
        alignItems: 'flex-start',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = color
          el.style.background = `${color}10`
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'var(--line)'
          el.style.background = 'var(--surface)'
        }}
      >
        <span style={{
          fontSize: '1.4rem', width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</span>
        <div>
          <p style={{ margin: '0 0 0.15rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</p>
        </div>
      </div>
    </Link>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────
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

  const hasPendingAlert = !isLoading && (data?.moderation.pendingReview ?? 0) > 0

  return (
    <div className="page-padding content-shell" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(99,102,241,0.06) 100%)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#818cf8',
              background: 'rgba(99,102,241,0.12)', padding: '0.15rem 0.5rem',
              borderRadius: 4, border: '1px solid rgba(99,102,241,0.25)',
            }}>ESPORT NEXUS · ADMIN</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
            Command Center
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Bảng điều khiển quản trị · tự cập nhật mỗi 60 giây
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.75rem', fontWeight: 700,
            color: '#4ade80', background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.25)',
            padding: '0.3rem 0.75rem', borderRadius: '999px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'ai-blink 1.5s ease-in-out infinite' }} />
            LIVE
          </span>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <KpiCard
          icon="👥"
          label="Người dùng"
          value={isLoading ? '—' : fmt(data!.users.total)}
          sub={`+${isLoading ? '…' : data!.users.today} hôm nay`}
          accent="#818cf8"
        />
        <KpiCard
          icon="📰"
          label="Bài viết"
          value={isLoading ? '—' : fmt(data!.posts.total)}
          sub={`+${isLoading ? '…' : data!.posts.today} hôm nay`}
          accent="#34d399"
        />
        <KpiCard
          icon="💬"
          label="Bình luận"
          value={isLoading ? '—' : fmt(data!.comments.total)}
          sub={`+${isLoading ? '…' : data!.comments.today} hôm nay`}
          accent="#60a5fa"
        />
        <KpiCard
          icon="🛡️"
          label="Chờ kiểm duyệt"
          value={isLoading ? '—' : String(data!.moderation.pendingReview)}
          sub={`${isLoading ? '…' : data!.moderation.queue} trong hàng AI`}
          accent="#f87171"
          alert={hasPendingAlert}
        />
      </div>

      {/* ── Middle Row: Chart + Modules ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>

        {/* Activity Chart */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, padding: '1.25rem 1.4rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem' }}>⚡ Hoạt động 7 ngày</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--muted)' }}>Bài viết + bình luận theo ngày</p>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.7rem', color: 'var(--muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#818cf8', display: 'inline-block' }} />
                Bài viết
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#60a5fa', display: 'inline-block' }} />
                Bình luận
              </span>
            </div>
          </div>

          {isLoading || !data?.activity7d.length ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {isLoading ? '⏳ Đang tải dữ liệu…' : 'Chưa có hoạt động'}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 120 }}>
                {data.activity7d.map((d) => {
                  const total = d.posts + d.comments
                  const h = Math.round((total / chartMax) * 120)
                  const postH = Math.round((d.posts / Math.max(total, 1)) * h)
                  const cmtH = h - postH
                  return (
                    <div
                      key={d.date}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, cursor: 'default' }}
                      title={`${shortDate(d.date)}: ${d.posts} bài, ${d.comments} cmt`}
                    >
                      <div style={{ flex: 1 }} />
                      <div style={{ height: postH, background: 'linear-gradient(180deg,#818cf8,#6366f1)', borderRadius: '3px 3px 0 0', minHeight: postH > 0 ? 4 : 0 }} />
                      <div style={{ height: cmtH, background: 'linear-gradient(180deg,#60a5fa,#3b82f6)', minHeight: cmtH > 0 ? 4 : 0 }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {data.activity7d.map((d) => (
                  <div key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', color: 'var(--muted)' }}>
                    {shortDate(d.date)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI Moderation Panel */}
        <div style={{
          background: 'var(--surface)', border: `1px solid ${hasPendingAlert ? 'rgba(248,113,113,0.25)' : 'var(--line)'}`,
          borderRadius: 14, padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem' }}>AI Kiểm Duyệt</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)' }}>PhoBERT · Tự động</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { label: 'Chờ review thủ công', value: isLoading ? '…' : data!.moderation.pendingReview, warn: hasPendingAlert },
              { label: 'Hàng chờ phân tích AI', value: isLoading ? '…' : data!.moderation.queue, warn: false },
            ].map(({ label, value, warn }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.85rem', borderRadius: 9,
                background: warn ? 'rgba(248,113,113,0.06)' : 'var(--surface-2)',
                border: `1px solid ${warn ? 'rgba(248,113,113,0.2)' : 'transparent'}`,
              }}>
                <span style={{ fontSize: '0.79rem', color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: warn ? '#f87171' : 'var(--text)' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {[
              { to: '/admin/moderation', color: '#818cf8', icon: '🛡️', label: 'Trang kiểm duyệt' },
              { to: '/admin/analytics', color: '#60a5fa', icon: '📊', label: 'Thống kê AI' },
            ].map(({ to, color, icon, label }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                textDecoration: 'none', fontSize: '0.8rem', color,
                padding: '0.4rem 0.6rem', borderRadius: 8,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${color}12` }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
              >
                <span>{icon}</span> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div>
        <p style={{ margin: '0 0 0.85rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Quản lý nhanh
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <QuickLink
            to="/admin/posts"
            icon="📰"
            label="Bài viết & Tin tức"
            desc="Duyệt, quản lý nội dung biên tập và cộng đồng"
            color="#34d399"
          />
          <QuickLink
            to="/admin/users"
            icon="⚠️"
            label="Vi phạm & Ban"
            desc="Xem người dùng toxic, cấm tạm thời hoặc vĩnh viễn"
            color="#fb923c"
          />
          <QuickLink
            to="/admin/products"
            icon="📦"
            label="Cửa hàng Esports"
            desc="Thêm, sửa sản phẩm áo đội, gear và phụ kiện"
            color="#4ade80"
          />
          <QuickLink
            to="/admin/predictions"
            icon="🎯"
            label="Dự đoán cược"
            desc="Quản lý kết quả dự đoán và cân bằng điểm thưởng"
            color="#fbbf24"
          />
          <QuickLink
            to="/admin/comments"
            icon="💬"
            label="Bình luận"
            desc="Review bình luận bị báo cáo hoặc cần xử lý thủ công"
            color="#60a5fa"
          />
          <QuickLink
            to="/admin/analytics"
            icon="📊"
            label="AI Analytics"
            desc="Báo cáo sentiment, hotness score và hiệu quả mô hình"
            color="#818cf8"
          />
        </div>
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <p style={{ margin: 0, fontSize: '0.71rem', color: 'var(--muted-2)', textAlign: 'center', paddingBottom: '0.5rem' }}>
        Esport Nexus Admin · PhoBERT AI Moderation · Dữ liệu tự cập nhật mỗi 60s
      </p>
    </div>
  )
}
