import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { Order, OrderStatus, PaginatedResponse } from '../../shared/api/types'
import { Btn, Tabs } from '../../shared/components/Ui'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

function timeAgo(iso?: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86_400_000)
  if (d === 0) return 'Hôm nay'
  if (d === 1) return 'Hôm qua'
  return `${d} ngày trước`
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã nhận',
  cancelled: 'Đã hủy',
  cancelled_expired: 'Hết hạn',
  refunded: 'Hoàn tiền',
}

const TAB_FILTERS: Record<string, OrderStatus[]> = {
  all: [],
  active: ['pending_payment', 'paid', 'processing', 'shipped'],
  done: ['delivered'],
  cancelled: ['cancelled', 'cancelled_expired', 'refunded'],
}

export function OrdersPage() {
  const [tab, setTab] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', tab],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '20' })
      const statuses = TAB_FILTERS[tab]
      if (statuses.length) params.set('status', statuses.join(','))
      return apiRequest<PaginatedResponse<Order>>(`/orders/me?${params}`)
    },
  })

  const orders = data?.items ?? []

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tài khoản</p>
        <h1>Đơn hàng của tôi</h1>
        <p>Theo dõi trạng thái và lịch sử mua hàng.</p>
      </section>

      <Tabs
        tabs={[
          { id: 'all', label: 'Tất cả' },
          { id: 'active', label: 'Đang xử lý' },
          { id: 'done', label: 'Hoàn thành' },
          { id: 'cancelled', label: 'Đã hủy' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {isLoading && (
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="surface-card" style={{ height: '90px', opacity: 0.3 }} />)}
        </div>
      )}

      <div className="section-stack" style={{ marginTop: '1rem' }}>
        {orders.map((o) => (
          <div key={o._id} className="surface-card" style={{ padding: '1.1rem 1.25rem', display: 'grid', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.92rem' }}>#{o.orderCode}</strong>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '999px', background: { pending_payment: 'rgb(251 191 36 / 15%)', paid: 'rgb(52 211 153 / 15%)', processing: 'rgb(251 191 36 / 15%)', shipped: 'rgb(251 191 36 / 15%)', delivered: 'rgb(52 211 153 / 15%)', cancelled: 'rgb(248 113 113 / 15%)', cancelled_expired: 'rgb(248 113 113 / 15%)', refunded: 'rgb(148 163 184 / 15%)' }[o.status], color: { pending_payment: '#fbbf24', paid: '#34d399', processing: '#fbbf24', shipped: '#fbbf24', delivered: '#34d399', cancelled: '#f87171', cancelled_expired: '#f87171', refunded: '#94a3b8' }[o.status] }}>{STATUS_LABEL[o.status] ?? o.status}</span>
            </div>

            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              {o.items.slice(0, 2).map(it => it.name || `SP ${it.productId.slice(-6)}`).join(' · ')}
              {o.items.length > 2 && ` +${o.items.length - 2} sản phẩm`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-2)' }}>{timeAgo(o.createdAt)}</span>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <strong style={{ color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums' }}>{fmt(o.total)}</strong>
                {o.status === 'pending_payment' && o.paymentUrl && (
                  <a href={o.paymentUrl}>
                    <Btn>Thanh toán ngay</Btn>
                  </a>
                )}
                <Link to={`/orders/${o._id}`} className="link-inline" style={{ fontSize: '0.82rem' }}>Chi tiết →</Link>
              </div>
            </div>

            {o.status === 'pending_payment' && o.reservedUntil && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#fb923c', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                ⏳ Hết hạn lúc {new Date(o.reservedUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        ))}

        {!isLoading && orders.length === 0 && (
          <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <p style={{ fontSize: '2.5rem', margin: '0 0 0.75rem' }}>📦</p>
            <p style={{ margin: '0 0 1.25rem' }}>
              {tab === 'all' ? 'Bạn chưa có đơn hàng nào.' : 'Không có đơn hàng trong danh mục này.'}
            </p>
            <Link to="/store"><Btn>Mua sắm ngay</Btn></Link>
          </div>
        )}
      </div>
    </div>
  )
}
