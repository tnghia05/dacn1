import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { Notification, PaginatedResponse } from '../../shared/api/types'
import { Btn, Tabs } from '../../shared/components/Ui'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

type NotifConfig = {
  icon: string
  label: string
  accent: string
  bg: string
  border: string
}

const NOTIF_CONFIG: Record<string, NotifConfig> = {
  comment:       { icon: '💬', label: 'Bình luận mới',    accent: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)' },
  reply:         { icon: '↩️', label: 'Trả lời bình luận', accent: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  follow:        { icon: '👤', label: 'Người theo dõi',   accent: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)' },
  post_like:     { icon: '❤️', label: 'Thích bài viết',   accent: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
  toxic_warning: { icon: '⚠️', label: 'Cảnh báo vi phạm', accent: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.35)' },
  account_ban:   { icon: '🚫', label: 'Thông báo tài khoản', accent: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)' },
}

const DEFAULT_CONFIG: NotifConfig = {
  icon: '🔔', label: 'Thông báo', accent: 'var(--muted)', bg: 'transparent', border: 'transparent',
}

function buildNotifText(n: Notification): string {
  // message field takes priority (toxic_warning, account_ban)
  if (n.message) return n.message
  if (n.body) return n.body
  switch (n.type) {
    case 'comment':   return 'Có bình luận mới trên bài viết của bạn.'
    case 'reply':     return 'Ai đó vừa trả lời bình luận của bạn.'
    case 'follow':    return 'Có người mới theo dõi bạn.'
    case 'post_like': return 'Bài viết của bạn vừa được thích.'
    default:          return 'Bạn có thông báo mới.'
  }
}

function buildNotifLink(n: Notification): string | null {
  if (n.type === 'toxic_warning' || n.type === 'account_ban') return null
  if (n.postId && n.commentId) return `/community/${n.postId}#comment-${n.commentId}`
  if (n.postId) return `/community/${n.postId}`
  return null
}

function NotifItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const isRead = n.isRead || n.read
  const cfg = NOTIF_CONFIG[n.type] ?? DEFAULT_CONFIG
  const text = buildNotifText(n)
  const href = buildNotifLink(n)
  const isCritical = n.type === 'toxic_warning' || n.type === 'account_ban'

  const inner = (
    <div
      className="surface-card"
      style={{
        padding: '0.9rem 1.15rem',
        display: 'flex',
        gap: '0.85rem',
        alignItems: 'flex-start',
        cursor: isRead ? 'default' : 'pointer',
        opacity: isRead ? 0.72 : 1,
        borderLeft: `3px solid ${isRead ? 'transparent' : cfg.accent}`,
        background: isRead ? undefined : (isCritical ? cfg.bg : undefined),
        transition: 'opacity 0.2s',
      }}
      onClick={() => { if (!isRead) onRead(n._id) }}
    >
      {/* Icon */}
      <div
        style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.15rem',
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
        }}
      >
        {cfg.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {cfg.label}
          </span>
          {!isRead && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: cfg.accent, flexShrink: 0,
              boxShadow: `0 0 6px ${cfg.accent}`,
            }} />
          )}
        </div>

        {n.title && (
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
            {n.title}
          </p>
        )}

        {/* Critical messages get full styling */}
        <p style={{
          margin: 0, fontSize: '0.875rem', lineHeight: 1.55,
          color: isCritical && !isRead ? cfg.accent : (isRead ? 'var(--muted)' : 'var(--text)'),
          fontWeight: isCritical ? 600 : 400,
        }}>
          {text}
        </p>

        <span style={{ fontSize: '0.73rem', color: 'var(--muted-2)', marginTop: '0.3rem', display: 'block' }}>
          {timeAgo(n.createdAt)}
        </span>
      </div>
    </div>
  )

  if (href) {
    return <Link to={href} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{inner}</Link>
  }
  return inner
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '40' })
      if (filter === 'unread') params.set('read', 'false')
      return apiRequest<PaginatedResponse<Notification>>(`/notifications?${params}`)
    },
  })

  const markAll = useMutation({
    mutationFn: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = data?.items ?? []
  const unreadCount = items.filter((n) => !n.isRead && !n.read).length
  const warningCount = items.filter((n) => (n.type === 'toxic_warning' || n.type === 'account_ban') && (!n.isRead && !n.read)).length

  return (
    <div className="page-padding content-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Thông báo
            {unreadCount > 0 && (
              <span style={{ fontSize: '0.9rem', background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.55rem', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        <Btn variant="ghost" onClick={() => markAll.mutate()} disabled={markAll.isPending || unreadCount === 0}>
          ✓ Đánh dấu tất cả đã đọc
        </Btn>
      </div>

      {/* Warning banner nếu có cảnh báo chưa đọc */}
      {warningCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          padding: '0.9rem 1.1rem', borderRadius: 10, marginBottom: '1rem',
          background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)',
        }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.9rem', color: '#fb923c' }}>
              Bạn có {warningCount} cảnh báo vi phạm chưa đọc
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
              Tích lũy nhiều vi phạm có thể dẫn đến khóa tài khoản. Vui lòng đọc và điều chỉnh cách phát ngôn.
            </p>
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'all', label: 'Tất cả' },
          { id: 'unread', label: unreadCount > 0 ? `Chưa đọc (${unreadCount})` : 'Chưa đọc' },
        ]}
        active={filter}
        onChange={(id) => setFilter(id as typeof filter)}
      />

      {isLoading && (
        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card" style={{ height: 72, opacity: 0.25 }} />
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
        {items.map((n) => (
          <NotifItem key={n._id} n={n} onRead={(id) => markOne.mutate(id)} />
        ))}
      </div>

      {!isLoading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.75rem' }}>📣</p>
          <p>{filter === 'unread' ? 'Không có thông báo chưa đọc.' : 'Bạn chưa có thông báo nào.'}</p>
        </div>
      )}
    </div>
  )
}
