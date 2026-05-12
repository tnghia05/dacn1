import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { NewsItem, PaginatedResponse } from '../../shared/api/types'
import { mockTrendEntities } from '../../shared/data/mock'
import { AISparkline, AITag, Badge, SectionHeader, Tabs } from '../../shared/components/Ui'

const games = ['Tất cả', 'lol', 'valorant', 'cs2', 'mlbb']
const gameLabels: Record<string, string> = { 'Tất cả': 'Tất cả', lol: 'LoL', valorant: 'Valorant', cs2: 'CS2', mlbb: 'MLBB' }

const cats = [
  { id: 'all', label: 'Tất cả' },
  { id: 'news', label: 'Tin tức' },
  { id: 'transfer', label: 'Chuyển nhượng' },
  { id: 'tournament', label: 'Giải đấu' },
  { id: 'guide', label: 'Bài phân tích' },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

export function NewsPage() {
  const [game, setGame] = useState('Tất cả')
  const [cat, setCat] = useState('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['news', game, cat],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '20' })
      if (game !== 'Tất cả') params.set('game', game)
      if (cat !== 'all') params.set('tag', cat)
      return apiRequest<PaginatedResponse<NewsItem>>(`/news?${params}`)
    },
  })

  const items = data?.items ?? []
  const [featured, ...rest] = items

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Newsroom</p>
        <h1>Tin tức Esports</h1>
        <p>Cập nhật giải đấu, chuyển nhượng và phân tích chuyên môn từ các tựa game lớn.</p>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs tabs={cats} active={cat} onChange={setCat} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {games.map((g) => (
            <button key={g} type="button"
              className={`tab ${game === g ? 'tab-active' : ''}`}
              onClick={() => setGame(g)}
              style={{ background: game === g ? 'var(--accent-soft)' : 'rgb(255 255 255 / 3%)', border: '1px solid var(--line)', borderRadius: '999px' }}
            >
              {gameLabels[g]}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="section-stack">
          {isLoading && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="surface-card" style={{ height: '120px', opacity: 0.4 }} />
              ))}
            </div>
          )}
          {isError && (
            <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
              Không thể tải tin tức. Vui lòng thử lại.
            </div>
          )}
          {!isLoading && !isError && (
            <>
              {featured && (
                <Link to={`/news/${featured._id}`} className="news-feature" style={{ color: 'inherit' }}>
                  <div className="news-feature-img" style={{ backgroundImage: `url(${featured.coverImageUrl || featured.thumbnailUrl || featured.imageUrl})` }} />
                  <div className="news-feature-body">
                    {featured.game && <Badge tone="warn">{featured.game.toUpperCase()}</Badge>}
                    <h3>{featured.title}</h3>
                    {featured.excerpt && <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{featured.excerpt}</p>}
                    <p className="news-meta">{timeAgo(featured.createdAt)}{featured.source ? ` · ${featured.source}` : ''}</p>
                  </div>
                </Link>
              )}
              <div className="news-grid">
                {rest.map((n) => (
                  <Link key={n._id} to={`/news/${n._id}`} className="news-card">
                    <div className="news-card-img" style={{ backgroundImage: `url(${n.coverImageUrl || n.thumbnailUrl || n.imageUrl})` }} />
                    <div className="news-card-body">
                      {n.game && <Badge tone="default">{n.game.toUpperCase()}</Badge>}
                      <h4>{n.title}</h4>
                      <span className="news-meta">{timeAgo(n.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {items.length === 0 && (
                <div className="surface-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                  Không có bài viết nào trong danh mục này.
                </div>
              )}
            </>
          )}
        </div>

        <aside className="section-stack">
          {items.length > 0 && (
            <div className="surface-card">
              <SectionHeader title="Đọc nhiều" subtitle="24 giờ qua" />
              <ol style={{ margin: 0, padding: 0, display: 'grid', gap: '0.7rem', listStyle: 'none' }}>
                {items.slice(0, 5).map((n, i) => (
                  <li key={n._id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: '0.65rem', alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--muted-2)', fontWeight: 700, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Link to={`/news/${n._id}`} style={{ color: 'var(--text)', fontSize: '0.86rem', lineHeight: 1.45, fontWeight: 500 }}>
                      {n.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="ai-panel">
            <p className="ai-panel-title">AI dự đoán nóng</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Chủ đề có khả năng được nhắc đến nhiều trong 24h tới.
            </p>
            <ul style={{ margin: '0.4rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.7rem' }}>
              {mockTrendEntities.slice(0, 3).map((t, i) => (
                <li key={t.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums', width: 22 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link to="/trending" style={{ flex: 1, color: 'var(--text)', fontWeight: 600, fontSize: '0.86rem' }}>{t.label}</Link>
                  <AISparkline values={t.spark} />
                </li>
              ))}
            </ul>
            <Link to="/trending" className="link-inline" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>Xem tất cả →</Link>
          </div>

          <div className="surface-card">
            <SectionHeader title="Chủ đề" action={<AITag>AI</AITag>} />
            <div className="stat-pills">
              {['#VCS', '#ValorantMasters', '#Transfer', '#Patch', '#CS2'].map((t) => (
                <span key={t} className="stat-pill">{t}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
