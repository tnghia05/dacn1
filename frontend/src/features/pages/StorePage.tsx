import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { Product, PaginatedResponse } from '../../shared/api/types'
import { IMG } from '../../shared/data/mock'
import { useCart } from '../../contexts/CartContext'
import { Badge, Btn, SectionHeader, Tabs } from '../../shared/components/Ui'

const categories = [
  { id: 'all', label: 'Tất cả' },
  { id: 'jersey', label: 'Áo đội' },
  { id: 'gear', label: 'Gear' },
  { id: 'acc', label: 'Phụ kiện' },
]

function fmtPrice(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function StorePage() {
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('featured')
  const [added, setAdded] = useState<string | null>(null)
  const { addItem } = useCart()

  const { data, isLoading } = useQuery({
    queryKey: ['products', cat, sort],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '24' })
      if (cat !== 'all') params.set('q', cat)
      if (sort === 'price-asc') params.set('sort', 'price_asc')
      if (sort === 'price-desc') params.set('sort', 'price_desc')
      return apiRequest<PaginatedResponse<Product>>(`/products?${params}`)
    },
  })

  const products = data?.items ?? []

  function handleAddToCart(p: Product) {
    addItem({ productId: p._id, name: p.name, price: p.price, imageUrl: p.imageUrl, qty: 1 })
    setAdded(p._id)
    setTimeout(() => setAdded(null), 1500)
  }

  return (
    <div className="page-padding content-shell">
      {/* Hero */}
      <section style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line)', backgroundImage: `url(${IMG.jersey})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '220px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgb(7 9 14 / 88%) 0%, rgb(7 9 14 / 50%) 60%, transparent 100%)' }} />
        <div style={{ position: 'relative', padding: '2rem', maxWidth: '520px' }}>
          <Badge tone="warn">Mới</Badge>
          <h1 style={{ margin: '0.6rem 0 0.5rem', fontSize: 'clamp(1.6rem, 2.6vw, 2rem)', letterSpacing: '-0.025em', fontWeight: 800 }}>Cửa hàng esports</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>Áo đội, gear chuyên dụng và phụ kiện chính hãng cho người chơi và fan.</p>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <Tabs tabs={categories} active={cat} onChange={setCat} />
        <select className="tab" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="featured">Sắp xếp: Nổi bật</option>
          <option value="price-asc">Giá: thấp đến cao</option>
          <option value="price-desc">Giá: cao đến thấp</option>
        </select>
      </div>

      <SectionHeader title="Sản phẩm" subtitle={data ? `${data.total} mẫu` : '…'} />

      {isLoading && (
        <div className="product-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="product-card" style={{ opacity: 0.3, minHeight: '260px' }} />)}
        </div>
      )}

      <div className="product-grid">
        {products.map((p) => (
          <div key={p._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to={`/store/${p._id}`} style={{ color: 'inherit', display: 'contents' }}>
              <div className="product-card-img" style={{ backgroundImage: `url(${p.imageUrl})` }}>
                {p.badge && <span className="product-badge">{p.badge}</span>}
                {p.stock === 0 && <span className="product-badge" style={{ background: 'rgb(100 100 100 / 90%)' }}>Hết hàng</span>}
              </div>
            </Link>
            <div className="product-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Link to={`/store/${p._id}`} style={{ color: 'inherit' }}>
                <strong style={{ lineHeight: 1.35 }}>{p.name}</strong>
              </Link>
              <span style={{ color: 'var(--accent-2)', fontWeight: 700, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                {fmtPrice(p.price)}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <Link to={`/store/${p._id}`} style={{ flex: 1 }}>
                  <Btn variant="ghost" style={{ width: '100%' }}>Chi tiết</Btn>
                </Link>
                <Btn
                  disabled={p.stock === 0}
                  onClick={() => handleAddToCart(p)}
                  style={{ background: added === p._id ? 'var(--accent)' : undefined }}
                >
                  {added === p._id ? '✓' : '+'}
                </Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && products.length === 0 && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Không có sản phẩm nào trong danh mục này.
        </div>
      )}
    </div>
  )
}
