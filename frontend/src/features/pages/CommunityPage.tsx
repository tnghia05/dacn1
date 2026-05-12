import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { HotTopicsResponse, Post, PaginatedResponse } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, SectionHeader, Tabs } from '../../shared/components/Ui'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}


function getRatiosFromTrend(trend: HotTopicsResponse['items'][number]['trend']) {
  const out = {
    pos: 0,
    neg: 0,
    neu: 0,
    toxic: 0,
    toxicRatio: 0,
  }

  if (!trend) return out

  const sample = Number(trend.sampleCount) || 0
  if (sample > 0) out.toxicRatio = (Number(trend.toxicCount) || 0) / sample

  // Prefer avg probabilities if available, else fallback to raw counts.
  const avg = trend.sentiment4Avg
  const cnt = trend.sentiment4
  if (avg && typeof avg === 'object') {
    out.pos = Number(avg.positive ?? 0) || 0
    out.neg = Number(avg.negative ?? 0) || 0
    out.neu = Number(avg.neutral ?? 0) || 0
    out.toxic = Number(avg.toxic ?? 0) || 0
    return out
  }

  if (cnt && typeof cnt === 'object') {
    const pos = Number((cnt as any).positive ?? 0) || 0
    const neg = Number((cnt as any).negative ?? 0) || 0
    const neu = Number((cnt as any).neutral ?? 0) || 0
    const toxic = Number((cnt as any).toxic ?? 0) || 0
    const total = pos + neg + neu + toxic
    if (total > 0) {
      out.pos = pos / total
      out.neg = neg / total
      out.neu = neu / total
      out.toxic = toxic / total
    }
  }

  return out
}

function sentimentBadge(trend: HotTopicsResponse['items'][number]['trend']) {
  const { pos, neg, toxicRatio } = getRatiosFromTrend(trend)

  if (toxicRatio >= 0.2 || neg - pos >= 0.15) {
    return { emoji: '😡', label: 'Tranh cãi', color: 'rgba(244, 63, 94, 0.95)' } // rose-500
  }
  if (pos - neg >= 0.15) {
    return { emoji: '😄', label: 'Tích cực', color: 'rgba(34, 197, 94, 0.95)' } // green-500
  }
  return { emoji: '😐', label: 'Trung lập', color: 'rgba(148, 163, 184, 0.95)' } // slate-400
}


const TABS = [
  { id: 'hot', label: '🔥 Nổi bật' },
  { id: 'latest', label: '🆕 Mới nhất' },
  { id: 'top', label: '⭐ Hàng đầu' },
]

const TREND_WINDOWS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 ngày' },
]

export function CommunityPage() {
  const [feed, setFeed] = useState<'hot' | 'latest' | 'top'>('hot')
  const [trendWindow, setTrendWindow] = useState<'24h' | '7d'>('24h')
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['posts', feed],
    queryFn: () => apiRequest<PaginatedResponse<Post>>(`/posts?tab=${feed}&limit=20`),
  })

  const {
    data: hotTopicsData,
    isLoading: hotTopicsLoading,
    isError: hotTopicsError,
    refetch: refetchHotTopics,
    isFetching: hotTopicsFetching,
  } = useQuery({
    queryKey: ['hashtags', 'hot-topics', trendWindow],
    queryFn: () =>
      apiRequest<HotTopicsResponse>(`/hashtags/hot-topics?window=${trendWindow}&limit=8`),
    staleTime: 60_000,
  })

  const toggleLike = useMutation({
    mutationFn: (postId: string) => apiRequest<{ liked: boolean }>(`/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  const posts = data?.items ?? []

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Diễn đàn</p>
        <h1>Cộng đồng</h1>
        <p>Thảo luận, dự đoán, phân tích — chia sẻ với người chơi cùng tựa game.</p>
      </section>

      <div className="two-col">
        <div className="section-stack">
          {/* Composer */}
          <div className="surface-card" style={{ padding: '1.1rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                {isLoggedIn ? '✍️' : '👤'}
              </div>
              <button
                type="button"
                onClick={() => isLoggedIn ? navigate('/community/create') : navigate('/auth/login')}
                style={{ flex: 1, textAlign: 'left', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px', padding: '0.6rem 1rem', color: 'var(--muted)', fontSize: '0.92rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                {isLoggedIn ? 'Bạn đang nghĩ gì? Tạo bài viết…' : 'Đăng nhập để tạo bài viết…'}
              </button>
              <Btn onClick={() => isLoggedIn ? navigate('/community/create') : navigate('/auth/login')}>
                Đăng bài
              </Btn>
            </div>
          </div>

          {/* Feed tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
            <Tabs tabs={TABS} active={feed} onChange={(id) => setFeed(id as typeof feed)} />
            {data && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{data.total} bài</span>}
          </div>

          {/* Skeleton */}
          {isLoading && (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {[1,2,3].map(i => <div key={i} className="surface-card" style={{ height: '110px', opacity: 0.35 }} />)}
            </div>
          )}

          {/* Posts */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {posts.map((p) => (
              <article key={p._id} className="surface-card" style={{ padding: '1.1rem 1.25rem', display: 'grid', gap: '0.6rem' }}>
                {/* Author row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-soft)', flexShrink: 0, overflow: 'hidden' }}>
                    {p.author.avatarUrl
                      ? <img src={p.author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-2)' }}>{p.author.displayName[0]?.toUpperCase()}</div>
                    }
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>@{p.author.displayName}</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--muted-2)', marginLeft: 'auto' }}>{timeAgo(p.createdAt)}</span>
                </div>

                {/* Content */}
                <Link to={`/community/${p._id}`} style={{ color: 'inherit', display: 'block' }}>
                  {p.thumbnailUrl && (
                    <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/7', backgroundImage: `url(${p.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '0.65rem' }} />
                  )}
                  <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.35, display: 'block' }}>{p.title}</strong>
                  {p.content && (
                    <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.content}
                    </p>
                  )}
                </Link>

                {/* Tags */}
                {p.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {p.tags.map((t) => <span key={t} className="stat-pill">#{t}</span>)}
                  </div>
                )}

                {/* Actions bar */}
                <div style={{ paddingTop: '0.7rem', borderTop: '1px solid var(--line)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => isLoggedIn && toggleLike.mutate(p._id)}
                    style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', background: 'none', border: 'none', cursor: isLoggedIn ? 'pointer' : 'default', color: p.likedByMe ? 'var(--accent-2)' : 'var(--muted)', fontSize: '0.84rem', padding: 0 }}
                  >
                    <span>{p.likedByMe ? '❤️' : '🤍'}</span>
                    <span>{p.likeCount}</span>
                  </button>
                  <Link to={`/community/${p._id}`} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', color: 'var(--muted)', fontSize: '0.84rem' }}>
                    <span>💬</span>
                    <span>{p.commentCount}</span>
                  </Link>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-2)', marginLeft: 'auto' }}>👁 {p.viewCount}</span>
                </div>
              </article>
            ))}
          </div>
          {!isLoading && posts.length === 0 && (
            <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>Chưa có bài viết nào.</div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="section-stack">
          <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem 0.6rem', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, flex: 1 }}>🔥 Hot Search</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {TREND_WINDOWS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setTrendWindow(w.id as '24h' | '7d')}
                    style={{
                      fontSize: '0.66rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 4,
                      border: '1px solid var(--line)',
                      background: trendWindow === w.id ? 'var(--accent)' : 'transparent',
                      color: trendWindow === w.id ? '#fff' : 'var(--muted)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiRequest('/hashtags/hot-topics/refresh', { method: 'POST' })
                  } catch {
                    // ignore — still refetch cached data
                  }
                  await refetchHotTopics()
                }}
                title="Làm mới"
                disabled={hotTopicsFetching}
                style={{ background: 'none', border: 'none', cursor: hotTopicsFetching ? 'default' : 'pointer', color: 'var(--muted)', fontSize: '0.9rem', padding: '0.1rem 0.25rem', lineHeight: 1 }}
              >
                <span className={hotTopicsFetching ? 'spin' : undefined}>↻</span>
              </button>
            </div>

            {/* List */}
            {hotTopicsLoading ? (
              <ul style={{ margin: 0, padding: '0.5rem 0', listStyle: 'none', display: 'grid' }}>
                {[1, 2, 3, 5, 6, 7, 8].map((i) => (
                  <li key={i} style={{ height: '2.4rem', margin: '0 1rem 0.3rem', borderRadius: 6, background: 'var(--line)', opacity: 0.3 }} />
                ))}
              </ul>
            ) : hotTopicsError ? (
              <p style={{ padding: '1rem', margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>Không tải được. Thử làm mới.</p>
            ) : (hotTopicsData?.items?.length ?? 0) === 0 ? (
              <p style={{ padding: '1rem', margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                Chưa có hashtag nổi trong {trendWindow === '24h' ? '24h' : '7 ngày'}.<br />Đăng bài kèm tag để cộng đồng bàn luận.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: '0.35rem 0', listStyle: 'none' }}>
                {hotTopicsData!.items.map((item, idx) => {
                  const rank = idx + 1
                  const rankColor = rank === 1 ? '#ff3b30' : rank === 2 ? '#ff6b35' : rank === 3 ? '#ff9500' : 'var(--muted)'
                  const label = item.tag.replace(/^#/, '')
                  const searchHref = `/search?tag=${encodeURIComponent(label)}&scope=posts`
                  const discuss = item.components.discuss
                  const score = discuss >= 1000 ? `${(discuss / 1000).toFixed(1)}k` : String(discuss)
                  const toxicRate = item.trend ? (item.trend.toxicCount / Math.max(item.trend.sampleCount, 1)) : 0
                  const badge = sentimentBadge(item.trend)
                  const isHot = item.hotness >= 7
                  const isToxicSpike = toxicRate > 0.2
                  const velocity = item.components.velocityScore ?? 1
                  const velArrow = velocity >= 1.5 ? { icon: '↑', color: '#22c55e' }
                    : velocity >= 1.15 ? { icon: '↗', color: '#86efac' }
                    : velocity <= 0.7 ? { icon: '↓', color: 'var(--muted)' }
                    : null
                  return (
                    <li key={item.tag}>
                      <Link
                        to={searchHref}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 1rem',
                          textDecoration: 'none',
                          color: 'var(--text)',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Rank + velocity */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', minWidth: 26 }}>
                          <span style={{
                            fontSize: rank <= 3 ? '0.95rem' : '0.82rem',
                            fontWeight: 800,
                            fontVariantNumeric: 'tabular-nums',
                            color: rankColor,
                            lineHeight: 1,
                          }}>
                            {rank}
                          </span>
                          {velArrow && (
                            <span style={{ fontSize: '0.6rem', color: velArrow.color, lineHeight: 1 }}>{velArrow.icon}</span>
                          )}
                        </span>
                        {/* Name */}
                        <span style={{ flex: 1, fontSize: '0.86rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          #{label}
                        </span>
                        {/* Score */}
                        {discuss > 0 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                            {score}
                          </span>
                        )}
                        {/* Badge */}
                        {isToxicSpike ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#ef4444', flexShrink: 0 }}>⚠</span>
                        ) : isHot ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(255,107,53,0.15)', color: '#ff6b35', flexShrink: 0 }}>热</span>
                        ) : item.trend ? (
                          <span style={{ fontSize: '0.68rem', color: badge.color, flexShrink: 0 }}>{badge.emoji}</span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/trending" style={{ fontSize: '0.78rem', color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Xem đầy đủ bảng hot search <span style={{ fontSize: '0.7rem' }}>›</span>
              </Link>
              {hotTopicsData?.updatedAt && (
                <span style={{ fontSize: '0.68rem', color: 'var(--muted-2)' }}>{timeAgo(hotTopicsData.updatedAt)}</span>
              )}
            </div>
          </div>

          <div className="surface-card">
            <SectionHeader title="Top thành viên" subtitle="Tuần này" />
            <ol style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem' }}>
              {[{ name: 'FanZone_VN', score: '12.4k' }, { name: 'StatsNerd', score: '9.1k' }, { name: 'RiverMain', score: '8.6k' }, { name: 'Analyst_VN', score: '6.2k' }].map((m, i) => (
                <li key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                  <span style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--muted-2)', fontWeight: 700, width: '20px', fontVariantNumeric: 'tabular-nums' }}>#{i + 1}</span>
                    <strong style={{ fontWeight: 600 }}>@{m.name}</strong>
                  </span>
                  <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem' }}>{m.score}</span>
                </li>
              ))}
            </ol>
          </div>

          {isLoggedIn && (
            <Link to="/community/create" style={{ display: 'block' }}>
              <div className="surface-card" style={{ textAlign: 'center', padding: '1.25rem', cursor: 'pointer', borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>✍️ Tạo bài viết mới</p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>Chia sẻ góc nhìn của bạn</p>
              </div>
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}
