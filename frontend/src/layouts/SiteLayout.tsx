import type { FormEvent } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../shared/api/client'
import type { PaginatedResponse, Notification } from '../shared/api/types'

const mainNav = [
  { to: '/', label: 'Trang chủ' },
  { to: '/news', label: 'Tin tức' },
  { to: '/matches', label: 'Trận đấu' },
  { to: '/tournaments', label: 'Giải đấu' },
  { to: '/community', label: 'Cộng đồng' },
  { to: '/store', label: 'Cửa hàng' },
]

export function SiteLayout() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()
  const { totalCount } = useCart()

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => apiRequest<PaginatedResponse<Notification>>('/notifications?limit=20'),
    enabled: isLoggedIn,
    staleTime: 1000 * 60,
  })

  const unreadCount = notifData?.items.filter((n) => !n.read).length ?? 0

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const q = String(fd.get('q') ?? '').trim()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  async function handleLogout() {
    await logout()
    navigate('/auth/login')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" style={{ color: 'inherit' }}>
          <span className="brand-mark">EN</span>
          <div>
            <p className="brand-title">Esport Nexus</p>
            <p className="brand-subtitle">Cộng đồng</p>
          </div>
        </NavLink>

        <nav className="site-header-nav" aria-label="Điều hướng chính">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-actions">
          <form className="header-search" onSubmit={onSearch} role="search">
            <input name="q" type="search" placeholder="Tìm kiếm…" aria-label="Tìm kiếm" />
            <button type="submit" aria-label="Tìm">
              Tìm
            </button>
          </form>
          {isLoggedIn && (
            <NavLink to="/notifications" className="utility-link icon-link" aria-label="Thông báo" title="Thông báo">
              <span aria-hidden>🔔</span>
              {unreadCount > 0 && <span className="dot-indicator" aria-hidden />}
            </NavLink>
          )}
          <NavLink to="/cart" className="utility-link icon-link" aria-label="Giỏ hàng" title="Giỏ hàng">
            <span aria-hidden>🛒</span>
            {totalCount > 0 && <span className="badge-count" aria-hidden>{totalCount}</span>}
          </NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/profile" className="utility-link" aria-label="Hồ sơ">
                {user?.displayName ?? 'Hồ sơ'}
              </NavLink>
              <button type="button" className="utility-link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/auth/login" className="utility-link">
                Đăng nhập
              </NavLink>
              <NavLink to="/auth/register" className="utility-link">
                Đăng ký
              </NavLink>
            </>
          )}
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div>
          <h3>Esport Nexus</h3>
          <p>Nền tảng tin tức, lịch trận và cộng đồng dành cho người chơi và fan esports tại Việt Nam.</p>
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              X
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer">
              Discord
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
        </div>
        <div>
          <h4>Khám phá</h4>
          <p>
            <NavLink className="link-inline" to="/trending">
              Xu hướng
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/teams">
              Đội tuyển
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/players">
              Tuyển thủ
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/comparison">
              So sánh
            </NavLink>
          </p>
        </div>
        <div>
          <h4>Tài khoản</h4>
          <p>
            <NavLink className="link-inline" to="/profile/posts">
              Bài viết của tôi
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/profile/favorites">
              Yêu thích
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/profile/orders">
              Đơn hàng
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/profile/settings">
              Cài đặt
            </NavLink>
          </p>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <p>
            <NavLink className="link-inline" to="/cart">
              Giỏ hàng
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/notifications">
              Thông báo
            </NavLink>
            <br />
            <NavLink className="link-inline" to="/auth/register">
              Đăng ký
            </NavLink>
          </p>
          <p style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--muted-2)' }}>
            <NavLink className="link-inline" to="/admin/dashboard">
              Quản trị
            </NavLink>{' '}
            · © 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
