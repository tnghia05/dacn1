import type { FormEvent } from 'react'
import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { NewsItem, PaginatedResponse, Post, Product } from '../../shared/api/types'
import { Btn, SectionHeader, Tabs } from '../../shared/components/Ui'

type SearchResults = {
  news?: NewsItem[]
  posts?: Post[]
  products?: Product[]
  total?: number
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

function normalizeTagParam(raw: string | null) {
  if (!raw) return ''
  return raw.trim().toLowerCase().replace(/^#/, '')
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const tag = normalizeTagParam(params.get('tag'))
  const scope = (params.get('scope') ?? 'all') as 'all' | 'news' | 'posts' | 'products'
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: tagData, isLoading: tagLoading } = useQuery({
    queryKey: ['search-posts-by-tag', tag],
    queryFn: () =>
      apiRequest<PaginatedResponse<Post>>(
        `/search/posts?${new URLSearchParams({ tag, tab: 'hot', limit: '20' })}`,
      ),
    enabled: tag.length > 0,
  })

  const { data, isLoading: qLoading } = useQuery({
    queryKey: ['search', q, scope],
    queryFn: async (): Promise<SearchResults> => {
      const limit = '10'
      const out: SearchResults = { news: [], posts: [], products: [], total: 0 }
      if (scope === 'all' || scope === 'posts') {
        const r = await apiRequest<PaginatedResponse<Post>>(
          `/search/posts?${new URLSearchParams({ q, limit, tab: 'latest' })}`,
        )
        out.posts = r.items
      }
      if (scope === 'all' || scope === 'products') {
        const r = await apiRequest<PaginatedResponse<Product>>(
          `/products?${new URLSearchParams({ q, limit })}`,
        )
        out.products = r.items
      }
      // GET /news (public) hiện chưa lọc theo q; tránh trả tin không liên quan.
      if (scope === 'all' || scope === 'news') {
        out.news = []
      }
      out.total = (out.news?.length ?? 0) + (out.posts?.length ?? 0) + (out.products?.length ?? 0)
      return out
    },
    enabled: q.length > 0 && tag.length === 0,
  })

  const isLoading = tag.length > 0 ? tagLoading : qLoading && q.length > 0

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    if (val) setParams({ q: val, scope })
  }

  const posts = tag.length > 0 ? (tagData?.items ?? []) : (data?.posts ?? [])
  const news = data?.news ?? []
  const products = data?.products ?? []
  const totalHits =
    tag.length > 0 ? posts.length : news.length + posts.length + products.length

  const show = (key: typeof scope) => scope === 'all' || scope === key
  const headline =
    tag.length > 0 ? `Chủ đề #${tag}` : q ? `Kết quả cho "${q}"` : 'Tìm kiếm'

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tìm kiếm</p>
        <h1>{headline}</h1>
        {tag.length > 0 ? (
          <p>{tagLoading ? 'Đang tải bài theo hashtag…' : `${posts.length} bài trong cộng đồng`}</p>
        ) : q ? (
          <p>{isLoading ? 'Đang tìm…' : `${totalHits} kết quả`}</p>
        ) : (
          <p>Tìm tin tức, bài viết cộng đồng và sản phẩm.</p>
        )}
        <form onSubmit={onSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            ref={inputRef}
            defaultValue={q}
            placeholder="Nhập từ khoá…"
            className="tab"
            style={{ flex: '1 1 280px', padding: '0.7rem 0.95rem', fontSize: '0.95rem' }}
          />
          <Btn type="submit">🔍 Tìm</Btn>
        </form>
        {tag.length > 0 && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.84rem' }}>
            <Link to="/community" className="link-inline">
              ← Về cộng đồng
            </Link>
          </p>
        )}
      </section>

      {tag.length === 0 && (
        <Tabs
          tabs={[
            { id: 'all', label: 'Tất cả' },
            { id: 'news', label: 'Tin tức' },
            { id: 'posts', label: 'Cộng đồng' },
            { id: 'products', label: 'Sản phẩm' },
          ]}
          active={scope}
          onChange={(id) => setParams({ q, scope: id })}
        />
      )}

      {tag.length === 0 && scope === 'news' && q && (
        <p className="surface-card" style={{ padding: '1rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
          Tìm theo tiêu đề tin trên trang <Link to="/news">Tin tức</Link> (API danh sách tin chưa hỗ trợ từ khoá ở đây).
        </p>
      )}

      {isLoading && (q || tag) && (
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card" style={{ height: '70px', opacity: 0.3 }} />
          ))}
        </div>
      )}

      {/* News */}
      {tag.length === 0 && show('news') && news.length > 0 && (
        <section>
          <SectionHeader title="Tin tức" subtitle={`${news.length} kết quả`} />
          <div className="news-grid" style={{ marginTop: '0.85rem' }}>
            {news.map((n) => (
              <Link key={n._id} to={`/news/${n._id}`} className="news-card">
                <div className="news-card-img" style={{ backgroundImage: `url(${n.coverImageUrl ?? n.thumbnailUrl ?? n.imageUrl})` }} />
                <div className="news-card-body">
                  <h4>{n.title}</h4>
                  <span className="news-meta">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts (từ khoá hoặc hashtag) */}
      {(tag.length > 0 || show('posts')) && posts.length > 0 && (
        <section>
          <SectionHeader
            title="Cộng đồng"
            subtitle={`${posts.length} ${tag.length > 0 ? 'bài' : 'kết quả'}`}
          />
          <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.85rem' }}>
            {posts.map((p) => (
              <Link
                key={p._id}
                to={`/community/${p._id}`}
                className="surface-card"
                style={{ color: 'inherit', display: 'grid', gap: '0.25rem', padding: '0.9rem 1.1rem' }}
              >
                <strong style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.title}</strong>
                <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--muted-2)' }}>
                  <span>@{p.author?.displayName ?? p.authorId.slice(-6)}</span>
                  <span>❤️ {p.likeCount}</span>
                  <span>💬 {p.commentCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {tag.length === 0 && show('products') && products.length > 0 && (
        <section>
          <SectionHeader title="Sản phẩm" subtitle={`${products.length} kết quả`} />
          <div className="product-grid" style={{ marginTop: '0.85rem' }}>
            {products.map((p) => (
              <Link key={p._id} to={`/store/${p._id}`} className="product-card" style={{ color: 'inherit' }}>
                <div className="product-card-img" style={{ backgroundImage: `url(${p.imageUrl})` }} />
                <div className="product-card-body">
                  <strong>{p.name}</strong>
                  <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}>{fmt(p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {!isLoading && (q || tag) && totalHits === 0 && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.65rem' }}>🔍</p>
          <p>
            {tag.length > 0
              ? `Chưa có bài nào gắn #${tag} trong khoảng thời gian này.`
              : `Không tìm thấy kết quả nào cho "${q}".`}
          </p>
        </div>
      )}

      {!q && tag.length === 0 && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.65rem' }}>🔎</p>
          <p>Nhập từ khoá để bắt đầu tìm kiếm.</p>
        </div>
      )}
    </div>
  )
}
