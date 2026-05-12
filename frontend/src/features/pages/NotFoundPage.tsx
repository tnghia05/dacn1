import { Link } from 'react-router-dom'
import { Btn } from '../../shared/components/Ui'

export function NotFoundPage() {
  return (
    <div className="page-padding">
      <div
        className="surface-card"
        style={{
          maxWidth: '480px',
          margin: '3rem auto',
          padding: '2.5rem 1.75rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '4.5rem',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
        >
          404
        </p>
        <h1 style={{ margin: '0.85rem 0 0.5rem', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Trang không tồn tại
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Đường dẫn bạn truy cập không có hoặc đã bị xoá.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/">
            <Btn>Về trang chủ</Btn>
          </Link>
          <Link to="/search">
            <Btn variant="ghost">Tìm kiếm</Btn>
          </Link>
        </div>
      </div>
    </div>
  )
}
