import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, ApiError, getPresignedUrl, apiUpload } from '../../shared/api/client'
import type { Post } from '../../shared/api/types'
import { Btn } from '../../shared/components/Ui'

const GAMES = ['', 'lol', 'valorant', 'cs2', 'mlbb', 'dota2']
const GAME_LABELS: Record<string, string> = {
  '': 'Chọn game (tùy chọn)',
  lol: 'League of Legends',
  valorant: 'Valorant',
  cs2: 'CS2',
  mlbb: 'Mobile Legends',
  dota2: 'Dota 2',
}

export function CreatePostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [game, setGame] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [status, setStatus] = useState<'published' | 'draft'>('published')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Tiêu đề và nội dung không được để trống.')
      return
    }
    setError('')
    setLoading(true)

    try {
      let thumbnailUrl: string | undefined
      if (thumbnailFile) {
        setUploadProgress('Đang upload ảnh…')
        const { uploadUrl, publicUrl } = await getPresignedUrl(thumbnailFile.name, thumbnailFile.type, 'post')
        await apiUpload(uploadUrl, thumbnailFile)
        thumbnailUrl = publicUrl
        setUploadProgress('')
      }

      const tags = tagsRaw
        .split(/[,\s#]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      const body: Record<string, unknown> = { title: title.trim(), content: content.trim(), status }
      if (game) body.game = game
      if (tags.length) body.tags = tags
      if (thumbnailUrl) body.thumbnailUrl = thumbnailUrl

      const post = await apiRequest<Post>('/posts', { method: 'POST', body })
      navigate(`/community/${post._id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng bài thất bại.')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="page-padding content-shell" style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/community" className="link-inline" style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
          ← Cộng đồng
        </Link>
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Cộng đồng</p>
        <h1 style={{ margin: '0.35rem 0 0.5rem', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Tạo bài viết mới
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem', margin: 0 }}>
          Chia sẻ phân tích, dự đoán hoặc thảo luận với cộng đồng.
        </p>
      </section>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgb(248 113 113 / 10%)', border: '1px solid rgb(248 113 113 / 30%)', borderRadius: '10px', color: '#f87171', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Thumbnail upload */}
        <div className="surface-card" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>Ảnh thumbnail</p>
          {thumbnailPreview ? (
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/7', marginBottom: '0.75rem' }}>
              <img src={thumbnailPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => { setThumbnailFile(null); setThumbnailPreview('') }}
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgb(0 0 0 / 70%)', border: 'none', color: '#fff', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' }}
              >
                Xóa
              </button>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--line)', borderRadius: '10px', padding: '2rem', cursor: 'pointer', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.88rem', transition: 'border-color 0.15s' }}>
              <span style={{ fontSize: '2rem' }}>🖼️</span>
              <span>Kéo thả hoặc <strong style={{ color: 'var(--accent-2)' }}>chọn ảnh</strong></span>
              <span style={{ fontSize: '0.76rem', color: 'var(--muted-2)' }}>PNG, JPG, WEBP · tối đa 5MB</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            </label>
          )}
          {uploadProgress && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>{uploadProgress}</p>}
        </div>

        {/* Title */}
        <div className="surface-card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="post-title" style={{ fontWeight: 600 }}>Tiêu đề <span style={{ color: '#f87171' }}>*</span></label>
            <input
              id="post-title"
              placeholder="Ví dụ: Draft game 3 của SGB — phân tích jungle path"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ fontSize: '1.05rem', fontWeight: 600 }}
            />
          </div>

          <div className="field">
            <label htmlFor="post-content" style={{ fontWeight: 600 }}>Nội dung <span style={{ color: '#f87171' }}>*</span></label>
            <textarea
              id="post-content"
              rows={8}
              placeholder="Viết phân tích, nhận định hoặc câu hỏi của bạn tại đây…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ resize: 'vertical', lineHeight: 1.7, fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="surface-card" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="post-game" style={{ fontWeight: 600 }}>Game</label>
            <select id="post-game" value={game} onChange={(e) => setGame(e.target.value)}>
              {GAMES.map((g) => <option key={g} value={g}>{GAME_LABELS[g]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="post-tags" style={{ fontWeight: 600 }}>Tags</label>
            <input
              id="post-tags"
              placeholder="#VCS #playoff #meta"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
            />
          </div>
        </div>

        {/* Status + submit */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['published', 'draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`tab ${status === s ? 'tab-active' : ''}`}
                style={{ borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                {s === 'published' ? '🌐 Đăng công khai' : '📝 Lưu nháp'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to="/community">
              <Btn variant="ghost" type="button">Hủy</Btn>
            </Link>
            <Btn type="submit" disabled={loading}>
              {loading ? (uploadProgress || 'Đang đăng…') : status === 'published' ? 'Đăng bài' : 'Lưu nháp'}
            </Btn>
          </div>
        </div>
      </form>
    </div>
  )
}
