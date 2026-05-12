import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IMG } from '../../shared/data/mock'
import { Btn } from '../../shared/components/Ui'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../shared/api/client'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Quá nhiều lần thử. Vui lòng thử lại sau.')
        } else {
          setError(err.message || 'Email hoặc mật khẩu không đúng.')
        }
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
            <p className="eyebrow">Esport Nexus</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Đăng nhập để đồng bộ hoạt động và theo dõi đội yêu thích.
            </h2>
          </div>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <h1>Đăng nhập</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
            Chào mừng trở lại — nhập email và mật khẩu của bạn.
          </p>
          {error && (
            <p style={{ margin: 0, color: '#f87171', fontSize: '0.88rem', padding: '0.6rem 0.85rem', background: 'rgb(248 113 113 / 10%)', borderRadius: '8px', border: '1px solid rgb(248 113 113 / 25%)' }}>
              {error}
            </p>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="ban@email.com"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pw">Mật khẩu</label>
            <input
              id="pw"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Btn>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Link className="link-inline" to="/auth/forgot-password">
              Quên mật khẩu?
            </Link>
            <Link className="link-inline" to="/auth/register">
              Tạo tài khoản
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
