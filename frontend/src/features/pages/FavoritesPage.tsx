import { Link } from 'react-router-dom'
import { mockProducts } from '../../shared/data/mock'
import { Btn, SectionHeader } from '../../shared/components/Ui'

export function FavoritesPage() {
  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tài khoản</p>
        <h1>Sản phẩm yêu thích</h1>
        <p>Lưu lại sản phẩm để mua sau, hoặc thêm vào giỏ ngay.</p>
      </section>

      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <SectionHeader title="Đã lưu" subtitle={`${mockProducts.length} sản phẩm`} />
        <Link to="/cart">
          <Btn variant="ghost">Xem giỏ hàng</Btn>
        </Link>
      </div>

      <div className="product-grid">
        {mockProducts.map((p) => (
          <Link key={p.id} to="/store/detail" className="product-card" style={{ color: 'inherit' }}>
            <div className="product-card-img" style={{ backgroundImage: `url(${p.image})` }} />
            <div className="product-card-body">
              <strong>{p.name}</strong>
              <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}>{p.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
