import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IMG } from '../../shared/data/mock'
import { Btn } from '../../shared/components/Ui'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../shared/api/client'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('Bạn cần đồng ý với điều khoản để tiếp tục.'); return }
    setError('')
    setLoading(true)
    try {
      await register(email, password, displayName)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-padding content-shell">
      <div className="auth-split">
        <div className="auth-banner" style={{ backgroundImage: `url(${IMG.authSide})` }}>
          <div className="auth-banner-inner">
            <p className="eyebrow">Tham gia</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Tạo tài khoản để lưu hoạt động và tham gia thảo luận.
            </h2>
          </div>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <h1>Đăng ký</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>Mất chưa tới 1 phút.</p>
          {error && (
            <p style={{ margin: 0, color: '#f87171', fontSize: '0.88rem', padding: '0.6rem 0.85rem', background: 'rgb(248 113 113 / 10%)', borderRadius: '8px', border: '1px solid rgb(248 113 113 / 25%)' }}>
              {error}
            </p>
          )}
          <div className="field">
            <label htmlFor="name">Tên hiển thị</label>
            <input id="name" placeholder="Fan cứng VCS" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="ban@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pw">Mật khẩu</label>
            <input id="pw" type="password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--muted)' }}>
            <input type="checkbox" style={{ marginTop: '0.2rem' }} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              Tôi đồng ý với <Link to="/" className="link-inline">điều khoản</Link> và{' '}
              <Link to="/" className="link-inline">nội quy cộng đồng</Link>.
            </span>
          </label>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          </Btn>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
            Đã có tài khoản?{' '}
            <Link className="link-inline" to="/auth/login">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
