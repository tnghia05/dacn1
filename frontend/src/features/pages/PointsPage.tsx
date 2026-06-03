import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { PointsBalance, PointLedgerEntry, PointReason } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, SectionHeader } from '../../shared/components/Ui'

const REASON_LABEL: Record<PointReason, string> = {
  checkin: '📅 Điểm danh hàng ngày',
  post_publish: '📝 Đăng bài viết',
  comment_create: '💬 Bình luận',
  prediction_win: '🏆 Dự đoán thắng',
  prediction_bet: '🎯 Đặt cược dự đoán',
  redeem_product: '🎁 Đổi sản phẩm',
  checkout_discount: '🛒 Giảm giá đơn hàng',
  admin_adjust: '⚙️ Điều chỉnh',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

const REWARDS = [
  { icon: '📅', label: 'Điểm danh hàng ngày', pts: '+10 điểm' },
  { icon: '📝', label: 'Đăng bài viết', pts: '+20 điểm' },
  { icon: '💬', label: 'Bình luận', pts: '+5 điểm' },
  { icon: '🏆', label: 'Dự đoán trận đúng', pts: '+bet × odds' },
]

export function PointsPage() {
  const { user, refreshUser } = useAuth()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['points-me'],
    queryFn: () => apiRequest<PointsBalance>('/points/me?limit=20'),
    enabled: !!user,
  })

  const checkinMutation = useMutation({
    mutationFn: () => apiRequest<{ points: number; alreadyDone: boolean }>('/points/checkin', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['points-me'] })
      refreshUser()
    },
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

  const balance = data?.balance ?? user.points ?? 0
  const history: PointLedgerEntry[] = data?.items ?? []
  const checkinResult = checkinMutation.data

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Hệ thống điểm</p>
        <h1>Điểm tích lũy</h1>
        <p>Tích điểm qua hoạt động, dự đoán trận đấu và đổi phần thưởng.</p>
      </section>

      {/* Balance card */}
      <div className="surface-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', padding: '1.75rem 2rem' }}>
        <div style={{ flex: '1 1 200px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Số dư điểm</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-2)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {isLoading ? '…' : balance.toLocaleString('vi-VN')}
          </p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>điểm khả dụng</p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Btn
            onClick={() => checkinMutation.mutate()}
            disabled={checkinMutation.isPending || checkinResult?.alreadyDone === true}
          >
            {checkinMutation.isPending
              ? 'Đang xử lý…'
              : checkinResult?.alreadyDone
              ? '✓ Đã điểm danh hôm nay'
              : '📅 Điểm danh (+10 điểm)'}
          </Btn>
          <Link to="/points/predictions"><Btn variant="ghost">🎯 Dự đoán của tôi</Btn></Link>
          <Link to="/points/store"><Btn variant="ghost">🎁 Đổi phần thưởng</Btn></Link>
        </div>
      </div>

      {checkinMutation.isSuccess && !checkinResult?.alreadyDone && (
        <div style={{ padding: '0.85rem 1.1rem', borderRadius: '10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: '0.88rem' }}>
          🎉 Điểm danh thành công! Bạn nhận được <strong>+10 điểm</strong>. Số dư: <strong>{checkinResult?.points?.toLocaleString('vi-VN')} điểm</strong>
        </div>
      )}

      {checkinMutation.isError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.85rem' }}>
          {checkinMutation.error instanceof ApiError ? checkinMutation.error.message : 'Có lỗi xảy ra'}
        </div>
      )}

      {/* How to earn */}
      <div>
        <SectionHeader title="Cách kiếm điểm" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }}>
          {REWARDS.map(r => (
            <div key={r.label} className="surface-card" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
              <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>{r.label}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-2)' }}>{r.pts}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <SectionHeader title="Lịch sử điểm" subtitle={data ? `${data.total} giao dịch` : undefined} />
        {isLoading && (
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="surface-card" style={{ height: '52px', opacity: 0.3 }} />
            ))}
          </div>
        )}
        {!isLoading && history.length === 0 && (
          <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
            Chưa có giao dịch nào. Hãy điểm danh để bắt đầu!
          </div>
        )}
        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.75rem' }}>
          {history.map(entry => (
            <div key={entry._id} className="surface-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 1.1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{REASON_LABEL[entry.reason] ?? entry.reason}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)' }}>{timeAgo(entry.createdAt)}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: entry.delta > 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                  {entry.delta > 0 ? '+' : ''}{entry.delta.toLocaleString('vi-VN')}
                </span>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-2)', fontVariantNumeric: 'tabular-nums' }}>
                  Số dư: {entry.balanceAfter.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
