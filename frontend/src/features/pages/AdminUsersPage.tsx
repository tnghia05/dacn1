import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { PaginatedResponse, ToxicUser } from '../../shared/api/types'
import { Btn } from '../../shared/components/Ui'

function formatBanUntil(banUntil: string | null, isPermanent: boolean) {
  if (!banUntil) return null
  if (isPermanent) return 'Vĩnh viễn'
  const d = new Date(banUntil)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Modal xác nhận ban */
function BanModal({
  user,
  onConfirm,
  onClose,
  isLoading,
}: {
  user: ToxicUser
  onConfirm: (days: number, reason: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [days, setDays] = useState(7)
  const [isPermanent, setIsPermanent] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="surface-card" style={{ width: '100%', maxWidth: 460, padding: '1.5rem', borderRadius: 14 }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800 }}>
          🚫 Khóa tài khoản
        </h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
          {user.displayName} &lt;{user.email}&gt; — {user.toxicStrikeCount} lần vi phạm
        </p>

        <div className="field" style={{ marginBottom: '0.85rem' }}>
          <label htmlFor="ban-reason">Lý do khóa *</label>
          <textarea
            id="ban-reason"
            rows={3}
            placeholder="Mô tả vi phạm hoặc lý do cụ thể…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.87rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Cấm vĩnh viễn
          </label>

          {!isPermanent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Số ngày:</span>
              {[1, 3, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: days === d ? 'var(--accent)' : 'var(--line)',
                    background: days === d ? 'var(--accent)' : 'transparent',
                    color: days === d ? '#fff' : 'var(--muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose} disabled={isLoading}>Hủy</Btn>
          <Btn
            onClick={() => onConfirm(isPermanent ? 0 : days, reason)}
            disabled={isLoading || !reason.trim()}
            style={{ background: '#ef4444', border: '1px solid #ef4444' }}
          >
            {isLoading ? 'Đang xử lý…' : isPermanent ? '🔒 Cấm vĩnh viễn' : `🔒 Cấm ${days} ngày`}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function UserRow({ u, onBan, onUnban }: {
  u: ToxicUser
  onBan: (u: ToxicUser) => void
  onUnban: (id: string) => void
}) {
  const strikeColor =
    u.toxicStrikeCount >= 5 ? '#ef4444'
    : u.toxicStrikeCount >= 3 ? '#f97316'
    : '#fbbf24'

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {u.avatarUrl
            ? <img src={u.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>👤</div>
          }
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.87rem' }}>{u.displayName}</p>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)' }}>{u.email}</p>
          </div>
        </div>
      </td>
      <td style={{ textAlign: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
          fontSize: '0.8rem', fontWeight: 800,
          color: strikeColor,
          background: `${strikeColor}18`,
          border: `1px solid ${strikeColor}44`,
          borderRadius: '999px',
          padding: '0.15rem 0.55rem',
        }}>
          ⚠ {u.toxicStrikeCount}
        </span>
      </td>
      <td>
        {u.isBanned ? (
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem', fontWeight: 700,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '999px',
              padding: '0.15rem 0.5rem',
            }}>
              🔒 {u.isPermanent ? 'Vĩnh viễn' : `Đến ${formatBanUntil(u.banUntil, u.isPermanent)}`}
            </span>
            {u.banReason && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--muted)', maxWidth: 180 }}>{u.banReason}</p>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Đang hoạt động</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        {u.isBanned ? (
          <Btn variant="ghost" style={{ fontSize: '0.78rem' }} onClick={() => onUnban(u._id)}>
            🔓 Mở khóa
          </Btn>
        ) : (
          <Btn
            style={{ fontSize: '0.78rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
            onClick={() => onBan(u)}
          >
            🚫 Khóa
          </Btn>
        )}
      </td>
    </tr>
  )
}

export function AdminUsersPage() {
  const qc = useQueryClient()
  const [banTarget, setBanTarget] = useState<ToxicUser | null>(null)
  const [page, setPage] = useState(1)
  const [minStrikes, setMinStrikes] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-toxic-users', page, minStrikes],
    queryFn: () =>
      apiRequest<PaginatedResponse<ToxicUser>>(
        `/admin/users/toxic?page=${page}&limit=20&minStrikes=${minStrikes}`,
      ),
    staleTime: 30_000,
  })

  const banMutation = useMutation({
    mutationFn: ({ userId, durationDays, reason }: { userId: string; durationDays: number; reason: string }) =>
      apiRequest(`/admin/users/${userId}/ban`, { method: 'POST', body: { durationDays, reason } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-toxic-users'] })
      setBanTarget(null)
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/admin/users/${userId}/unban`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-toxic-users'] }),
  })

  const users = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = data?.hasMore ?? false
  const bannedCount = users.filter((u) => u.isBanned).length

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact" style={{ marginBottom: '1.5rem' }}>
        <p className="eyebrow">Admin · AI Moderation</p>
        <h1>Quản lý vi phạm</h1>
        <p>Người dùng bị PhoBERT phát hiện có bình luận độc hại. Click "Khóa" để ban tạm thời hoặc vĩnh viễn.</p>
      </section>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { label: 'Tổng vi phạm', value: total, color: '#fb923c' },
          { label: 'Đang bị khóa', value: bannedCount, color: '#ef4444' },
          { label: 'Đang hoạt động', value: users.length - bannedCount, color: '#4ade80' },
        ].map(({ label, value, color }) => (
          <div key={label} className="surface-card" style={{ padding: '0.85rem 1.25rem', minWidth: 130, flex: '0 0 auto' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '1.7rem', fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Số lần vi phạm tối thiểu:</span>
        {[1, 2, 3, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => { setMinStrikes(n); setPage(1) }}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: 6,
              border: '1px solid',
              borderColor: minStrikes === n ? 'var(--accent)' : 'var(--line)',
              background: minStrikes === n ? 'var(--accent)' : 'transparent',
              color: minStrikes === n ? '#fff' : 'var(--muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            ≥ {n}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th style={{ textAlign: 'center' }}>Vi phạm (⚠)</th>
              <th>Trạng thái ban</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Đang tải…</td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Không có dữ liệu vi phạm.</td></tr>
            )}
            {users.map((u) => (
              <UserRow
                key={u._id}
                u={u}
                onBan={(target) => setBanTarget(target)}
                onUnban={(id) => unbanMutation.mutate(id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <Btn variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Btn>
          <span style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>Trang {page}</span>
          <Btn variant="ghost" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Tiếp →</Btn>
        </div>
      )}

      {/* Ban Modal */}
      {banTarget && (
        <BanModal
          user={banTarget}
          isLoading={banMutation.isPending}
          onClose={() => setBanTarget(null)}
          onConfirm={(days, reason) =>
            banMutation.mutate({ userId: banTarget._id, durationDays: days, reason })
          }
        />
      )}
    </div>
  )
}
