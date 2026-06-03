import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import { useAuth } from '../../contexts/AuthContext'
import type { Post, PaginatedResponse } from '../../shared/api/types'
import { Btn, Tabs } from '../../shared/components/Ui'
import { MemberBadge } from '../../shared/components/MemberBadge'
import { VerifiedBadge } from '../../shared/components/VerifiedBadge'
import { getTierFromPoints, TIER_CONFIG } from '../../shared/utils/membership'

interface UserProfile {
  id: string
  displayName: string
  avatarUrl?: string
  role: string
  points: number
  createdAt: string
  postCount: number
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

type FollowUser = { id: string; displayName: string; avatarUrl?: string }

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts')

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery<UserProfile>({
    queryKey: ['user-profile', id],
    queryFn: () => apiRequest<UserProfile>(`/users/${id}`),
    enabled: !!id,
  })

  const { data: postsData, isLoading: isPostsLoading } = useQuery<PaginatedResponse<Post>>({
    queryKey: ['user-profile-posts', id],
    queryFn: () => apiRequest<PaginatedResponse<Post>>(`/users/${id}/posts?limit=30`),
    enabled: !!id && activeTab === 'posts',
  })

  const { data: followersData, isLoading: isFollowersLoading } = useQuery<{ items: FollowUser[] }>({
    queryKey: ['user-profile-followers', id],
    queryFn: () => apiRequest<{ items: FollowUser[] }>(`/users/${id}/followers?limit=100`),
    enabled: !!id && activeTab === 'followers',
  })

  const { data: followingData, isLoading: isFollowingLoading } = useQuery<{ items: FollowUser[] }>({
    queryKey: ['user-profile-following', id],
    queryFn: () => apiRequest<{ items: FollowUser[] }>(`/users/${id}/following?limit=100`),
    enabled: !!id && activeTab === 'following',
  })

  const followMutation = useMutation({
    mutationFn: () => apiRequest<{ following: boolean }>(`/users/${id}/follow`, { method: 'POST' }),
    onSuccess: () => {
      // Refresh stats and following state
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] })
      queryClient.invalidateQueries({ queryKey: ['user-profile-followers', id] })
    },
  })

  if (isProfileLoading) {
    return (
      <div className="page-padding content-shell" style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="page-padding content-shell">
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 1rem' }}>👤</p>
          <h3>Không tìm thấy thành viên</h3>
          <p>Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.</p>
          <Link to="/community" style={{ marginTop: '1rem', display: 'inline-block' }}>
            <Btn variant="ghost">Về cộng đồng</Btn>
          </Link>
        </div>
      </div>
    )
  }

  const tier = getTierFromPoints(profile.points ?? 0)
  const tierCfg = TIER_CONFIG[tier]
  const isSelf = currentUser?.id === profile.id

  // Styling properties
  const bannerBackground = tier === 'member'
    ? 'linear-gradient(135deg, #1e293b, #0f172a, #1e1b4b)'
    : tierCfg.gradient

  const vvvipTextStyle: React.CSSProperties = tier === 'vvip'
    ? {
        backgroundImage: tierCfg.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
      }
    : {}

  return (
    <div className="page-padding content-shell">
      {/* Profile Header Card */}
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--accent-line)' }}>
        {/* Banner Area */}
        <div style={{ height: '160px', background: bannerBackground, position: 'relative' }}>
          {tier !== 'member' && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <MemberBadge points={profile.points} size="lg" showLabel />
            </div>
          )}
        </div>

        {/* User Info Section */}
        <div style={{ padding: '0 2rem 2rem', position: 'relative', marginTop: '-50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Avatar container */}
            <div style={{ position: 'relative' }}>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    background: 'var(--bg)',
                    border: tierCfg.avatarBorder,
                    boxShadow: tierCfg.avatarShadow,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'var(--accent-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--accent-2)',
                    border: tierCfg.avatarBorder,
                    boxShadow: tierCfg.avatarShadow,
                  }}
                >
                  <span style={{ margin: 'auto' }}>{profile.displayName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {currentUser && !isSelf && (
                <Btn
                  variant={profile.isFollowing ? 'ghost' : 'primary'}
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                >
                  {profile.isFollowing ? '✓ Đang theo dõi' : '＋ Theo dõi'}
                </Btn>
              )}
              {isSelf && (
                <Link to="/profile">
                  <Btn variant="ghost">Chỉnh sửa hồ sơ</Btn>
                </Link>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ marginTop: '1.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={vvvipTextStyle}>{profile.displayName}</span>
              {profile.role === 'admin' && <VerifiedBadge size={20} title="Quản trị viên" />}
              {profile.role !== 'admin' && tier !== 'member' && <VerifiedBadge size={18} title="Thành viên VIP" />}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 1rem' }}>
              Tham gia ngày {new Date(profile.createdAt).toLocaleDateString('vi-VN')} • Vai trò: {profile.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <div style={{ textAlign: 'center', minWidth: '80px', padding: '0.85rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-line)' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{profile.postCount}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Bài viết</div>
              </div>
              <div
                onClick={() => setActiveTab('followers')}
                style={{ textAlign: 'center', minWidth: '80px', padding: '0.85rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-line)', cursor: 'pointer', transition: 'transform 0.2s' }}
                className="hover-scale"
              >
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{profile.followersCount}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Người theo dõi</div>
              </div>
              <div
                onClick={() => setActiveTab('following')}
                style={{ textAlign: 'center', minWidth: '80px', padding: '0.85rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-line)', cursor: 'pointer', transition: 'transform 0.2s' }}
                className="hover-scale"
              >
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{profile.followingCount}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Đang theo dõi</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: '80px', padding: '0.85rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-line)' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-2)' }}>{profile.points}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Điểm tích lũy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <Tabs
        tabs={[
          { id: 'posts', label: 'Bài viết' },
          { id: 'followers', label: 'Người theo dõi' },
          { id: 'following', label: 'Đang theo dõi' },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      <div style={{ marginTop: '1.5rem' }}>
        {/* Tab: Posts */}
        {activeTab === 'posts' && (
          <div>
            {isPostsLoading ? (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {[1, 2].map((i) => <div key={i} className="surface-card" style={{ height: '80px', opacity: 0.3 }} />)}
              </div>
            ) : postsData?.items && postsData.items.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {postsData.items.map((post) => (
                  <Link
                    key={post._id}
                    to={`/community/${post._id}`}
                    className="surface-card hover-glow"
                    style={{ color: 'inherit', textDecoration: 'none', display: 'block', padding: '1.25rem' }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{post.title}</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      <span>🗓️ {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>❤️ {post.likeCount} lượt thích</span>
                      <span>💬 {post.commentCount} bình luận</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <p style={{ fontSize: '2rem', margin: 0 }}>📝</p>
                <p style={{ margin: '0.5rem 0 0' }}>Chưa có bài viết nào.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Followers */}
        {activeTab === 'followers' && (
          <div>
            {isFollowersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="loading-spinner" />
              </div>
            ) : followersData?.items && followersData.items.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {followersData.items.map((u) => (
                  <Link
                    key={u.id}
                    to={`/users/${u.id}`}
                    className="surface-card hover-glow"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', color: 'inherit', textDecoration: 'none' }}
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.displayName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-2)' }}>
                        {u.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Xem hồ sơ</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <p style={{ fontSize: '2rem', margin: 0 }}>👥</p>
                <p style={{ margin: '0.5rem 0 0' }}>Chưa có người theo dõi nào.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Following */}
        {activeTab === 'following' && (
          <div>
            {isFollowingLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="loading-spinner" />
              </div>
            ) : followingData?.items && followingData.items.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {followingData.items.map((u) => (
                  <Link
                    key={u.id}
                    to={`/users/${u.id}`}
                    className="surface-card hover-glow"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', color: 'inherit', textDecoration: 'none' }}
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.displayName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-2)' }}>
                        {u.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Xem hồ sơ</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <p style={{ fontSize: '2rem', margin: 0 }}>👣</p>
                <p style={{ margin: '0.5rem 0 0' }}>Chưa theo dõi ai.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
