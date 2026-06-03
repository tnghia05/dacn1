import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { HotTopicsResponse, EntityTrendsResponse, EntityTrendItem } from '../../shared/api/types'
import { AITag, SectionHeader, Tabs } from '../../shared/components/Ui'

const SENT_COLOR: Record<string, string> = {
  positive: '#22c55e',
  negative: '#f97316',
  neutral:  '#6b7280',
  toxic:    '#ef4444',
}

const SENT_BG: Record<string, string> = {
  positive: 'rgb(34 197 94 / 12%)',
  negative: 'rgb(249 115 22 / 12%)',
  neutral:  'rgb(107 114 128 / 12%)',
  toxic:    'rgb(239 68 68 / 12%)',
}

const SENT_LABEL: Record<string, string> = {
  positive: 'Tích cực',
  negative: 'Tiêu cực',
  neutral:  'Trung lập',
  toxic:    'Độc hại',
}

const SENT_ICON: Record<string, string> = {
  positive: '😊',
  negative: '😠',
  neutral:  '😐',
  toxic:    '☠️',
}

const ENTITY_TYPE_LABEL: Record<string, string> = {
  PLAYER: 'Tuyển thủ',
  TEAM: 'Đội',
  TOURNAMENT: 'Giải đấu',
}

type SentimentData = { positive: number; negative: number; neutral: number; toxic: number }

/** Stacked colored bar — taller + tooltip on each segment */
function SentimentBar({ s }: { s: SentimentData }) {
  const pos = Number(s?.positive) || 0
  const neg = Number(s?.negative) || 0
  const neu = Number(s?.neutral) || 0
  const tox = Number(s?.toxic) || 0
  const total = (pos + neg + neu + tox) || 1
  const pct = (k: keyof SentimentData) => {
    const val = Number(s?.[k]) || 0
    return Math.round((val / total) * 100)
  }
  return (
    <div style={{ marginTop: '0.55rem' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
        {(['positive', 'negative', 'neutral', 'toxic'] as const).map((k) => {
          const val = Number(s?.[k]) || 0
          const share = (val / total) * 100
          return (
            <div
              key={k}
              title={`${SENT_LABEL[k]}: ${pct(k)}%`}
              style={{
                flexBasis: `${share}%`,
                background: SENT_COLOR[k],
                minWidth: val > 0 ? 3 : 0,
                transition: 'flex-basis 0.4s ease',
              }}
            />
          )
        })}
      </div>
      {/* Percentage labels row */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
        {(['positive', 'negative', 'neutral', 'toxic'] as const).map((k) => {
          const p = pct(k)
          if (p === 0) return null
          return (
            <span
              key={k}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: SENT_COLOR[k],
                background: SENT_BG[k],
                border: `1px solid ${SENT_COLOR[k]}33`,
                borderRadius: '999px',
                padding: '0.08rem 0.4rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {SENT_ICON[k]} {p}%
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Full breakdown for entity cards — 4-row mini chart */
function SentimentBreakdown({ s }: { s: SentimentData }) {
  const pos = Number(s?.positive) || 0
  const neg = Number(s?.negative) || 0
  const neu = Number(s?.neutral) || 0
  const tox = Number(s?.toxic) || 0
  const total = (pos + neg + neu + tox) || 1
  const pct = (k: keyof SentimentData) => {
    const val = Number(s?.[k]) || 0
    return Math.round((val / total) * 100)
  }
  return (
    <div style={{ display: 'grid', gap: '0.3rem', marginTop: '0.55rem' }}>
      {(['positive', 'negative', 'neutral', 'toxic'] as const).map((k) => {
        const p = pct(k)
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Label */}
            <span style={{ fontSize: '0.66rem', color: SENT_COLOR[k], width: '4.5rem', flexShrink: 0, fontWeight: 600 }}>
              {SENT_ICON[k]} {SENT_LABEL[k]}
            </span>
            {/* Track */}
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgb(255 255 255 / 5%)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${p}%`,
                  height: '100%',
                  background: SENT_COLOR[k],
                  borderRadius: 3,
                  boxShadow: `0 0 6px ${SENT_COLOR[k]}80`,
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            {/* Percentage */}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: p > 0 ? SENT_COLOR[k] : 'var(--muted-2)', width: '2.4rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {p}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function EntityCard({ item, rank }: { item: EntityTrendItem; rank: number }) {
  return (
    <div className="ai-signal-card" style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
      <span className="ai-signal-rank" style={{ flexShrink: 0 }}>{String(rank).padStart(2, '0')}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{item.entity}</h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', background: 'var(--surface-2)', padding: '0.1rem 0.45rem', borderRadius: 4, flexShrink: 0 }}>
            {ENTITY_TYPE_LABEL[item.type] ?? item.type}
          </span>
        </div>
        {/* Mention count + toxic warning */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
            {item.mentionCount.toLocaleString()} lượt nhắc
          </span>
          {item.toxicRate > 0.15 && (
            <span style={{ fontSize: '0.7rem', color: '#ef4444', background: 'rgb(239 68 68 / 12%)', border: '1px solid rgb(239 68 68 / 30%)', borderRadius: '999px', padding: '0.05rem 0.4rem', fontWeight: 700 }}>
              ⚠ {Math.round(item.toxicRate * 100)}% toxic
            </span>
          )}
        </div>
        {/* Full sentiment breakdown */}
        <SentimentBreakdown s={item.sentiment} />
      </div>
    </div>
  )
}

/** Giải thích tại sao topic này hot — 5 tín hiệu với trọng số */
function HotnessBreakdown({ components, hotness }: {
  components: { read: number; discuss: number; originalUsers: number; likes?: number; searchVolume?: number; velocityScore?: number }
  hotness: number
}) {
  const signals = [
    { key: 'read',          label: 'Lượt đọc',          weight: 0.20, value: components.read,          color: '#60a5fa', icon: '👁' },
    { key: 'discuss',       label: 'Thảo luận',          weight: 0.20, value: components.discuss,       color: '#a78bfa', icon: '💬' },
    { key: 'originalUsers', label: 'Người dùng riêng',  weight: 0.25, value: components.originalUsers, color: '#34d399', icon: '👥' },
    { key: 'likes',         label: 'Lượt thích',         weight: 0.15, value: components.likes ?? 0,    color: '#f472b6', icon: '❤️' },
    { key: 'searchVolume',  label: 'Tìm kiếm',           weight: 0.20, value: components.searchVolume ?? 0, color: '#fb923c', icon: '🔍' },
  ]
  const maxVal = Math.max(...signals.map(s => s.value), 1)

  return (
    <div
      className="hotness-breakdown open"
      style={{ marginTop: '0.75rem', padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}
      onClick={(e) => e.preventDefault()}
    >
      <p style={{ margin: '0 0 0.55rem', fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span>⚡</span> Công thức Hotness — Weibo algorithm
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--accent-2)', fontWeight: 800, letterSpacing: 0 }}>{hotness.toFixed(2)}</span>
      </p>
      <div style={{ display: 'grid', gap: '0.42rem' }}>
        {signals.map(({ key, label, weight, value, color, icon }) => {
          const barWidth = (value / maxVal) * 100
          const fmtVal = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
          return (
            <div key={key} className="hotness-signal-row">
              <span style={{ width: '1rem', textAlign: 'center', flexShrink: 0, fontSize: '0.75rem' }}>{icon}</span>
              <span style={{ width: '6.5rem', flexShrink: 0, color: 'var(--muted)', fontSize: '0.71rem' }}>
                {label}
                <span style={{ marginLeft: '0.25rem', color: 'var(--muted-2)', fontWeight: 500 }}>×{weight}</span>
              </span>
              <div className="hotness-signal-bar-track">
                <div
                  className="hotness-signal-bar-fill"
                  style={{ width: `${barWidth}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
                />
              </div>
              <span style={{ width: '2.8rem', textAlign: 'right', flexShrink: 0, fontSize: '0.71rem', color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmtVal}
              </span>
            </div>
          )
        })}
      </div>
      <p style={{ margin: '0.55rem 0 0', fontSize: '0.62rem', color: 'var(--muted-2)', lineHeight: 1.5 }}>
        Hotness = Σ(giá trị × trọng số) — cập nhật mỗi 5 phút bởi HotTopicsWorker
      </p>
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

/** Topic card #2+ với toggle hotness breakdown */
function TopicCard({ topic, rank }: {
  topic: HotTopicsResponse['items'][number]
  rank: number
}) {
  const [open, setOpen] = useState(false)
  const t = topic
  return (
    <div className="ai-signal-card" style={{ color: 'inherit' }}>
      <Link to={`/search?tag=${t.tag}&scope=posts`} style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', minWidth: 0 }}>
            <span className="ai-signal-rank">{String(rank).padStart(2, '0')}</span>
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
      {/* Toggle breakdown */}
      <div style={{ marginTop: '0.55rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="hotness-toggle-btn"
          onClick={() => setOpen(!open)}
        >
          <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          {open ? 'Ẩn phân tích' : '⚡ Tại sao hot?'}
        </button>
      </div>
      {open && (
        <HotnessBreakdown components={t.components} hotness={t.hotness} />
      )}
    </div>
  )
}



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
            <div className="ai-signal-card is-top" style={{ position: 'relative', zIndex: 1 }}>
              <Link to={`/search?tag=${topTopic.tag}&scope=posts`} style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}>
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
              {/* Hotness breakdown — luôn hiện cho #1 */}
              <HotnessBreakdown components={topTopic.components} hotness={topTopic.hotness} />
            </div>
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
                <TopicCard key={t.tag} topic={t} rank={i + 2} />
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
