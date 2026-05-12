import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { HotTopicsResponse, EntityTrendsResponse } from '../../shared/api/types'
import { IMG, mockCommunityPosts, mockMatches, mockNews } from '../../shared/data/mock'
import { AITag, Badge, Btn, ReactionBar, SectionHeader } from '../../shared/components/Ui'

type AiCard = {
  key: string
  kindLabel: string
  label: string
  delta: string
  confidencePct: number
  sentimentColor?: string
}

export function HomePage() {
  const featured = mockNews[0]
  const otherNews = mockNews.slice(1, 4)
  const communityPreview = mockCommunityPosts[0]

  const { data: hotTopics } = useQuery({
    queryKey: ['home-hot-topics'],
    queryFn: () => apiRequest<HotTopicsResponse>('/hashtags/hot-topics?window=24h&limit=1'),
    staleTime: 5 * 60_000,
  })

  const { data: entityTrends } = useQuery({
    queryKey: ['home-entity-trends'],
    queryFn: () => apiRequest<EntityTrendsResponse>('/hashtags/entity-trends?window=24h&limit=10'),
    staleTime: 5 * 60_000,
  })

  // Build 3 cards: top topic + top team + top player
  const topTopic = hotTopics?.items?.[0]
  const topTeam = entityTrends?.items?.find((e) => e.type === 'TEAM')
  const topPlayer = entityTrends?.items?.find((e) => e.type === 'PLAYER')

  const aiCards: AiCard[] = []

  if (topTopic) {
    aiCards.push({
      key: 'topic',
      kindLabel: 'Chủ đề',
      label: `#${topTopic.tag}`,
      delta: `hotness ${topTopic.hotness.toFixed(1)}`,
      confidencePct: Math.min(100, Math.round(topTopic.hotness * 10)),
    })
  }

  if (topTeam) {
    const total = (topTeam.sentiment.positive + topTeam.sentiment.negative + topTeam.sentiment.neutral + topTeam.sentiment.toxic) || 1
    aiCards.push({
      key: 'team',
      kindLabel: 'Đội',
      label: topTeam.entity,
      delta: `${topTeam.mentionCount.toLocaleString()} lượt nhắc`,
      confidencePct: Math.round((topTeam.sentiment.positive / total) * 100),
      sentimentColor: '#22c55e',
    })
  }

  if (topPlayer) {
    const total = (topPlayer.sentiment.positive + topPlayer.sentiment.negative + topPlayer.sentiment.neutral + topPlayer.sentiment.toxic) || 1
    aiCards.push({
      key: 'player',
      kindLabel: 'Tuyển thủ',
      label: topPlayer.entity,
      delta: `${topPlayer.mentionCount.toLocaleString()} lượt nhắc`,
      confidencePct: Math.round((topPlayer.sentiment.positive / total) * 100),
      sentimentColor: '#22c55e',
    })
  }

  return (
    <div className="page-padding content-shell">
      {/* Hero — editorial split */}
      <section className="hero-home">
        <div className="hero-home-visual" style={{ backgroundImage: `url(${IMG.heroHome})` }} />
        <div className="hero-home-content">
          <p className="eyebrow">Mùa giải 2026</p>
          <h1>Tin tức, trận đấu và cộng đồng esports trong một nơi.</h1>
          <p>
            Theo dõi giải đấu yêu thích, đọc tin nóng và cùng thảo luận với người hâm mộ trên cùng một nền tảng.
          </p>
          <div className="hero-actions">
            <Link to="/matches">
              <Btn>Xem lịch trận</Btn>
            </Link>
            <Link to="/news">
              <Btn variant="ghost">Đọc tin mới</Btn>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Predict strip — đặt cao để feature nổi bật */}
      <section className="ai-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <AITag>AI Predict</AITag>
              <h2 style={{ margin: '0.55rem 0 0.4rem' }}>Đang nóng theo dự đoán AI</h2>
              <p>Mô hình tổng hợp tín hiệu để dự đoán chủ đề, đội tuyển và tuyển thủ sắp được nhắc đến nhiều nhất.</p>
            </div>
            <Link to="/trending" className="link-inline" style={{ fontSize: '0.85rem' }}>
              Xem tất cả →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {aiCards.length === 0
              ? [1, 2, 3].map((n) => (
                  <div key={n} className="ai-signal-card" style={{ opacity: 0.35, minHeight: 110 }} />
                ))
              : aiCards.map((t, i) => (
                  <Link key={t.key} to="/trending" className="ai-signal-card" style={{ color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.7rem',
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontWeight: 600,
                          }}
                        >
                          {t.kindLabel}
                        </p>
                        <h4
                          style={{
                            margin: '0.3rem 0 0',
                            fontSize: '1.02rem',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {t.label}
                        </h4>
                      </div>
                      <span className="ai-signal-rank" style={{ fontSize: '1.2rem' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="ai-signal-delta" style={{ color: t.sentimentColor }}>{t.delta}</span>
                    </div>
                    <div className="ai-confidence">
                      <div className="ai-confidence-bar">
                        <div className="ai-confidence-fill" style={{ width: `${t.confidencePct}%` }} />
                      </div>
                      <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem' }}>
                        {t.confidencePct}%
                      </strong>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Live ticker */}
      <section className="section-stack">
        <SectionHeader
          title="Đang & sắp diễn ra"
          action={
            <Link to="/matches" className="link-inline">
              Tất cả →
            </Link>
          }
        />
        <div className="live-strip">
          {mockMatches.map((m) => (
            <Link key={m.id} to="/matches/detail" className="live-card">
              <div className="live-card-head">
                <span className="live-card-league">{m.league}</span>
                {m.status === 'live' ? (
                  <Badge tone="live">LIVE</Badge>
                ) : m.status === 'upcoming' ? (
                  <Badge tone="warn">Sắp đấu</Badge>
                ) : (
                  <Badge tone="default">Đã kết thúc</Badge>
                )}
              </div>
              <div className="live-card-teams">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="team-logo">{m.teamA.logo}</span>
                  {m.teamA.name}
                </span>
                <span className="live-card-score">
                  {m.teamA.score} : {m.teamB.score}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {m.teamB.name}
                  <span className="team-logo">{m.teamB.logo}</span>
                </span>
              </div>
              <p className="live-card-meta">{m.time}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured news */}
      <section className="section-stack">
        <SectionHeader
          title="Tin nổi bật"
          action={
            <Link to="/news" className="link-inline">
              Tất cả →
            </Link>
          }
        />
        <Link to="/news/detail" className="news-feature" style={{ color: 'inherit' }}>
          <div className="news-feature-img" style={{ backgroundImage: `url(${featured.image})` }} />
          <div className="news-feature-body">
            <Badge tone="warn">{featured.game}</Badge>
            <h3>{featured.title}</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{featured.excerpt}</p>
            <p className="news-meta">{featured.date} · {featured.category}</p>
          </div>
        </Link>

        <div className="news-grid">
          {otherNews.map((n) => (
            <Link key={n.id} to="/news/detail" className="news-card">
              <div className="news-card-img" style={{ backgroundImage: `url(${n.image})` }} />
              <div className="news-card-body">
                <Badge tone="default">{n.game}</Badge>
                <h4>{n.title}</h4>
                <span className="news-meta">{n.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community quote */}
      {communityPreview ? (
        <section className="section-stack">
          <SectionHeader
            title="Từ cộng đồng"
            action={
              <Link to="/community" className="link-inline">
                Vào diễn đàn →
              </Link>
            }
          />
          <Link to="/community/post" className="surface-card" style={{ color: 'inherit', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{communityPreview.title}</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>@{communityPreview.author}</span>
            </div>
            <p style={{ margin: '0.55rem 0 0', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
              {communityPreview.excerpt}
            </p>
            <div style={{ marginTop: '0.85rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <ReactionBar compact seed={2} />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-2)' }}>
                {communityPreview.replies} bình luận · {communityPreview.votes} vote
              </span>
            </div>
          </Link>
        </section>
      ) : null}
    </div>
  )
}
