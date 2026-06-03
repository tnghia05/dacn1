import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Btn } from '../../shared/components/Ui'

export function OrderSuccessPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // COD flow: orderId passed via router state
  const stateOrderId = (location.state as { orderId?: string } | null)?.orderId

  // VNPay flow: query params appended by VNPay gateway
  const vnpResponseCode = searchParams.get('vnp_ResponseCode')
  const vnpTxnRef = searchParams.get('vnp_TxnRef') // this is orderCode e.g. OD20260601-000001

  const isVnpay = !!vnpResponseCode
  const isVnpaySuccess = vnpResponseCode === '00'
  const isPaid = !isVnpay || isVnpaySuccess

  const displayCode = stateOrderId ?? vnpTxnRef ?? '—'

  if (!isPaid) {
    return (
      <div className="page-padding">
        <div className="page-narrow content-shell" style={{ paddingTop: '1.5rem' }}>
          <div
            className="surface-card"
            style={{
              textAlign: 'center',
              padding: '2.5rem 1.75rem',
              borderColor: 'var(--line)',
              background:
                'linear-gradient(180deg, rgb(248 113 113 / 6%), transparent 70%), var(--surface)',
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
                background: 'rgb(248 113 113 / 12%)',
                border: '1px solid rgb(248 113 113 / 30%)',
                fontSize: '1.5rem',
                color: '#f87171',
              }}
            >
              ✕
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Thanh toán thất bại
            </h1>
            <p style={{ margin: '0.65rem auto 0', color: 'var(--muted)', maxWidth: '460px' }}>
              Giao dịch VNPay không thành công (mã {vnpResponseCode}). Đơn hàng vẫn được giữ lại —
              bạn có thể thử thanh toán lại.
            </p>
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
            Cảm ơn bạn đã mua hàng. Đơn hàng{' '}
            <strong style={{ color: 'var(--accent-2)' }}>#{displayCode}</strong> đã được ghi nhận.
            {isVnpay && ' Thanh toán VNPay đã được xác nhận.'}
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
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{displayCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Thanh toán</span>
              <span style={{ color: '#86efac', fontWeight: 600 }}>
                {isVnpay ? '✓ VNPay' : 'COD – khi nhận hàng'}
              </span>
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
