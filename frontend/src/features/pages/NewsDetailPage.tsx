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

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn } = useAuth()
  const qc = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')

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
      setCommentText('')
      setCommentError('')
    },
    onError: (err) => {
      setCommentError(err instanceof ApiError ? err.message : 'Gửi bình luận thất bại.')
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
          <SectionHeader title={`Bình luận (${commentsData?.total ?? 0})`} />

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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.9rem' }}>@{c.author?.displayName ?? c.authorId.slice(-6)}</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: '0.35rem 0 0', color: '#d6d9e0', fontSize: '0.92rem', lineHeight: 1.55 }}>{c.content}</p>
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
