/** Mock content — replace with API later. Images from Unsplash (royalty-free). */

export const IMG = {
  heroHome:
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
  news1:
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
  news2:
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=80',
  news3:
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80',
  arena:
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80',
  jersey:
    'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?auto=format&fit=crop&w=800&q=80',
  gear:
    'https://images.unsplash.com/photo-1592840496694-26d035b32b12?auto=format&fit=crop&w=800&q=80',
  keyboard:
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  player1:
    'https://images.unsplash.com/photo-1560253029-0bab13e22da1?auto=format&fit=crop&w=400&q=80',
  player2:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  stream:
    'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=1200&q=80',
  authSide:
    'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1000&q=80',
} as const

export const mockNews = [
  {
    id: 'n1',
    title: 'VCS Mùa Xuân 2026: meta jungle đổi hướng sau patch',
    excerpt: 'Những đội ưu tiên early skirmish đang có win-rate cao hơn ở tuần 3.',
    game: 'LoL',
    category: 'Esport News',
    date: '30 Apr 2026',
    image: IMG.news1,
  },
  {
    id: 'n2',
    title: 'Valorant Masters: bản đồ mới ảnh hưởng pick agent',
    excerpt: 'Smoke-flex và initiator được ưu tiên trong draft của top 8.',
    game: 'Valorant',
    category: 'Tournament',
    date: '29 Apr 2026',
    image: IMG.news2,
  },
  {
    id: 'n3',
    title: 'CS2: roster shuffle cuối mùa — ai là người được săn?',
    excerpt: 'Ba organization đang tranh giành AWPer trẻ từ khu vực EU.',
    game: 'CS2',
    category: 'Transfers',
    date: '28 Apr 2026',
    image: IMG.news3,
  },
  {
    id: 'n4',
    title: 'Mobile Legends: nhịp độ combat và macro objective',
    excerpt: 'Phân tích nhanh meta turtle/lord trong các trận Bo5 gần đây.',
    game: 'MLBB',
    category: 'Guides',
    date: '27 Apr 2026',
    image: IMG.arena,
  },
]

export const mockMatches = [
  {
    id: 'm1',
    league: 'VCS Spring 2026',
    game: 'LoL',
    status: 'live' as const,
    time: 'Live · Game 3',
    teamA: { name: 'Saigon Buffalo', score: 2, logo: '🐃' },
    teamB: { name: 'GAM Esports', score: 1, logo: '🎮' },
  },
  {
    id: 'm2',
    league: 'Valorant Masters APAC',
    game: 'Valorant',
    status: 'upcoming' as const,
    time: 'Today · 20:00',
    teamA: { name: 'Team Liquid', score: 0, logo: '🐴' },
    teamB: { name: 'Paper Rex', score: 0, logo: '🦖' },
  },
  {
    id: 'm3',
    league: 'CS2 ESL Pro League',
    game: 'CS2',
    status: 'finished' as const,
    time: 'Yesterday',
    teamA: { name: 'Vitality', score: 2, logo: '🐝' },
    teamB: { name: 'FaZe Clan', score: 1, logo: '⚡' },
  },
]

export const mockTeams = [
  { id: 't1', name: 'Saigon Buffalo', region: 'VN', rank: 12, form: 'WWLWW', game: 'LoL' },
  { id: 't2', name: 'GAM Esports', region: 'VN', rank: 8, form: 'WLWWW', game: 'LoL' },
  { id: 't3', name: 'Paper Rex', region: 'APAC', rank: 5, form: 'WWWDL', game: 'Valorant' },
  { id: 't4', name: 'Team Vitality', region: 'EU', rank: 3, form: 'WWWWL', game: 'CS2' },
]

export const mockPlayers = [
  {
    id: 'p1',
    nick: 'ZeusSlayer',
    name: 'Nguyen Van A',
    team: 'Saigon Buffalo',
    role: 'Jungle',
    game: 'LoL',
    kda: '4.2',
    avatar: IMG.player1,
  },
  {
    id: 'p2',
    nick: 'BlinkFox',
    name: 'Tran Thi B',
    team: 'Paper Rex',
    role: 'Duelist',
    game: 'Valorant',
    kda: '1.18',
    avatar: IMG.player2,
  },
]

export const mockProducts = [
  {
    id: 'pr1',
    name: 'Jersey Team Edition 2026',
    price: '890.000 ₫',
    badge: 'Sale',
    image: IMG.jersey,
  },
  {
    id: 'pr2',
    name: 'Pro Mechanical Keyboard',
    price: '2.490.000 ₫',
    badge: '-15%',
    image: IMG.keyboard,
  },
  {
    id: 'pr3',
    name: 'Wireless Gaming Mouse',
    price: '1.290.000 ₫',
    badge: null,
    image: IMG.gear,
  },
]

export const mockCommunityPosts = [
  {
    id: 'cp1',
    author: 'FanZone_VN',
    title: 'Predict Bo5: SGB vs GAM — ai pick Ashe support?',
    excerpt: 'Mình thấy Ashe + jungle tank đang được flex nhiều ở scrim…',
    replies: 124,
    votes: 892,
    tags: ['LoL', 'VCS'],
    hotScore: 94,
  },
  {
    id: 'cp2',
    author: 'StatsNerd',
    title: 'ADR vs Impact — metric nào quan trọng hơn ở CS2?',
    excerpt: 'Thread nhỏ để tranh luận có số liệu minh họa.',
    replies: 56,
    votes: 410,
    tags: ['CS2', 'Analytics'],
    hotScore: 71,
  },
]

/** AI Trending: composite score from search lift, comment velocity, engagement (mock). */
export type TrendEntity = {
  id: string
  label: string
  kind: 'keyword' | 'team' | 'player' | 'topic'
  composite: number
  searchLiftPct: number
  commentsPerHour: number
  engagement: number
  delta24h: string
  /** AI confidence score (0–100) */
  confidence: number
  /** Tiny 7-point sparkline values for visualization */
  spark: number[]
  /** AI-generated short reasoning shown to users */
  reason: string
}

export const mockTrendEntities: TrendEntity[] = [
  {
    id: 'tr1',
    label: 'VCS playoff meta',
    kind: 'topic',
    composite: 96,
    searchLiftPct: 142,
    commentsPerHour: 380,
    engagement: 91,
    delta24h: '+18%',
    confidence: 94,
    spark: [42, 48, 55, 72, 78, 86, 96],
    reason: 'Lượng tìm kiếm và bình luận tăng mạnh trước giờ G playoff.',
  },
  {
    id: 'tr2',
    label: 'GAM Esports',
    kind: 'team',
    composite: 89,
    searchLiftPct: 88,
    commentsPerHour: 210,
    engagement: 84,
    delta24h: '+9%',
    confidence: 88,
    spark: [50, 55, 58, 64, 70, 80, 89],
    reason: 'Đội đang trên đà thắng 3 trận liên tiếp, fan thảo luận sôi nổi.',
  },
  {
    id: 'tr3',
    label: 'ZeusSlayer',
    kind: 'player',
    composite: 84,
    searchLiftPct: 65,
    commentsPerHour: 96,
    engagement: 79,
    delta24h: '+12%',
    confidence: 82,
    spark: [38, 42, 50, 58, 66, 74, 84],
    reason: 'Phong độ cá nhân ấn tượng, được đề cử MVP tuần.',
  },
  {
    id: 'tr4',
    label: 'Paper Rex draft',
    kind: 'keyword',
    composite: 78,
    searchLiftPct: 54,
    commentsPerHour: 140,
    engagement: 72,
    delta24h: '+6%',
    confidence: 71,
    spark: [40, 45, 48, 52, 60, 68, 78],
    reason: 'Lựa chọn đặc biệt trong các trận gần đây gây tò mò.',
  },
  {
    id: 'tr5',
    label: 'Ashe support',
    kind: 'keyword',
    composite: 73,
    searchLiftPct: 220,
    commentsPerHour: 88,
    engagement: 67,
    delta24h: '+22%',
    confidence: 76,
    spark: [12, 18, 24, 36, 50, 62, 73],
    reason: 'Pick mới nổi — tăng 220% lượt tìm trong 24h.',
  },
]

export const mockTrendSeries = [
  { day: 'T2', score: 42 },
  { day: 'T3', score: 48 },
  { day: 'T4', score: 55 },
  { day: 'T5', score: 72 },
  { day: 'T6', score: 81 },
  { day: 'T7', score: 94 },
  { day: 'CN', score: 88 },
]

export const mockComments = [
  {
    id: 'c1',
    user: 'RiverMain',
    text: 'Draft game 2 hay hơn game 1 nhiều, jungle path rõ ràng.',
    sentiment: 'positive' as const,
    likes: 42,
  },
  {
    id: 'c2',
    user: 'ToxicFan99',
    text: 'Ref tệ, match-fix vibes???',
    sentiment: 'toxic' as const,
    likes: 3,
  },
  {
    id: 'c3',
    user: 'NeutralObserver',
    text: 'Cả hai team đều có window comeback ở Baron.',
    sentiment: 'neutral' as const,
    likes: 17,
  },
]

export const mockAdminUsers = [
  { id: 'u1', email: 'mod@demo.local', role: 'Admin', status: 'active' },
  { id: 'u2', email: 'user@demo.local', role: 'User', status: 'active' },
  { id: 'u3', email: 'spam@demo.local', role: 'User', status: 'banned' },
]
