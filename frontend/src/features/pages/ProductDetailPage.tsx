import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { Product, ProductVariant } from '../../shared/api/types'
import { useCart } from '../../contexts/CartContext'
import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'

function fmtPrice(n: number) { return n.toLocaleString('vi-VN') + ' ₫' }

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiRequest<Product>(`/products/${id}`),
    enabled: !!id,
  })

  const { data: variants } = useQuery({
    queryKey: ['product-variants', id],
    queryFn: () => apiRequest<{ items: ProductVariant[] }>(`/products/${id}/variants`),
    enabled: !!id,
  })

  const variantList = Array.isArray(variants) ? variants : (variants as { items?: ProductVariant[] })?.items ?? []

  // Auto-select first variant
  if (variantList.length > 0 && !selectedVariant) {
    setSelectedVariant(variantList[0])
  }

  if (isLoading) return (
    <div className="page-padding content-shell">
      {[1,2].map(i => <div key={i} className="surface-card" style={{ height: '200px', opacity: 0.3, marginBottom: '1rem' }} />)}
    </div>
  )

  if (isError || !product) return (
    <div className="page-padding content-shell">
      <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
        <p>Không tìm thấy sản phẩm.</p>
        <Link to="/store" className="link-inline">← Về cửa hàng</Link>
      </div>
    </div>
  )

  const p = product
  const images = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : []
  const price = selectedVariant ? selectedVariant.price : p.price
  const inStock = selectedVariant ? selectedVariant.stock > 0 : (p.stock ?? 1) > 0

  function handleAddToCart() {
    addItem({
      productId: p._id,
      variantId: selectedVariant?._id,
      name: p.name + (selectedVariant ? ` (${selectedVariant.name})` : ''),
      price,
      imageUrl: images[0],
      qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="page-padding content-shell">
      <Link to="/store" className="link-inline" style={{ fontSize: '0.84rem' }}>← Cửa hàng</Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }} className="product-detail-grid">
        {/* Images */}
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ borderRadius: 'var(--r-lg)', aspectRatio: '4/3', backgroundImage: `url(${images[activeImg]})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--line)' }} />
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: '72px', height: '54px', borderRadius: '8px', backgroundImage: `url(${img})`, backgroundSize: 'cover', border: `2px solid ${i === activeImg ? 'var(--accent)' : 'var(--line)'}`, cursor: 'pointer' }} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {product.game && <Badge tone="warn">{product.game.toUpperCase()}</Badge>}
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>{product.name}</h1>
          <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {fmtPrice(price)}
          </p>
          {product.description && <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{product.description}</p>}

          {/* Variants */}
          {variantList.length > 0 && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>Phiên bản:</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {variantList.map(v => (
                  <button key={v._id} type="button" onClick={() => setSelectedVariant(v)}
                    style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: `1.5px solid ${selectedVariant?._id === v._id ? 'var(--accent)' : 'var(--line)'}`, background: selectedVariant?._id === v._id ? 'var(--accent-soft)' : 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, opacity: v.stock === 0 ? 0.4 : 1 }}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>Số lượng:</p>
            <div style={{ display: 'flex', gap: '0', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
              <button type="button" onClick={() => setQty(q => Math.max(1, q-1))} style={{ width: '36px', height: '36px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '1.1rem' }}>−</button>
              <span style={{ width: '40px', textAlign: 'center', lineHeight: '36px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
              <button type="button" onClick={() => setQty(q => q+1)} style={{ width: '36px', height: '36px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '1.1rem' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Btn disabled={!inStock} onClick={handleAddToCart} style={{ background: added ? 'var(--accent)' : undefined }}>
              {added ? '✓ Đã thêm' : inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
            </Btn>
            {added && <Btn variant="ghost" onClick={() => navigate('/cart')}>Xem giỏ hàng →</Btn>}
          </div>

          {inStock ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>✓ Còn hàng · Giao 2–4 ngày</p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#f87171' }}>✕ Hết hàng</p>
          )}
        </div>
      </div>

      {/* Reviews placeholder */}
      <section className="surface-card">
        <SectionHeader title="Đánh giá sản phẩm" />
        <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
      </section>
    </div>
  )
}
