import { useState } from 'react'
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

const ICON_MAP: Record<string, string> = {
  match: '⚡', news: '📰', order: '📦', social: '💬', promo: '🏷️',
  like: '❤️', comment: '💬', follow: '👤', system: '🔔',
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '30' })
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
  const unreadCount = items.filter((n: Notification) => !n.read).length

  return (
    <div className="page-padding content-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Thông báo {unreadCount > 0 && <span style={{ fontSize: '0.9rem', background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.55rem', fontWeight: 700, marginLeft: '0.4rem', verticalAlign: 'middle' }}>{unreadCount}</span>}
          </h1>
        </div>
        <Btn variant="ghost" onClick={() => markAll.mutate()} disabled={markAll.isPending || unreadCount === 0}>
          ✓ Đánh dấu tất cả đã đọc
        </Btn>
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'Tất cả' },
          { id: 'unread', label: unreadCount > 0 ? `Chưa đọc (${unreadCount})` : 'Chưa đọc' },
        ]}
        active={filter}
        onChange={(id) => setFilter(id as typeof filter)}
      />

      {isLoading && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="surface-card" style={{ height: '64px', opacity: 0.3 }} />)}
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {items.map((n: Notification) => (
          <div
            key={n._id}
            onClick={() => !n.read && markOne.mutate(n._id)}
            className="surface-card"
            style={{
              padding: '0.9rem 1.15rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
              cursor: n.read ? 'default' : 'pointer',
              opacity: n.read ? 0.65 : 1,
              borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent)',
            }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '0.1rem' }}>{ICON_MAP[n.type] ?? '🔔'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {n.title && (
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                  {n.title}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '0.88rem', color: n.read ? 'var(--muted)' : 'var(--text)', lineHeight: 1.5 }}>
                {n.body || n.message}
              </p>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>{timeAgo(n.createdAt)}</span>
              {!n.read && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '0.4rem' }} />
              )}
            </div>
          </div>
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
