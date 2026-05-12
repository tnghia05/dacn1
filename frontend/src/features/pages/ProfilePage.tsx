import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { Post, PaginatedResponse } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, Tabs } from '../../shared/components/Ui'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

type ProfileStats = { postCount: number; commentCount: number; likeCount: number; savedCount: number }

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('posts')
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [saveError, setSaveError] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => apiRequest<ProfileStats>('/users/me/stats'),
    enabled: !!user,
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['my-posts', tab],
    queryFn: () => {
      if (tab === 'posts') return apiRequest<PaginatedResponse<Post>>('/posts/me?limit=10')
      if (tab === 'saved') return apiRequest<PaginatedResponse<Post>>('/posts/saved?limit=10')
      return apiRequest<PaginatedResponse<Post>>('/posts/me?limit=10')
    },
    enabled: !!user,
  })

  const updateProfile = useMutation({
    mutationFn: (name: string) => apiRequest('/users/me', { method: 'PATCH', body: { displayName: name } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      setEditMode(false)
      setSaveError('')
    },
    onError: (err) => setSaveError(err instanceof ApiError ? err.message : 'Lưu thất bại.'),
  })

  const posts = postsData?.items ?? []

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (!user) return (
    <div className="page-padding content-shell">
      <div className="surface-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>Bạn chưa đăng nhập.</p>
        <Link to="/auth/login"><Btn>Đăng nhập</Btn></Link>
      </div>
    </div>
  )

  return (
    <div className="page-padding content-shell">
      {/* Profile card */}
      <div className="surface-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', padding: '1.5rem 1.65rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--accent-soft)', border: '2px solid var(--accent-line)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-2)' }}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user.displayName[0]?.toUpperCase()
          }
        </div>
        <div style={{ flex: '1 1 240px', display: 'grid', gap: '0.35rem' }}>
          {editMode ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ flex: '1 1 180px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--accent-line)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', fontWeight: 700 }} />
              <Btn onClick={() => updateProfile.mutate(displayName)} disabled={updateProfile.isPending}>Lưu</Btn>
              <Btn variant="ghost" onClick={() => { setEditMode(false); setDisplayName(user.displayName) }}>Hủy</Btn>
            </div>
          ) : (
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>@{user.displayName}</h1>
          )}
          {saveError && <p style={{ margin: 0, color: '#f87171', fontSize: '0.82rem' }}>{saveError}</p>}
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.86rem' }}>{user.email} · {user.role === 'admin' ? '👑 Admin' : 'Thành viên'}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            <Btn variant="ghost" onClick={() => setEditMode(true)}>✏️ Sửa hồ sơ</Btn>
            <Link to="/orders"><Btn variant="ghost">📦 Đơn hàng</Btn></Link>
            <Link to="/settings"><Btn variant="ghost">⚙️ Cài đặt</Btn></Link>
            <Btn variant="ghost" onClick={handleLogout}>🚪 Đăng xuất</Btn>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Bài viết</p>
          <p className="kpi-value">{stats?.postCount ?? '—'}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Bình luận</p>
          <p className="kpi-value">{stats?.commentCount ?? '—'}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Lượt thích nhận</p>
          <p className="kpi-value" style={{ color: 'var(--accent-2)' }}>{stats?.likeCount ?? '—'}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Đã lưu</p>
          <p className="kpi-value">{stats?.savedCount ?? '—'}</p>
        </div>
      </div>

      {/* Posts/Saved tabs */}
      <section>
        <Tabs
          tabs={[
            { id: 'posts', label: 'Bài viết của tôi' },
            { id: 'saved', label: '🔖 Đã lưu' },
          ]}
          active={tab}
          onChange={setTab}
        />
        {postsLoading && (
          <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.75rem' }}>
            {[1,2,3].map(i => <div key={i} className="surface-card" style={{ height: '72px', opacity: 0.3 }} />)}
          </div>
        )}
        <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.75rem' }}>
          {posts.map(p => (
            <Link key={p._id} to={`/community/${p._id}`} className="surface-card" style={{ color: 'inherit', display: 'grid', gap: '0.3rem', padding: '0.9rem 1.1rem' }}>
              <strong style={{ fontSize: '0.94rem', fontWeight: 700 }}>{p.title}</strong>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--muted-2)' }}>
                <span>{timeAgo(p.createdAt)}</span>
                <span>❤️ {p.likeCount}</span>
                <span>💬 {p.commentCount}</span>
                {p.status === 'draft' && <span style={{ color: '#fb923c' }}>● Nháp</span>}
              </div>
            </Link>
          ))}
          {!postsLoading && posts.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '1.5rem', textAlign: 'center' }}>
              {tab === 'saved' ? 'Bạn chưa lưu bài nào.' : 'Bạn chưa có bài viết nào.'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
