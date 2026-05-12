import { Link } from 'react-router-dom'
import { Btn } from '../../shared/components/Ui'

export function OrderSuccessPage() {
  const orderId = `EN-${Date.now().toString().slice(-8)}`

  return (
    <div className="page-padding">
      <div className="page-narrow content-shell" style={{ paddingTop: '1.5rem' }}>
        <div
          className="surface-card"
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.75rem',
            borderColor: 'var(--accent-line)',
            background:
              'linear-gradient(180deg, rgb(34 197 94 / 6%), transparent 70%), var(--surface)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, rgb(34 197 94 / 22%), rgb(79 141 247 / 18%))',
              border: '1px solid rgb(34 197 94 / 35%)',
              fontSize: '1.5rem',
              color: '#86efac',
            }}
          >
            ✓
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Đặt hàng thành công
          </h1>
          <p style={{ margin: '0.65rem auto 0', color: 'var(--muted)', maxWidth: '460px' }}>
            Cảm ơn bạn đã mua hàng. Đơn hàng <strong style={{ color: 'var(--accent-2)' }}>#{orderId}</strong> đã được
            ghi nhận. Bạn sẽ nhận được email xác nhận trong vài phút.
          </p>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              background: 'rgb(255 255 255 / 2%)',
              textAlign: 'left',
              display: 'grid',
              gap: '0.55rem',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Mã đơn</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{orderId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Trạng thái</span>
              <span style={{ color: '#86efac', fontWeight: 600 }}>Đã ghi nhận</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Dự kiến giao</span>
              <span>3 – 5 ngày làm việc</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/profile/orders">
              <Btn>Xem đơn của tôi</Btn>
            </Link>
            <Link to="/store">
              <Btn variant="ghost">Tiếp tục mua sắm</Btn>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
