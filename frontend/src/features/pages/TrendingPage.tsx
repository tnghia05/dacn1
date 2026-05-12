import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { HotTopicsResponse, EntityTrendsResponse, EntityTrendItem } from '../../shared/api/types'
import { AITag, SectionHeader, Tabs } from '../../shared/components/Ui'

const SENT_COLOR: Record<string, string> = {
  positive: '#22c55e',
  negative: '#f97316',
  neutral: '#6b7280',
  toxic: '#ef4444',
}

const ENTITY_TYPE_LABEL: Record<string, string> = {
  PLAYER: 'Tuyển thủ',
  TEAM: 'Đội',
  TOURNAMENT: 'Giải đấu',
}

function SentimentBar({ s }: { s: { positive: number; negative: number; neutral: number; toxic: number } }) {
  const total = (s.positive + s.negative + s.neutral + s.toxic) || 1
  return (
    <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', gap: 1, marginTop: '0.4rem' }}>
      {(['positive', 'negative', 'neutral', 'toxic'] as const).map((k) => (
        <div
          key={k}
          style={{ flexBasis: `${(s[k] / total) * 100}%`, background: SENT_COLOR[k], minWidth: s[k] > 0 ? 2 : 0 }}
          title={`${k}: ${s[k]}`}
        />
      ))}
    </div>
  )
}

function EntityCard({ item, rank }: { item: EntityTrendItem; rank: number }) {
  const total = (item.sentiment.positive + item.sentiment.negative + item.sentiment.neutral + item.sentiment.toxic) || 1
  const positiveRatio = Math.round((item.sentiment.positive / total) * 100)
  return (
    <div className="ai-signal-card" style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
      <span className="ai-signal-rank" style={{ flexShrink: 0 }}>{String(rank).padStart(2, '0')}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{item.entity}</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--surface)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
            {ENTITY_TYPE_LABEL[item.type] ?? item.type}
          </span>
        </div>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
          {item.mentionCount.toLocaleString()} lượt nhắc · {positiveRatio}% tích cực
          {item.toxicRate > 0.15 && (
            <span style={{ color: '#ef4444', marginLeft: '0.4rem' }}>⚠ {Math.round(item.toxicRate * 100)}% toxic</span>
          )}
        </p>
        <SentimentBar s={item.sentiment} />
      </div>
    </div>
  )
}

const WINDOWS = [
  { id: '3h', label: '3 giờ' },
  { id: '24h', label: '24 giờ' },
  { id: '7d', label: '7 ngày' },
]

const ENTITY_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'PLAYER', label: 'Tuyển thủ' },
  { id: 'TEAM', label: 'Đội' },
  { id: 'TOURNAMENT', label: 'Giải đấu' },
]

export function TrendingPage() {
  const [window, setWindow] = useState<'3h' | '24h' | '7d'>('24h')
  const [entityType, setEntityType] = useState('all')

  const { data: hotTopics, isLoading: loadingTopics } = useQuery({
    queryKey: ['hot-topics', window],
    queryFn: () => apiRequest<HotTopicsResponse>(`/hashtags/hot-topics?window=${window}&limit=10`),
    staleTime: 5 * 60_000,
  })

  const { data: entityTrends, isLoading: loadingEntities } = useQuery({
    queryKey: ['entity-trends', window, entityType],
    queryFn: () =>
      apiRequest<EntityTrendsResponse>(
        `/hashtags/entity-trends?window=${window}&limit=10${entityType !== 'all' ? `&type=${entityType}` : ''}`,
      ),
    staleTime: 5 * 60_000,
  })

  const topics = hotTopics?.items ?? []
  const [topTopic] = topics
  const restTopics = topics.slice(1)
  const entities = entityTrends?.items ?? []

  return (
    <div className="page-padding content-shell">
      {/* AI Hero */}
      <section className="ai-hero">
        <div className="ai-hero-grid">
          <div>
            <AITag>AI Trend</AITag>
            <h2>Xu hướng thời gian thực</h2>
            <p>
              Tổng hợp tín hiệu tìm kiếm, bình luận và lượt tương tác qua mô hình PhoBERT để phát hiện
              chủ đề, đội tuyển và tuyển thủ đang được nhắc đến nhiều nhất.
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Hot topics
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {loadingTopics ? '—' : topics.length}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cập nhật mỗi
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  5p
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Entities theo dõi
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {loadingEntities ? '—' : (entityTrends?.items.length ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Featured #1 */}
          {topTopic ? (
            <Link to={`/search?tag=${topTopic.tag}&scope=posts`} className="ai-signal-card is-top" style={{ color: 'inherit', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    #1 hot topic · {window}
                  </p>
                  <h3 style={{ margin: '0.4rem 0 0.3rem', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    #{topTopic.tag}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>
                    {topTopic.components.discuss.toLocaleString()} thảo luận · {topTopic.components.originalUsers} người dùng
                  </p>
                </div>
                <span className="ai-signal-rank">01</span>
              </div>
              {topTopic.trend?.sentiment4 && (
                <SentimentBar s={topTopic.trend.sentiment4 as any} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem', marginTop: '0.75rem' }}>
                <span className="ai-signal-delta">hotness {topTopic.hotness.toFixed(1)}</span>
                {topTopic.trend && (
                  <span style={{ fontSize: '0.78rem', color: topTopic.trend.toxicCount / Math.max(topTopic.trend.sampleCount, 1) > 0.15 ? '#ef4444' : 'var(--muted)' }}>
                    toxic {Math.round((topTopic.trend.toxicCount / Math.max(topTopic.trend.sampleCount, 1)) * 100)}%
                  </span>
                )}
              </div>
              <div className="ai-confidence">
                <span style={{ color: 'var(--muted)' }}>Hotness score</span>
                <div className="ai-confidence-bar">
                  <div className="ai-confidence-fill" style={{ width: `${Math.min(100, topTopic.hotness * 10)}%` }} />
                </div>
                <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{topTopic.hotness.toFixed(1)}</strong>
              </div>
            </Link>
          ) : (
            <div className="ai-signal-card is-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              {loadingTopics ? 'Đang tải...' : 'Chưa có dữ liệu'}
            </div>
          )}
        </div>
      </section>

      <Tabs tabs={WINDOWS} active={window} onChange={(v) => setWindow(v as typeof window)} />

      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        {/* Left: Hot Topics */}
        <div className="section-stack">
          <SectionHeader title="Hot Topics" subtitle="Sắp xếp theo hotness score" action={<AITag>AI</AITag>} />
          {loadingTopics ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Đang tải...</p>
          ) : restTopics.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Chưa có dữ liệu cho khung giờ này.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {restTopics.map((t, i) => (
                <Link key={t.tag} to={`/search?tag=${t.tag}&scope=posts`} className="ai-signal-card" style={{ color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', minWidth: 0 }}>
                      <span className="ai-signal-rank">{String(i + 2).padStart(2, '0')}</span>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>#{t.tag}</h3>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
                          {t.components.discuss.toLocaleString()} thảo luận · {t.components.originalUsers} người dùng
                        </p>
                        {t.trend?.sentiment4 && <SentimentBar s={t.trend.sentiment4 as any} />}
                      </div>
                    </div>
                    <span className="ai-signal-delta">hotness {t.hotness.toFixed(1)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Entity Trending */}
        <aside className="section-stack">
          <SectionHeader title="Xu hướng Entity" subtitle="Tuyển thủ / Đội / Giải đấu được nhắc nhiều nhất" action={<AITag>NER</AITag>} />
          <Tabs tabs={ENTITY_TABS} active={entityType} onChange={setEntityType} />
          {loadingEntities ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Đang tải...</p>
          ) : entities.length === 0 ? (
            <div className="ai-panel">
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
                Chưa có dữ liệu entity. Dữ liệu sẽ xuất hiện sau khi có comments mới được phân tích bởi AI.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {entities.map((e) => (
                <EntityCard key={`${e.entity}-${e.type}`} item={e} rank={e.rank} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
