import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { Btn, SectionHeader } from '../../shared/components/Ui'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'
const SHIPPING = 30_000

export function CartPage() {
  const { items, updateQty, removeItem, totalPrice } = useCart()
  const navigate = useNavigate()
  const shipping = items.length > 0 ? SHIPPING : 0
  const total = totalPrice + shipping

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Cửa hàng</p>
        <h1>Giỏ hàng</h1>
        <p>{items.length > 0 ? `${items.length} sản phẩm · ${fmt(totalPrice)}` : 'Giỏ hàng trống.'}</p>
      </section>

      <div className="two-col">
        <div className="section-stack">
          {items.length === 0 ? (
            <div className="surface-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <p style={{ fontSize: '3rem', margin: '0 0 0.75rem' }}>🛒</p>
              <p style={{ margin: '0 0 1.25rem', color: 'var(--muted)' }}>Giỏ hàng của bạn đang trống.</p>
              <Link to="/store"><Btn>Khám phá cửa hàng</Btn></Link>
            </div>
          ) : (
            <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((it, idx) => (
                <div key={`${it.productId}-${it.variantId}`} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '1rem', padding: '1rem 1.15rem', borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--line)', alignItems: 'center' }}>
                  {/* Image */}
                  <div style={{ width: '80px', height: '64px', borderRadius: '10px', backgroundImage: `url(${it.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--line)', background: it.imageUrl ? undefined : 'var(--surface)' }} />

                  {/* Info */}
                  <div style={{ display: 'grid', gap: '0.35rem', minWidth: 0 }}>
                    <strong style={{ fontSize: '0.94rem', fontWeight: 600, lineHeight: 1.3 }}>{it.name}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>{fmt(it.price)}/cái</span>
                    <div style={{ display: 'flex', gap: '0', border: '1px solid var(--line)', borderRadius: '7px', overflow: 'hidden', width: 'fit-content', marginTop: '0.2rem' }}>
                      <button type="button" onClick={() => updateQty(it.productId, it.variantId, it.qty - 1)} style={{ width: '30px', height: '30px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem' }}>−</button>
                      <span style={{ width: '34px', textAlign: 'center', lineHeight: '30px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>{it.qty}</span>
                      <button type="button" onClick={() => updateQty(it.productId, it.variantId, it.qty + 1)} style={{ width: '30px', height: '30px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem' }}>+</button>
                    </div>
                  </div>

                  {/* Price + remove */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--accent-2)', fontWeight: 700 }}>{fmt(it.price * it.qty)}</strong>
                    <button type="button" onClick={() => removeItem(it.productId, it.variantId)} style={{ background: 'none', border: 'none', color: 'var(--muted-2)', cursor: 'pointer', fontSize: '0.78rem' }}>🗑 Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/store" className="link-inline" style={{ fontSize: '0.85rem' }}>← Tiếp tục mua sắm</Link>
        </div>

        <aside>
          <div className="surface-card">
            <SectionHeader title="Tóm tắt đơn" />
            <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.85rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Tạm tính</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Phí giao hàng</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: shipping === 0 ? 'var(--muted)' : undefined }}>{shipping === 0 ? '—' : fmt(shipping)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid var(--line)', marginTop: '0.25rem' }}>
                <strong>Tổng cộng</strong>
                <strong style={{ fontSize: '1.15rem', color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</strong>
              </div>
            </div>
            <div style={{ marginTop: '1.1rem' }}>
              <Btn disabled={items.length === 0} onClick={() => navigate('/checkout')} style={{ width: '100%' }}>
                Tiến hành thanh toán →
              </Btn>
            </div>
          </div>
          <div className="surface-card" style={{ marginTop: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              🔒 Thanh toán an toàn qua VNPay · Đổi trả trong 7 ngày
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
