import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, ApiError, getPresignedUrl, apiUpload } from '../../shared/api/client'
import type { Post, PaginatedResponse } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, Tabs } from '../../shared/components/Ui'
import { MemberBadge } from '../../shared/components/MemberBadge'
import { getTierFromPoints, TIER_CONFIG, TIER_THRESHOLDS, pointsToNextTier } from '../../shared/utils/membership'
import { VerifiedBadge } from '../../shared/components/VerifiedBadge'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

type ProfileStats = { postCount: number; commentCount: number; likeCount: number; savedCount: number }

export function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('posts')
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setSaveError('')
    try {
      const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type, 'avatar')
      await apiUpload(uploadUrl, file)
      setAvatarUrl(publicUrl)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Tải lên thất bại.')
    } finally {
      setIsUploading(false)
    }
  }

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => apiRequest<ProfileStats>('/users/me/stats'),
    enabled: !!user,
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['my-posts', tab],
    queryFn: () => {
      if (tab === 'posts') return apiRequest<PaginatedResponse<Post>>(`/users/${user?.id}/posts?limit=10`)
      if (tab === 'saved') return apiRequest<PaginatedResponse<Post>>('/posts?tab=saved&limit=10')
      return apiRequest<PaginatedResponse<Post>>(`/users/${user?.id}/posts?limit=10`)
    },
    enabled: !!user,
  })

  const updateProfile = useMutation({
    mutationFn: (payload: { displayName: string; avatarUrl: string }) =>
      apiRequest<any>('/users/me', { method: 'PATCH', body: payload }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
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

  const tier = getTierFromPoints(user.points ?? 0)
  const cfg = TIER_CONFIG[tier]
  const progressInfo = pointsToNextTier(user.points ?? 0)

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'center',
    padding: '2rem 2.2rem',
    borderRadius: '24px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    background: tier === 'vvip'
      ? 'linear-gradient(135deg, rgba(20, 10, 35, 0.95), rgba(40, 10, 25, 0.95)), radial-gradient(circle at 80% 20%, rgba(225, 29, 72, 0.25), transparent 40%)'
      : tier === 'svip'
        ? 'linear-gradient(135deg, rgba(30, 24, 10, 0.95), rgba(15, 12, 5, 0.95)), radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.2), transparent 45%)'
        : tier === 'vip'
          ? 'linear-gradient(135deg, rgba(10, 20, 40, 0.95), rgba(5, 10, 20, 0.95)), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15), transparent 45%)'
          : 'var(--surface)',
    border: tier === 'vvip'
      ? '1px solid rgba(225, 29, 72, 0.35)'
      : tier === 'svip'
        ? '1px solid rgba(251, 191, 36, 0.25)'
        : tier === 'vip'
          ? '1px solid rgba(59, 130, 246, 0.2)'
          : '1px solid var(--accent-line)',
    boxShadow: tier === 'vvip'
      ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(225, 29, 72, 0.15), inset 0 0 20px rgba(147, 51, 234, 0.1)'
      : tier === 'svip'
        ? '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(251, 191, 36, 0.1), inset 0 0 15px rgba(251, 191, 36, 0.05)'
        : tier === 'vip'
          ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(59, 130, 246, 0.08)'
          : 'var(--shadow)',
  }

  return (
    <div className="page-padding content-shell">
      {/* Profile card */}
      <div className="surface-card" style={cardStyle}>
        {/* Decorative backdrop glows and watermarks */}
        {tier === 'vvip' && (
          <>
            <div style={{
              position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px',
              borderRadius: '50%', background: 'linear-gradient(135deg, #e11d48, #9333ea)',
              filter: 'blur(80px)', opacity: 0.3, pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
              position: 'absolute', bottom: '-40px', left: '10%', width: '120px', height: '120px',
              borderRadius: '50%', background: '#9333ea',
              filter: 'blur(60px)', opacity: 0.15, pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
              position: 'absolute', right: '4%', bottom: '8%', fontSize: '7rem',
              opacity: 0.03, pointerEvents: 'none', transform: 'rotate(-15deg)', zIndex: 0,
              userSelect: 'none'
            }}>👑</div>
          </>
        )}
        {tier === 'svip' && (
          <>
            <div style={{
              position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px',
              borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              filter: 'blur(70px)', opacity: 0.22, pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
              position: 'absolute', right: '5%', bottom: '5%', fontSize: '6rem',
              opacity: 0.03, pointerEvents: 'none', transform: 'rotate(-10deg)', zIndex: 0,
              userSelect: 'none'
            }}>🔥</div>
          </>
        )}
        {tier === 'vip' && (
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px',
            borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            filter: 'blur(60px)', opacity: 0.18, pointerEvents: 'none', zIndex: 0
          }} />
        )}

        {/* Avatar with tier border */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px',
          background: 'var(--accent-soft)',
          border: cfg.avatarBorder,
          boxShadow: cfg.avatarShadow,
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 800, color: 'var(--accent-2)',
          transition: 'box-shadow 0.3s ease',
          zIndex: 1,
        }}>
          {editMode ? (
            avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : displayName[0]?.toUpperCase()
          ) : (
            user.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.displayName[0]?.toUpperCase()
          )}
        </div>
        <div style={{ flex: '1 1 240px', display: 'grid', gap: '0.35rem', zIndex: 1 }}>
          {editMode ? (
            <div style={{ display: 'grid', gap: '0.85rem', width: '100%', maxWidth: '480px' }}>
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên hiển thị</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--accent-line)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', fontWeight: 700 }} placeholder="Nhập tên hiển thị..." />
              </div>

              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ảnh đại diện (URL hoặc tải lên)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--accent-line)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} placeholder="Dán link ảnh hoặc tải lên..." />
                  <label style={{
                    padding: '0.55rem 1rem', borderRadius: '8px', background: 'var(--accent-soft)', border: '1.5px dashed var(--accent)',
                    color: 'var(--accent)', fontWeight: 600, fontSize: '0.88rem', cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s ease', opacity: isUploading ? 0.7 : 1
                  }}>
                    {isUploading ? '⌛ Đang tải...' : '📁 Tải từ máy'}
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Gallery */}
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoặc chọn avatar Premium 🌟</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                  {[
                    { name: 'Neon Cyber', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Holo Pad', url: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Synth Wave', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cyber City', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Trophy Win', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      style={{
                        width: '46px', height: '46px', borderRadius: '10px',
                        overflow: 'hidden', border: avatarUrl === p.url ? '2px solid var(--accent)' : '2px solid transparent',
                        padding: 0, cursor: 'pointer', background: 'none', transition: 'all 0.2s ease',
                        boxShadow: avatarUrl === p.url ? '0 0 10px var(--accent)' : 'none',
                        transform: avatarUrl === p.url ? 'scale(1.05)' : 'none',
                      }}
                      title={p.name}
                    >
                      <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem' }}>
                <Btn onClick={() => updateProfile.mutate({ displayName, avatarUrl })} disabled={updateProfile.isPending}>Lưu thay đổi</Btn>
                <Btn variant="ghost" onClick={() => { setEditMode(false); setDisplayName(user.displayName); setAvatarUrl(user.avatarUrl ?? '') }}>Hủy</Btn>
              </div>
            </div>
          ) : (
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={tier !== 'member' ? {
                background: cfg.gradient !== 'none' ? cfg.gradient : undefined,
                WebkitBackgroundClip: cfg.gradient !== 'none' ? 'text' : undefined,
                WebkitTextFillColor: cfg.gradient !== 'none' ? 'transparent' : cfg.nameCss,
                color: cfg.gradient !== 'none' ? 'transparent' : cfg.nameCss,
              } : {}}>@{user.displayName}</span>
               <MemberBadge points={user.points ?? 0} size="md" showLabel />
              {tier === 'vvip' && <VerifiedBadge size={18} />}
            </h1>
          )}
          {saveError && <p style={{ margin: 0, color: '#f87171', fontSize: '0.82rem' }}>{saveError}</p>}
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.86rem' }}>{user.email} · {user.role === 'admin' ? '👑 Admin' : TIER_CONFIG[tier].label}</p>
          {!editMode && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              <Btn variant="ghost" onClick={() => setEditMode(true)}>✏️ Sửa hồ sơ</Btn>
              <Link to="/orders"><Btn variant="ghost">📦 Đơn hàng</Btn></Link>
              <Link to="/points"><Btn variant="ghost">🏆 Điểm tích lũy</Btn></Link>
              <Link to="/settings"><Btn variant="ghost">⚙️ Cài đặt</Btn></Link>
              <Btn variant="ghost" onClick={handleLogout}>🚪 Đăng xuất</Btn>
            </div>
          )}
        </div>
      </div>

      {/* Weibo-Style VIP Card */}
      {tier !== 'member' && (
        <div style={{
          marginTop: '1.25rem',
          padding: '1.25rem 1.65rem',
          borderRadius: '20px',
          background: tier === 'vvip'
            ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.08), rgba(147, 51, 234, 0.08))'
            : tier === 'svip'
              ? 'rgba(251, 191, 36, 0.06)'
              : 'rgba(59, 130, 246, 0.05)',
          border: tier === 'vvip'
            ? '1.5px solid rgba(225, 29, 72, 0.25)'
            : tier === 'svip'
              ? '1.5px solid rgba(251, 191, 36, 0.2)'
              : '1.5px solid rgba(59, 130, 246, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Animated decorative gold light ray */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '5px',
            background: cfg.gradient !== 'none' ? cfg.gradient : cfg.color
          }} />

          <div style={{ display: 'grid', gap: '0.25rem', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{cfg.icon || '⭐'}</span>
              <h3 style={{
                margin: 0, fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: cfg.gradient !== 'none' ? cfg.gradient : undefined,
                WebkitBackgroundClip: cfg.gradient !== 'none' ? 'text' : undefined,
                WebkitTextFillColor: cfg.gradient !== 'none' ? 'transparent' : cfg.color,
                color: cfg.gradient !== 'none' ? 'transparent' : cfg.color,
              }}>
                HỘI VIÊN {cfg.label} ĐẲNG CẤP
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
              🌟 Đã mở khóa đặc quyền Weibo-Style: Tên màu Gradient, Viền Avatar phát sáng, Bình luận VIP và Bong bóng chat hoàng gia!
            </p>
          </div>

          <div style={{ zIndex: 1 }}>
            <Link to="/vip">
              <Btn style={{
                background: cfg.gradient !== 'none' ? cfg.gradient : cfg.color,
                border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.82rem',
                padding: '0.45rem 1rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer'
              }}>
                Xem quyền lợi
              </Btn>
            </Link>
          </div>
        </div>
      )}

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
        <Link to="/points" style={{ color: 'inherit' }}>
          <div className="kpi" style={{ cursor: 'pointer', borderColor: 'var(--accent-line)' }}>
            <p className="kpi-label">🏆 Điểm tích lũy</p>
            <p className="kpi-value" style={{ color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums' }}>
              {(user.points ?? 0).toLocaleString('vi-VN')}
            </p>
          </div>
        </Link>
      </div>

      {/* Membership upgrade card */}
      {progressInfo && (
        <div className="surface-card" style={{
          display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
          padding: '1.1rem 1.4rem',
          border: `1px solid ${cfg.color}40`,
          background: `${cfg.color}08`,
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <MemberBadge points={user.points ?? 0} size="sm" showLabel />
              {tier === 'member' && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>— Thành viên thường</span>}
            </div>
            <div style={{ height: '5px', borderRadius: '99px', background: 'var(--surface-2)', overflow: 'hidden', marginBottom: '0.35rem' }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                width: `${Math.min(100, ((user.points ?? 0) / TIER_THRESHOLDS[progressInfo.next]) * 100)}%`,
                background: TIER_CONFIG[progressInfo.next].gradient,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
              Còn <strong style={{ color: TIER_CONFIG[progressInfo.next].color }}>{progressInfo.needed.toLocaleString('vi-VN')} điểm</strong> nữa lên {TIER_CONFIG[progressInfo.next].label}
            </p>
          </div>
          <Link to="/vip">
            <Btn style={{ background: cfg.gradient !== 'none' ? cfg.gradient : cfg.color, color: tier === 'svip' ? '#000' : '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
              {tier === 'member' ? '✨ Nâng cấp VIP' : '🔮 Xem quyền lợi'}
            </Btn>
          </Link>
        </div>
      )}

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
            {[1, 2, 3].map(i => <div key={i} className="surface-card" style={{ height: '72px', opacity: 0.3 }} />)}
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
