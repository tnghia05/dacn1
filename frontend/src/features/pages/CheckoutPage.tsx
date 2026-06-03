import { useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { Order, PointsBalance } from '../../shared/api/types'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, SectionHeader } from '../../shared/components/Ui'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'
const SHIPPING = 30_000

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()

  const [method, setMethod] = useState<'vnpay' | 'cod'>('vnpay')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pointsToUse, setPointsToUse] = useState(0)
  const { user } = useAuth()

  const { data: pointsData } = useQuery({
    queryKey: ['points-me'],
    queryFn: () => apiRequest<PointsBalance>('/points/me?limit=1'),
    enabled: !!user,
  })

  const availablePoints = pointsData?.balance ?? user?.points ?? 0
  const subtotal = totalPrice
  const shipping = items.length > 0 ? SHIPPING : 0
  const pointsDiscountVnd = pointsToUse * 100
  const total = Math.max(0, subtotal + shipping - pointsDiscountVnd)

  const maxPointsUsable = Math.min(availablePoints, Math.floor((subtotal + shipping) / 100))

  const handlePointsInput = useCallback((val: string) => {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0) { setPointsToUse(0); return }
    setPointsToUse(Math.min(n, maxPointsUsable))
  }, [maxPointsUsable])

  async function onPlaceOrder(e: FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        items: items.map(it => ({
          productId: it.productId,
          qty: it.qty,
          ...(it.variantId ? { variantId: it.variantId } : {}),
        })),
        receiverName: name,
        phone,
        shippingAddress: [address].filter(Boolean).join(', '),
      }
      if (note.trim()) body.note = note.trim()
      if (pointsToUse > 0) body.pointsDiscount = pointsToUse

      const order = await apiRequest<Order>('/orders', { method: 'POST', body })

      if (method === 'vnpay') {
        // Backend requires a separate call to generate the VNPay payment URL
        let vnpayUrl: string
        try {
          const vnpayRes = await apiRequest<{ paymentUrl: string }>(
            `/payments/vnpay/orders/${order._id}/url`,
            {
              method: 'POST',
              body: { returnUrl: `${window.location.origin}/order/success` },
            },
          )
          vnpayUrl = vnpayRes.paymentUrl
        } catch (vnpErr) {
          setError(
            vnpErr instanceof ApiError
              ? `Không thể tạo link thanh toán VNPay: ${vnpErr.message}`
              : 'Không thể kết nối VNPay. Vui lòng thử lại hoặc chọn COD.',
          )
          setLoading(false)
          return
        }
        clearCart()
        window.location.href = vnpayUrl
      } else {
        clearCart()
        navigate('/order/success', { state: { orderId: order._id } })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đặt hàng thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-padding content-shell">
      <Link to="/cart" className="link-inline" style={{ fontSize: '0.84rem' }}>← Giỏ hàng</Link>

      <section className="hero-panel compact">
        <p className="eyebrow">Thanh toán</p>
        <h1>Hoàn tất đơn hàng</h1>
        <p>Điền thông tin giao hàng và chọn phương thức thanh toán.</p>
      </section>

      <form onSubmit={onPlaceOrder} className="two-col">
        <div className="section-stack">
          <div className="surface-card">
            <SectionHeader title="Thông tin giao hàng" />
            <div style={{ display: 'grid', gap: '0.85rem', marginTop: '0.85rem' }}>
              <div className="field">
                <label htmlFor="full">Họ và tên</label>
                <input id="full" placeholder="Nguyễn Văn A" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="field">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input id="phone" type="tel" placeholder="0901 234 567" required value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="checkout-email">Email</label>
                  <input id="checkout-email" type="email" placeholder="ban@email.com" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="address">Địa chỉ</label>
                <input id="address" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP" required value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="field">
                  <label htmlFor="city">Tỉnh/TP</label>
                  <select id="city" defaultValue="hcm">
                    <option value="hcm">Hồ Chí Minh</option>
                    <option value="hn">Hà Nội</option>
                    <option value="dn">Đà Nẵng</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="district">Quận/Huyện</label>
                  <input id="district" placeholder="Quận 1" />
                </div>
                <div className="field">
                  <label htmlFor="ward">Phường/Xã</label>
                  <input id="ward" placeholder="Bến Nghé" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="note">Ghi chú</label>
                <textarea id="note" rows={2} placeholder="Ví dụ: gọi trước khi giao" value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="surface-card">
            <SectionHeader title="Phương thức thanh toán" />
            <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.85rem' }}>
              {(
                [
                  { id: 'vnpay', label: 'VNPay', sub: 'Thẻ ATM / Visa / Mastercard / QR Code' },
                  { id: 'cod', label: 'Thanh toán khi nhận hàng', sub: 'COD trên toàn quốc' },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: method === m.id ? 'var(--accent-line)' : 'var(--line)',
                    background: method === m.id ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.92rem', fontWeight: 600 }}>{m.label}</strong>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside>
          <div className="surface-card" style={{ position: 'sticky', top: '5rem' }}>
            <SectionHeader title="Tóm tắt đơn" />
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Tạm tính</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Giao hàng</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(shipping)}</span>
              </div>

              {user && availablePoints > 0 && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>🏆 Dùng điểm tích lũy</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Có {availablePoints.toLocaleString('vi-VN')} điểm</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={maxPointsUsable}
                      value={pointsToUse || ''}
                      placeholder="0"
                      onChange={e => handlePointsInput(e.target.value)}
                      style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--accent-line)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.88rem' }}
                    />
                    <Btn variant="ghost" onClick={() => setPointsToUse(maxPointsUsable)} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>Tối đa</Btn>
                  </div>
                  {pointsToUse > 0 && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#4ade80' }}>
                      Giảm {fmt(pointsDiscountVnd)} (1 điểm = 100 ₫)
                    </p>
                  )}
                </div>
              )}

              {pointsToUse > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>🏆 Giảm điểm ({pointsToUse.toLocaleString('vi-VN')} đ)</span>
                  <span style={{ color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>-{fmt(pointsDiscountVnd)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--line)',
                  marginTop: '0.3rem',
                }}
              >
                <strong>Tổng</strong>
                <strong style={{ color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums', fontSize: '1.1rem' }}>
                  {fmt(total)}
                </strong>
              </div>
            </div>
            {error && <p style={{ margin: '0.75rem 0 0', color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
            <div style={{ marginTop: '1.1rem' }}>
              <Btn type="submit" disabled={loading || items.length === 0} style={{ width: '100%' }}>
                {loading ? 'Đang xử lý…' : method === 'vnpay' ? '🔒 Thanh toán qua VNPay' : '📦 Đặt hàng (COD)'}
              </Btn>
            </div>
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.74rem', color: 'var(--muted-2)', lineHeight: 1.55 }}>
              Khi đặt hàng, bạn đồng ý với điều khoản và chính sách đổi trả của chúng tôi.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
