import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { Order } from '../../shared/api/types'
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

  const subtotal = totalPrice
  const shipping = items.length > 0 ? SHIPPING : 0
  const total = subtotal + shipping

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
        shippingAddress: { name, phone, address },
        paymentMethod: method,
      }
      if (note.trim()) body.note = note.trim()

      const order = await apiRequest<Order>('/orders', { method: 'POST', body })

      if (method === 'vnpay' && order.paymentUrl) {
        clearCart()
        window.location.href = order.paymentUrl
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
