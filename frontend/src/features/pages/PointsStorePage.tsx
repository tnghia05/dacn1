import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { Product, PointsBalance } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, SectionHeader } from '../../shared/components/Ui'

type StoreResp = { items: Product[]; total: number }

export function PointsStorePage() {
  const { user, refreshUser } = useAuth()
  const qc = useQueryClient()
  const [redeemed, setRedeemed] = useState<string | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['points-store'],
    queryFn: () => apiRequest<StoreResp>('/points/store?limit=24'),
  })

  const { data: balanceData } = useQuery({
    queryKey: ['points-me'],
    queryFn: () => apiRequest<PointsBalance>('/points/me?limit=1'),
    enabled: !!user,
  })

  const redeemMutation = useMutation({
    mutationFn: (productId: string) =>
      apiRequest<{ success: boolean; productName: string; pointsSpent: number }>('/points/redeem', {
        method: 'POST',
        body: { productId },
      }),
    onSuccess: (_res, productId) => {
      setRedeemed(productId)
      setRedeemError(null)
      qc.invalidateQueries({ queryKey: ['points-me'] })
      qc.invalidateQueries({ queryKey: ['points-store'] })
      refreshUser()
      setTimeout(() => setRedeemed(null), 3000)
    },
    onError: (err) => {
      setRedeemError(err instanceof ApiError ? err.message : 'Đổi thất bại')
    },
  })

  const balance = balanceData?.balance ?? user?.points ?? 0
  const products = storeData?.items ?? []

  return (
    <div className="page-padding content-shell">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/points" style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>← Điểm tích lũy</Link>
      </div>

      <section className="hero-panel compact">
        <p className="eyebrow">Đổi phần thưởng</p>
        <h1>Points Store</h1>
        <p>Dùng điểm tích lũy để đổi sản phẩm độc quyền.</p>
      </section>

      {user && (
        <div className="surface-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem 1.4rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Số dư của bạn</span>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums' }}>
              {balance.toLocaleString('vi-VN')} điểm
            </p>
          </div>
          <Link to="/points"><Btn variant="ghost">Xem lịch sử →</Btn></Link>
        </div>
      )}

      {redeemError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.85rem' }}>
          {redeemError}
        </div>
      )}

      <SectionHeader title="Sản phẩm đổi điểm" subtitle={storeData ? `${storeData.total} mẫu` : '…'} />

      {isLoading && (
        <div className="product-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="product-card" style={{ opacity: 0.3, minHeight: '240px' }} />)}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Chưa có sản phẩm nào trong Points Store. Kiểm tra lại sau nhé!
        </div>
      )}

      <div className="product-grid">
        {products.map(p => {
          const cost = p.pointsPrice ?? 0
          const canAfford = user && balance >= cost
          const isDone = redeemed === p._id
          return (
            <div key={p._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="product-card-img" style={{ backgroundImage: `url(${p.imageUrl})` }}>
                {(p.stock ?? 0) === 0 && <span className="product-badge" style={{ background: 'rgb(100 100 100 / 90%)' }}>Hết hàng</span>}
                <span className="product-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', border: '1px solid var(--accent-line)' }}>
                  🏆 {cost.toLocaleString('vi-VN')} điểm
                </span>
              </div>
              <div className="product-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <strong style={{ lineHeight: 1.35 }}>{p.name}</strong>
                <span style={{ color: 'var(--accent-2)', fontWeight: 800, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                  {cost.toLocaleString('vi-VN')} điểm
                </span>
                {!canAfford && user && (
                  <span style={{ fontSize: '0.75rem', color: '#fb923c' }}>Cần thêm {(cost - balance).toLocaleString('vi-VN')} điểm</span>
                )}
                <div style={{ marginTop: 'auto' }}>
                  {!user ? (
                    <Link to="/auth/login" style={{ display: 'block' }}>
                      <Btn variant="ghost" style={{ width: '100%' }}>Đăng nhập để đổi</Btn>
                    </Link>
                  ) : (
                    <Btn
                      disabled={!canAfford || (p.stock ?? 0) === 0 || redeemMutation.isPending}
                      onClick={() => { setRedeemError(null); redeemMutation.mutate(p._id) }}
                      style={{ width: '100%', background: isDone ? 'var(--accent)' : undefined }}
                    >
                      {isDone ? '✓ Đã đổi!' : redeemMutation.isPending ? '…' : '🎁 Đổi ngay'}
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
