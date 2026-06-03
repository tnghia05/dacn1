import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { NewsItem, Comment, PaginatedResponse } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
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

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn, user } = useAuth()
  const qc = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [showAiInsights, setShowAiInsights] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editError, setEditError] = useState('')

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['news', id],
    queryFn: () => apiRequest<NewsItem>(`/news/${id}`),
    enabled: !!id,
  })

  const { data: commentsData } = useQuery({
    queryKey: ['news-comments', id],
    queryFn: () => apiRequest<PaginatedResponse<Comment>>(`/news/${id}/comments?limit=20`),
    enabled: !!id,
  })

  const postComment = useMutation({
    mutationFn: (content: string) =>
      apiRequest<Comment>(`/news/${id}/comments`, { method: 'POST', body: { content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news-comments', id] })
      qc.invalidateQueries({ queryKey: ['news', id] })
      setCommentText('')
      setCommentError('')
    },
    onError: (err) => {
      setCommentError(err instanceof ApiError ? err.message : 'Gửi bình luận thất bại.')
    },
  })

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => apiRequest<{ ok: boolean }>(`/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news-comments', id] })
      qc.invalidateQueries({ queryKey: ['news', id] })
    },
  })

  const editComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      apiRequest<Comment>(`/comments/${commentId}`, { method: 'PATCH', body: { content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news-comments', id] })
      qc.invalidateQueries({ queryKey: ['news', id] })
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

  if (isLoading) {
    return (
      <div className="page-padding">
        <div className="page-narrow content-shell">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[1,2,3].map(i => <div key={i} className="surface-card" style={{ height: '80px', opacity: 0.3 }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !article) {
    return (
      <div className="page-padding">
        <div className="page-narrow content-shell">
          <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }}>📰</p>
            <p>Không tìm thấy bài viết này.</p>
            <Link to="/news" className="link-inline">← Về trang tin tức</Link>
          </div>
        </div>
      </div>
    )
  }

  const comments = commentsData?.items ?? []

  const coverImg = article.coverImageUrl || article.thumbnailUrl || article.imageUrl

  return (
    <div className="page-padding">
      <article className="page-narrow content-shell">
        {/* Breadcrumb + meta */}
        <header style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/news" className="link-inline" style={{ fontSize: '0.82rem' }}>← Tin tức</Link>
            {article.game && (
              <>
                <span style={{ color: 'var(--muted-2)' }}>·</span>
                <Badge tone="warn">{article.game.toUpperCase()}</Badge>
              </>
            )}
            {article.source && <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{article.source}</span>}
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {article.title}
          </h1>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
            {timeAgo(article.createdAt)}
            {article.viewCount != null && ` · ${article.viewCount} lượt xem`}
          </p>
        </header>

        {/* Cover image */}
        {coverImg && (
          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '16/9', backgroundImage: `url(${coverImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}

        {/* Content */}
        <div style={{ fontSize: '1rem', lineHeight: 1.8, color: '#d6d9e0' }}>
          {article.excerpt && (
            <p style={{ margin: '0 0 1.25rem', fontWeight: 500, color: 'var(--text)', fontSize: '1.05rem', lineHeight: 1.65, borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
              {article.excerpt}
            </p>
          )}
          {article.content && (
            <div
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: article.content }}
              style={{ display: 'grid', gap: '0.75rem' }}
            />
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {article.tags.map((t) => <span key={t} className="stat-pill">#{t}</span>)}
          </div>
        )}

        {/* Back link */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
          <Link to="/news" className="link-inline" style={{ fontSize: '0.85rem' }}>← Xem thêm tin tức</Link>
        </div>

        {/* Comments */}
        <section>
          <SectionHeader
            title={`Bình luận (${commentsData?.total ?? 0})`}
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

          {isLoggedIn ? (
            <form onSubmit={onPostComment} className="surface-card" style={{ marginTop: '0.85rem' }}>
              {commentError && (
                <p style={{ margin: '0 0 0.6rem', color: '#f87171', fontSize: '0.85rem' }}>{commentError}</p>
              )}
              <div className="field">
                <label htmlFor="c-main">Để lại bình luận</label>
                <textarea id="c-main" placeholder="Chia sẻ ý kiến của bạn…" rows={3}
                  value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              </div>
              <div style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Btn type="submit" disabled={postComment.isPending}>
                  {postComment.isPending ? 'Đang gửi…' : 'Đăng bình luận'}
                </Btn>
              </div>
            </form>
          ) : (
            <div className="surface-card" style={{ marginTop: '0.85rem', textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
              <Link to="/auth/login" className="link-inline">Đăng nhập</Link> để bình luận
            </div>
          )}

          <div className="comment-thread" style={{ marginTop: '1rem' }}>
            {comments.map((c) => (
              <div key={c._id} className="comment-item">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>@{c.author?.displayName ?? c.authorId.slice(-6)}</strong>
                    {c.sentiment4 && (
                      <span
                        title={`Cảm xúc: ${c.sentiment4}`}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          display: 'inline-block',
                          background:
                            c.sentiment4 === 'toxic' || c.toxicity?.isToxic
                              ? '#ef4444'
                              : c.sentiment4 === 'positive'
                              ? '#22c55e'
                              : c.sentiment4 === 'negative'
                              ? '#f97316'
                              : '#6b7280',
                          boxShadow:
                            c.sentiment4 === 'toxic' || c.toxicity?.isToxic
                              ? '0 0 6px #ef4444'
                              : c.sentiment4 === 'positive'
                              ? '0 0 6px #22c55e'
                              : c.sentiment4 === 'negative'
                              ? '0 0 6px #f97316'
                              : 'none',
                        }}
                      />
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
            ))}
            {comments.length === 0 && !isLoading && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.25rem' }}>Chưa có bình luận. Hãy là người đầu tiên!</p>
            )}
          </div>
        </section>
      </article>
    </div>
  )
}
