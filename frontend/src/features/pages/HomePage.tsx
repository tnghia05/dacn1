import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { 
  HotTopicsResponse, 
  EntityTrendsResponse, 
  MatchItem, 
  NewsItem, 
  Post, 
  PaginatedResponse 
} from '../../shared/api/types'
import { IMG } from '../../shared/data/mock'
import { AITag, Badge, Btn, ReactionBar, SectionHeader } from '../../shared/components/Ui'

type AiCard = {
  key: string
  kindLabel: string
  label: string
  delta: string
  confidencePct: number
  sentimentColor?: string
}

function formatTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

function TeamLogo({ team }: { team?: { imageUrl?: string; acronym?: string; name?: string } }) {
  if (!team) return <span className="team-logo">TB</span>
  if (team.imageUrl) {
    return (
      <img
        src={team.imageUrl}
        alt={team.acronym ?? team.name}
        style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
        onError={(e) => { 
          (e.currentTarget as HTMLImageElement).style.display = 'none' 
        }}
      />
    )
  }
  return <span className="team-logo">{(team.acronym ?? team.name ?? 'TBD').slice(0, 2).toUpperCase()}</span>
}

const GAME_LABELS: Record<string, string> = {
  lol: 'LoL', csgo: 'CS2', dota2: 'Dota 2', valorant: 'Valorant',
  ow2: 'OW2', rl: 'RL', mlbb: 'MLBB', kog: 'KoG', r6: 'R6', cod: 'CoD',
}

export function HomePage() {
  // 1. Fetch AI Trends
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

  // 2. Fetch real Matches
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['home-matches'],
    queryFn: () => apiRequest<PaginatedResponse<MatchItem>>('/matches?limit=4&tab=all'),
    staleTime: 60_000,
  })
  const matches = matchesData?.items ?? []

  // 3. Fetch real News
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['home-news'],
    queryFn: () => apiRequest<PaginatedResponse<NewsItem>>('/news?limit=4'),
    staleTime: 2 * 60_000,
  })
  const newsItems = newsData?.items ?? []
  const featured = newsItems[0]
  const otherNews = newsItems.slice(1, 4)

  // 4. Fetch real Community post
  const { data: communityData } = useQuery({
    queryKey: ['home-community-posts'],
    queryFn: () => apiRequest<PaginatedResponse<Post>>('/posts?tab=hot&limit=1'),
    staleTime: 60_000,
  })
  const communityPreview = communityData?.items?.[0]

  // Build AI Predict cards
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
        {matchesLoading && (
          <div className="live-strip">
            {[1, 2, 3].map((i) => (
              <div key={i} className="live-card" style={{ opacity: 0.35, pointerEvents: 'none', height: 110 }} />
            ))}
          </div>
        )}
        {!matchesLoading && (
          <div className="live-strip">
            {matches.map((m) => {
              const [tA, tB] = m.teams ?? []
              return (
                <Link key={m._id} to={`/matches/${m._id}`} className="live-card">
                  <div className="live-card-head">
                    <span className="live-card-league" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {m.leagueName ?? m.serieName ?? 'Esports'}
                    </span>
                    {m.status === 'live' ? (
                      <Badge tone="live">LIVE</Badge>
                    ) : m.status === 'not_started' ? (
                      <Badge tone="warn">Sắp đấu</Badge>
                    ) : (
                      <Badge tone="default">Đã kết thúc</Badge>
                    )}
                  </div>
                  <div className="live-card-teams">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <TeamLogo team={tA} />
                      {tA?.acronym ?? tA?.name ?? 'TBD'}
                    </span>
                    <span className="live-card-score" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {m.status === 'not_started' ? 'vs' : `${tA?.score ?? 0} : ${tB?.score ?? 0}`}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tB?.acronym ?? tB?.name ?? 'TBD'}
                      <TeamLogo team={tB} />
                    </span>
                  </div>
                  <p className="live-card-meta">
                    {formatTime(m.startsAt)}
                    {m.numberOfGames ? ` · BO${m.numberOfGames}` : ''}
                    {m.game ? ` · ${GAME_LABELS[m.game] ?? m.game.toUpperCase()}` : ''}
                  </p>
                </Link>
              )
            })}
            {matches.length === 0 && (
              <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Chưa có trận nào diễn ra.</p>
            )}
          </div>
        )}
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
        {newsLoading && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="news-feature" style={{ opacity: 0.35, height: 260 }} />
          </div>
        )}
        {!newsLoading && (
          <>
            {featured && (
              <Link to={`/news/${featured._id}`} className="news-feature" style={{ color: 'inherit' }}>
                <div className="news-feature-img" style={{ backgroundImage: `url(${featured.coverImageUrl || featured.thumbnailUrl || featured.imageUrl || IMG.heroHome})` }} />
                <div className="news-feature-body">
                  {featured.game && <Badge tone="warn">{featured.game.toUpperCase()}</Badge>}
                  <h3>{featured.title}</h3>
                  {featured.excerpt && <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{featured.excerpt}</p>}
                  <p className="news-meta">{timeAgo(featured.createdAt)}{featured.source ? ` · ${featured.source}` : ''}</p>
                </div>
              </Link>
            )}

            <div className="news-grid">
              {otherNews.map((n) => (
                <Link key={n._id} to={`/news/${n._id}`} className="news-card">
                  <div className="news-card-img" style={{ backgroundImage: `url(${n.coverImageUrl || n.thumbnailUrl || n.imageUrl || IMG.heroHome})` }} />
                  <div className="news-card-body">
                    {n.game && <Badge tone="default">{n.game.toUpperCase()}</Badge>}
                    <h4>{n.title}</h4>
                    <span className="news-meta">{timeAgo(n.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
            {newsItems.length === 0 && (
              <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Chưa có tin tức nào được đăng tải.</p>
            )}
          </>
        )}
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
          <Link to={`/community/${communityPreview._id}`} className="surface-card" style={{ color: 'inherit', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{communityPreview.title}</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>@{communityPreview.author?.displayName ?? 'Anonymous'}</span>
            </div>
            {communityPreview.content && (
              <p style={{ margin: '0.55rem 0 0', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {communityPreview.content}
              </p>
            )}
            <div style={{ marginTop: '0.85rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <ReactionBar compact seed={2} />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-2)' }}>
                {communityPreview.commentCount ?? 0} bình luận · {communityPreview.likeCount ?? 0} lượt thích
              </span>
            </div>
          </Link>
        </section>
      ) : null}
    </div>
  )
}
