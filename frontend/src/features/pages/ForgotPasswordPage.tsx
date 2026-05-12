import { Link } from 'react-router-dom'
import { Btn } from '../../shared/components/Ui'

export function ForgotPasswordPage() {
  return (
    <div className="page-padding content-shell">
      <div className="surface-card" style={{ maxWidth: '440px', margin: '2rem auto', padding: '1.75rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Quên mật khẩu</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Nhập email tài khoản — chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
        </p>
        <form
          className="section-stack"
          style={{ gap: '0.85rem', marginTop: '1rem' }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="ban@email.com" />
          </div>
          <Btn type="submit">Gửi link khôi phục</Btn>
          <Link className="link-inline" to="/auth/login" style={{ fontSize: '0.85rem' }}>
            ← Quay lại đăng nhập
          </Link>
        </form>
      </div>
    </div>
  )
}
