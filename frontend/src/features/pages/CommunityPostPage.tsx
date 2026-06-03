import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { Post, Comment, PaginatedResponse } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, SectionHeader } from '../../shared/components/Ui'
import { MemberBadge } from '../../shared/components/MemberBadge'
import { getTierFromPoints, TIER_CONFIG } from '../../shared/utils/membership'
import { CommentDigestPanel } from '../../shared/components/CommentDigestPanel'

function getPointsForAuthor(authorId: string, customPoints?: number): number {
  if (customPoints !== undefined) return customPoints
  let hash = 0
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const positiveHash = Math.abs(hash)
  const pct = positiveHash % 100
  if (pct < 8) return 5500  // VVIP
  if (pct < 20) return 2400 // SVIP
  if (pct < 45) return 850  // VIP
  return 150                // Member
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

function getAuthorName(
  c: { author?: { displayName: string } | null; authorId: string },
  currentUser: { id: string; displayName: string } | null,
) {
  if (c.author?.displayName) return c.author.displayName
  if (currentUser && c.authorId === currentUser.id) return currentUser.displayName
  return c.authorId.slice(-6)
}

function highlightEntities(content: string, entities?: { text: string; type: string }[]) {
  if (!entities || entities.length === 0) return <span>{content}</span>

  const escapedEntities = entities
    .map(e => e.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .filter(Boolean)

  if (escapedEntities.length === 0) return <span>{content}</span>

  const regex = new RegExp(`(${escapedEntities.join('|')})`, 'gi')
  const parts = content.split(regex)

  return (
    <>
      {parts.map((part, idx) => {
        const matchingEntity = entities.find(
          e => e.text.toLowerCase() === part.toLowerCase()
        )
        if (matchingEntity) {
          let toneColor = 'var(--accent-2)' // PLAYER
          if (matchingEntity.type === 'TEAM') toneColor = '#3b82f6'
          if (matchingEntity.type === 'TOURNAMENT') toneColor = '#fbbf24'

          return (
            <span
              key={idx}
              title={`Thực thể AI: ${matchingEntity.type}`}
              style={{
                borderBottom: `2px dashed ${toneColor}`,
                color: toneColor,
                fontWeight: 600,
                cursor: 'help',
                padding: '0 2px',
                borderRadius: '2px',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {part}
            </span>
          )
        }
        return part
      })}
    </>
  )
}

export function CommunityPostPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [showAiInsights, setShowAiInsights] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editError, setEditError] = useState('')
  // AI moderation toast: idle | scanning | approved | reviewing
  const [aiToastState, setAiToastState] = useState<'idle' | 'scanning' | 'approved' | 'reviewing'>('idle')

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => apiRequest<Post>(`/posts/${id}`),
    enabled: !!id,
  })

  const { data: commentsData } = useQuery({
    queryKey: ['post-comments', id],
    queryFn: () => apiRequest<PaginatedResponse<Comment>>(`/posts/${id}/comments?limit=50`),
    enabled: !!id,
  })

  const toggleLike = useMutation({
    mutationFn: () => apiRequest<{ liked: boolean }>(`/posts/${id}/like`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  const toggleSave = useMutation({
    mutationFn: () => apiRequest<{ saved: boolean }>(`/posts/${id}/save`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  const deletePost = useMutation({
    mutationFn: () => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => navigate('/community'),
  })

  const postComment = useMutation({
    mutationFn: (content: string) => apiRequest<Comment>(`/posts/${id}/comments`, { method: 'POST', body: { content } }),
    onMutate: () => {
      setAiToastState('scanning')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', id] })
      qc.invalidateQueries({ queryKey: ['post', id] })
      setCommentText('')
      setCommentError('')
      setTimeout(() => {
        setAiToastState('approved')
        setTimeout(() => setAiToastState('idle'), 3000)
      }, 1400)
    },
    onError: (err) => {
      setAiToastState('idle')
      const msg = err instanceof ApiError ? err.message : 'Gửi thất bại.'
      // Ban error — backend trả 403 + message chứa "đã bị khóa"
      setCommentError(msg)
    },
  })

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => apiRequest<{ ok: boolean }>(`/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', id] })
      qc.invalidateQueries({ queryKey: ['post', id] })
    },
  })

  const editComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      apiRequest<Comment>(`/comments/${commentId}`, { method: 'PATCH', body: { content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', id] })
      qc.invalidateQueries({ queryKey: ['post', id] })
      setEditingCommentId(null)
      setEditingText('')
      setEditError('')
    },
    onError: (err) => {
      setEditError(err instanceof ApiError ? err.message : 'Sửa bình luận thất bại.')
    },
  })

  async function onPostComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    postComment.mutate(commentText.trim())
  }

  if (isLoading) return (
    <div className="page-padding"><div className="page-narrow content-shell">
      {[1, 2, 3].map(i => <div key={i} className="surface-card" style={{ height: '80px', opacity: 0.3, marginBottom: '1rem' }} />)}
    </div></div>
  )

  if (isError || !post) return (
    <div className="page-padding"><div className="page-narrow content-shell">
      <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
        <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }}>💬</p>
        <p>Không tìm thấy bài viết.</p>
        <Link to="/community" className="link-inline">← Về cộng đồng</Link>
      </div>
    </div></div>
  )

  const comments = commentsData?.items ?? []
  const isOwner = user?.id === post.authorId

  return (
    <div className="page-padding">
      <div className="page-narrow content-shell">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.82rem' }}>
          <Link to="/community" className="link-inline">← Cộng đồng</Link>
          {post.game && <><span style={{ color: 'var(--muted-2)' }}>·</span><span className="stat-pill">{post.game.toUpperCase()}</span></>}
          {post.tags.slice(0, 3).map(t => <span key={t} className="stat-pill">#{t}</span>)}
        </div>

        {/* Header */}
        <header style={{ display: 'grid', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.45rem, 2.6vw, 1.95rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {(() => {
              const authorPoints = getPointsForAuthor(post.authorId, post.authorId === user?.id ? user?.points : undefined)
              const authorTier = getTierFromPoints(authorPoints)
              const authorCfg = TIER_CONFIG[authorTier]
              return (
                <>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: 'var(--accent-soft)', overflow: 'hidden', flexShrink: 0,
                    border: authorCfg.avatarBorder,
                    boxShadow: authorCfg.avatarShadow,
                  }}>
                    {post.author?.avatarUrl
                      ? <img src={post.author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-2)' }}>{post.author?.displayName?.[0]?.toUpperCase()}</div>
                    }
                  </div>
                  <strong style={{
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    background: authorCfg.gradient !== 'none' ? authorCfg.gradient : undefined,
                    WebkitBackgroundClip: authorCfg.gradient !== 'none' ? 'text' : undefined,
                    WebkitTextFillColor: authorCfg.gradient !== 'none' ? 'transparent' : authorCfg.nameCss,
                    color: authorCfg.gradient !== 'none' ? 'transparent' : authorCfg.nameCss,
                  }}>@{post.author?.displayName}</strong>
                  <MemberBadge points={authorPoints} size="sm" showLabel />
                  {authorTier === 'vvip' && <span title="Tài khoản xác minh" style={{ fontSize: '0.85rem' }}>✅</span>}
                </>
              )
            })()}
            <span style={{ color: 'var(--muted-2)', fontSize: '0.8rem' }}>·</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{timeAgo(post.createdAt)}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted-2)', marginLeft: 'auto' }}>👁 {post.viewCount}</span>
          </div>
        </header>

        {/* Thumbnail */}
        {post.thumbnailUrl && (
          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '16/9', backgroundImage: `url(${post.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}

        {/* Body */}
        <div style={{ fontSize: '1rem', lineHeight: 1.8, color: '#d6d9e0', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => isLoggedIn ? toggleLike.mutate() : navigate('/auth/login')}
            style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: post.likedByMe ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${post.likedByMe ? 'var(--accent-line)' : 'var(--line)'}`, borderRadius: '8px', padding: '0.4rem 0.85rem', cursor: 'pointer', color: post.likedByMe ? 'var(--accent-2)' : 'var(--muted)', fontSize: '0.88rem', fontWeight: 600 }}
          >
            {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
          </button>
          <button
            type="button"
            onClick={() => isLoggedIn ? toggleSave.mutate() : navigate('/auth/login')}
            style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: post.savedByMe ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${post.savedByMe ? 'var(--accent-line)' : 'var(--line)'}`, borderRadius: '8px', padding: '0.4rem 0.85rem', cursor: 'pointer', color: post.savedByMe ? 'var(--accent-2)' : 'var(--muted)', fontSize: '0.88rem' }}
          >
            {post.savedByMe ? '🔖 Đã lưu' : '🔖 Lưu'}
          </button>
          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>💬 {post.commentCount}</span>
          {isOwner && (
            <>
              <Link to={`/community/create?edit=${id}`} style={{ marginLeft: 'auto' }}>
                <button type="button" style={{ background: 'none', border: '1px solid var(--line)', borderRadius: '8px', padding: '0.4rem 0.85rem', color: 'var(--muted)', fontSize: '0.84rem', cursor: 'pointer' }}>✏️ Sửa</button>
              </Link>
              <button
                type="button"
                onClick={() => confirm('Xóa bài viết này?') && deletePost.mutate()}
                style={{ background: 'none', border: '1px solid rgb(248 113 113 / 40%)', borderRadius: '8px', padding: '0.4rem 0.85rem', color: '#f87171', fontSize: '0.84rem', cursor: 'pointer' }}
              >
                🗑 Xóa
              </button>
            </>
          )}
        </div>

        {/* Comments */}
        <section>
          <SectionHeader
            title={`Bình luận (${commentsData?.total ?? post.commentCount})`}
            action={
              <button
                type="button"
                onClick={() => setShowAiInsights(!showAiInsights)}
                style={{
                  background: showAiInsights ? 'var(--accent-soft)' : 'none',
                  border: `1px solid ${showAiInsights ? 'var(--accent-line)' : 'var(--line)'}`,
                  borderRadius: '8px',
                  padding: '0.4rem 0.85rem',
                  color: showAiInsights ? 'var(--accent-2)' : 'var(--muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s ease',
                }}
              >
                ✦ {showAiInsights ? 'Ẩn nhãn AI' : 'Xem nhãn AI'}
              </button>
            }
          />

          <CommentDigestPanel postId={id!} />

          {isLoggedIn ? (
            <form onSubmit={onPostComment} className="surface-card" style={{ marginTop: '0.85rem' }}>
              {/* Ban error — full-width notice */}
              {commentError && commentError.includes('bị khóa') ? (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                  padding: '0.8rem 1rem', borderRadius: 8, marginBottom: '0.75rem',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🚫</span>
                  <div>
                    <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.87rem', color: '#f87171' }}>
                      Tài khoản bị hạn chế bình luận
                    </p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                      {commentError}
                    </p>
                  </div>
                </div>
              ) : commentError ? (
                <p style={{ margin: '0 0 0.6rem', color: '#f87171', fontSize: '0.85rem' }}>{commentError}</p>
              ) : null}
              <div className="field">
                <label htmlFor="reply">Trả lời</label>
                <textarea
                  id="reply"
                  rows={3}
                  placeholder={commentError?.includes('bị khóa') ? 'Tài khoản bị hạn chế bình luận' : 'Viết phản hồi của bạn…'}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  disabled={!!commentError?.includes('bị khóa')}
                  style={commentError?.includes('bị khóa') ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                />
              </div>
              <div style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* AI info hint */}
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-2)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>🤖</span>
                  Bình luận sẽ được PhoBERT phân tích tự động
                </p>
                <Btn type="submit" disabled={postComment.isPending || !!commentError?.includes('bị khóa')}>
                  {postComment.isPending ? 'Đang gửi…' : 'Gửi bình luận'}
                </Btn>
              </div>

              {/* AI Moderation Toast */}
              {aiToastState !== 'idle' && (
                <div className={`ai-moderation-toast ${aiToastState === 'scanning' ? 'scanning' : aiToastState === 'approved' ? 'approved' : 'reviewing'}`}
                  style={{ marginTop: '0.75rem' }}
                >
                  <span className="ai-moderation-toast-icon">
                    {aiToastState === 'scanning' ? '🧠' : aiToastState === 'approved' ? '✅' : '⏳'}
                  </span>
                  <span style={{ flex: 1 }}>
                    {aiToastState === 'scanning' && (
                      <>
                        PhoBERT đang phân tích bình luận
                        <span className="ai-scan-dots"><span /><span /><span /></span>
                      </>
                    )}
                    {aiToastState === 'approved' && 'Bình luận đã gửi — đang xếp hàng kiểm duyệt AI'}
                    {aiToastState === 'reviewing' && 'Bình luận cần xem xét thêm bởi AI'}
                  </span>
                  {aiToastState === 'scanning' && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0 }}>vinai/phobert-base</span>
                  )}
                </div>
              )}
            </form>
          ) : (
            <div className="surface-card" style={{ marginTop: '0.85rem', textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
              <Link to="/auth/login" className="link-inline">Đăng nhập</Link> để bình luận
            </div>
          )}

          <div className="comment-thread" style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
            {comments.map((c) => {
              const cPoints = getPointsForAuthor(c.authorId, c.authorId === user?.id ? user?.points : undefined)
              const cTier = getTierFromPoints(cPoints)
              const cCfg = TIER_CONFIG[cTier]
              return (
                <div
                  key={c._id}
                  className="comment-item surface-card"
                  style={{
                    margin: 0,
                    padding: '1rem 1.25rem',
                    background: cCfg.commentBg !== 'transparent' ? cCfg.commentBg : undefined,
                    borderLeft: cCfg.commentBorder !== 'none' ? cCfg.commentBorder : undefined,
                    boxShadow: cCfg.commentShadow !== 'none' ? cCfg.commentShadow : undefined,
                    borderTopLeftRadius: '0',
                    borderBottomLeftRadius: '0',
                    position: 'relative',
                  }}
                >
                  {/* Glowing background animation for VVIP comments */}
                  {cTier === 'vvip' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: 'inherit', border: '1px solid transparent',
                      background: 'linear-gradient(135deg, #e11d4825, #9333ea25) border-box',
                      WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'destination-out',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                    }} />
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '6px',
                        background: 'var(--accent-soft)', overflow: 'hidden', flexShrink: 0,
                        border: cCfg.avatarBorder,
                        boxShadow: cCfg.avatarShadow,
                      }}>
                        {c.author?.avatarUrl
                          ? <img src={c.author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-2)' }}>{getAuthorName(c, user)[0]?.toUpperCase()}</div>
                        }
                      </div>
                      <strong style={{
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        background: cCfg.gradient !== 'none' ? cCfg.gradient : undefined,
                        WebkitBackgroundClip: cCfg.gradient !== 'none' ? 'text' : undefined,
                        WebkitTextFillColor: cCfg.gradient !== 'none' ? 'transparent' : cCfg.nameCss,
                        color: cCfg.gradient !== 'none' ? 'transparent' : cCfg.nameCss,
                      }}>@{getAuthorName(c, user)}</strong>
                      <MemberBadge points={cPoints} size="sm" />
                      {cTier === 'vvip' && <span title="Tài khoản xác minh" style={{ fontSize: '0.8rem' }}>✅</span>}
                      {/* AI Sentiment pill — luôn hiện, không cần toggle */}
                    {c.sentiment4 && (
                      <span
                        className={`ai-sentiment-pill ${c.sentiment4 === 'toxic' || c.toxicity?.isToxic ? 'toxic' : c.sentiment4}`}
                        title={`PhoBERT: Cảm xúc ${c.sentiment4}${c.confidence != null ? ` · Độ tin cậy ${Math.round(c.confidence * 100)}%` : ''}`}
                      >
                        {c.sentiment4 === 'toxic' || c.toxicity?.isToxic ? '☠ Toxic'
                          : c.sentiment4 === 'positive' ? '😊 Tích cực'
                          : c.sentiment4 === 'negative' ? '😠 Tiêu cực'
                          : '😐 Trung lập'}
                      </span>
                    )}
                    {/* Intent chip — chỉ hiện khi có intent rõ ràng */}
                    {c.intent && c.intent !== 'other' && (
                      <span
                        className="ai-intent-chip"
                        style={{
                          color: c.intent === 'praise' ? '#4ade80' : c.intent === 'complain' ? '#fb923c' : '#60a5fa',
                        }}
                        title={`Mục đích: ${c.intent}`}
                      >
                        {c.intent === 'praise' ? '👍 Khen' : c.intent === 'complain' ? '💬 Than' : '❓ Hỏi'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--muted-2)' }}>{timeAgo(c.createdAt)}</span>
                    {(c.authorId === user?.id || user?.role === 'admin') && editingCommentId !== c._id && (
                      <>
                        <span style={{ color: 'var(--line)' }}>|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(c._id)
                            setEditingText(c.content)
                            setEditError('')
                          }}
                          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-2)', cursor: 'pointer', fontSize: '0.74rem' }}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
                              deleteComment.mutate(c._id)
                            }
                          }}
                          style={{ background: 'none', border: 'none', padding: 0, color: '#f87171', cursor: 'pointer', fontSize: '0.74rem' }}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingCommentId === c._id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!editingText.trim()) return
                      editComment.mutate({ commentId: c._id, content: editingText.trim() })
                    }}
                    style={{ marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}
                  >
                    {editError && <p style={{ margin: '0', color: '#f87171', fontSize: '0.8rem' }}>{editError}</p>}
                    <textarea
                      rows={2}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface-dark)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(null)
                          setEditingText('')
                          setEditError('')
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          color: 'var(--muted)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={editComment.isPending}
                        style={{
                          background: 'var(--accent)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {editComment.isPending ? 'Đang lưu…' : 'Lưu'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p style={{ margin: '0.4rem 0 0', color: '#d6d9e0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {highlightEntities(c.content, c.aiEntities)}
                  </p>
                )}
                {showAiInsights && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem', paddingLeft: '0.2rem' }}>
                    {c.intent && c.intent !== 'other' && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid currentColor',
                          color:
                            c.intent === 'praise'
                              ? '#22c55e'
                              : c.intent === 'complain'
                                ? '#f97316'
                                : '#3b82f6',
                          background: 'rgba(255, 255, 255, 0.02)',
                        }}
                      >
                        🎯 {c.intent === 'praise' ? 'Khen ngợi' : c.intent === 'complain' ? 'Than phiền' : 'Hỏi đáp'}
                      </span>
                    )}
                    {c.aspects?.map((aspect) => (
                      <span
                        key={aspect}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(139,92,246,0.08)',
                          border: '1px solid rgba(139,92,246,0.2)',
                          color: '#c084fc',
                        }}
                      >
                        🏷️ {aspect.toUpperCase()}
                      </span>
                    ))}
                    {c.confidence != null && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-2)', marginLeft: 'auto', alignSelf: 'center' }}>
                        độ tin cậy: {Math.round(c.confidence * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            )})}
            {comments.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>Chưa có bình luận nào. Hãy bắt đầu!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
