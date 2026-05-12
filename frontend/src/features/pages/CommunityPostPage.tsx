import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '../../shared/api/client'
import type { Post, Comment, PaginatedResponse } from '../../shared/api/types'
import { useAuth } from '../../contexts/AuthContext'
import { Btn, SectionHeader } from '../../shared/components/Ui'

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

export function CommunityPostPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', id] })
      setCommentText('')
      setCommentError('')
    },
    onError: (err) => setCommentError(err instanceof ApiError ? err.message : 'Gửi thất bại.'),
  })

  async function onPostComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    postComment.mutate(commentText.trim())
  }

  if (isLoading) return (
    <div className="page-padding"><div className="page-narrow content-shell">
      {[1,2,3].map(i => <div key={i} className="surface-card" style={{ height: '80px', opacity: 0.3, marginBottom: '1rem' }} />)}
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
          {post.tags.slice(0,3).map(t => <span key={t} className="stat-pill">#{t}</span>)}
        </div>

        {/* Header */}
        <header style={{ display: 'grid', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.45rem, 2.6vw, 1.95rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--accent-soft)', overflow: 'hidden', flexShrink: 0 }}>
              {post.author.avatarUrl
                ? <img src={post.author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-2)' }}>{post.author.displayName[0]?.toUpperCase()}</div>
              }
            </div>
            <strong style={{ fontSize: '0.88rem', fontWeight: 600 }}>@{post.author.displayName}</strong>
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
          <SectionHeader title={`Bình luận (${commentsData?.total ?? post.commentCount})`} />

          {isLoggedIn ? (
            <form onSubmit={onPostComment} className="surface-card" style={{ marginTop: '0.85rem' }}>
              {commentError && <p style={{ margin: '0 0 0.6rem', color: '#f87171', fontSize: '0.85rem' }}>{commentError}</p>}
              <div className="field">
                <label htmlFor="reply">Trả lời</label>
                <textarea id="reply" rows={3} placeholder="Viết phản hồi của bạn…" value={commentText} onChange={e => setCommentText(e.target.value)} />
              </div>
              <div style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Btn type="submit" disabled={postComment.isPending}>{postComment.isPending ? 'Đang gửi…' : 'Gửi bình luận'}</Btn>
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
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--accent-soft)', overflow: 'hidden', flexShrink: 0 }}>
                      {c.author?.avatarUrl
                        ? <img src={c.author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-2)' }}>{getAuthorName(c, user)[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <strong style={{ fontSize: '0.86rem' }}>@{getAuthorName(c, user)}</strong>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: '0.4rem 0 0', color: '#d6d9e0', fontSize: '0.9rem', lineHeight: 1.6 }}>{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>Chưa có bình luận nào. Hãy bắt đầu!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
