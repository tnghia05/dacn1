export type UserRole = 'user' | 'admin'

export type User = {
  id: string
  email: string
  displayName: string
  role: UserRole
  avatarUrl?: string
  points?: number
}

export type PointReason =
  | 'checkin'
  | 'post_publish'
  | 'comment_create'
  | 'prediction_win'
  | 'prediction_bet'
  | 'redeem_product'
  | 'checkout_discount'
  | 'admin_adjust'

export type PointLedgerEntry = {
  _id: string
  userId: string
  delta: number
  balanceAfter: number
  reason: PointReason
  meta?: Record<string, unknown>
  createdAt: string
}

export type PointsBalance = {
  balance: number
  items: PointLedgerEntry[]
  total: number
}

export type PredictionStatus = 'pending' | 'won' | 'lost' | 'cancelled'

export type Prediction = {
  _id: string
  userId: string
  matchId: string
  teamIndex: number
  teamName: string
  pointsBet: number
  oddsAtBet: number
  status: PredictionStatus
  pointsWon?: number
  settledAt?: string
  createdAt: string
}

export type AuthResponse = {
  access_token: string
  user: User
}

export type PaginatedResponse<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export type Post = {
  _id: string
  authorId: string
  author?: { id: string; displayName: string; avatarUrl?: string }
  title: string
  content: string
  thumbnailUrl?: string
  game?: string
  tags: string[]
  status: 'published' | 'draft'
  viewCount: number
  commentCount: number
  likeCount: number
  likedByMe?: boolean
  savedByMe?: boolean
  createdAt: string
}

export type Comment = {
  _id: string
  authorId: string
  author?: { id: string; displayName: string; avatarUrl?: string }
  content: string
  parentId?: string | null
  likeCount: number
  likedByMe?: boolean
  replyCount?: number
  createdAt: string

  // AI fields from backend
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentiment4?: 'positive' | 'negative' | 'neutral' | 'toxic'
  intent?: 'praise' | 'complain' | 'question' | 'other'
  aspects?: ('caster' | 'meta' | 'player_team' | 'tournament' | 'result' | 'general')[]
  aiEntities?: { text: string; type: string }[]
  toxicity?: { isToxic: boolean; score: number }
  confidence?: number
}

/** Response từ GET /hashtags/hot-topics */
export type HotTopicTrend = {
  sampleCount: number
  labeledCount: number
  toxicCount: number
  sentiment4?: Record<string, number>
  intent?: Record<string, number>
  aspect?: Record<string, number>
  sentiment4Avg?: Record<string, number>
  intentAvg?: Record<string, number>
  aspectAvg?: Record<string, number>
}

export type HotTopicItem = {
  rank: number
  tag: string
  hotness: number
  components: { read: number; discuss: number; originalUsers: number; likes?: number; searchVolume?: number; velocityScore?: number }
  trend?: HotTopicTrend
}

export type AdminOverview = {
  users: { total: number; today: number }
  posts: { total: number; today: number }
  comments: { total: number; today: number }
  moderation: { pendingReview: number; queue: number }
  activity7d: { date: string; posts: number; comments: number }[]
}

export type HotTopicsResponse = {
  window: string
  updatedAt?: string
  items: HotTopicItem[]
}

export type NewsItem = {
  _id: string
  title: string
  content?: string
  excerpt?: string
  coverImageUrl?: string
  thumbnailUrl?: string
  imageUrl?: string
  game?: string
  tag?: string
  tags?: string[]
  slug?: string
  status?: string
  viewCount?: number
  commentCount?: number
  createdAt: string
  source?: string
}

export type ProductVariant = {
  _id: string
  productId: string
  name: string
  sku?: string
  price: number
  stock: number
  reserved?: number
  attributes?: Record<string, string>
}

export type Product = {
  _id: string
  name: string
  slug?: string
  description?: string
  price: number
  imageUrls?: string[]   // backend field name
  /** @deprecated use imageUrls[0] */ imageUrl?: string
  /** @deprecated use imageUrls      */ images?: string[]
  stock?: number
  reserved?: number
  type?: 'physical' | 'digital' | 'ticket' | 'service'
  status?: 'active' | 'inactive'
  tags?: string[]
  variants?: ProductVariant[]
  pointsPrice?: number
  createdAt?: string
}

export type OrderItem = {
  productId: string
  variantId?: string
  qty: number
  name?: string
  price?: number
  imageUrl?: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'cancelled_expired'
  | 'refunded'

export type Order = {
  _id: string
  orderCode: string
  status: OrderStatus
  reservedUntil?: string
  items: OrderItem[]
  total: number
  receiverName?: string
  phone?: string
  email?: string
  shippingAddress?: string
  shippingMethod?: string
  payment?: { provider: string; providerTxnRef: string }
  paymentUrl?: string
  createdAt?: string
}

export type Notification = {
  _id: string
  type: string
  title?: string
  body?: string
  message?: string
  read: boolean
  link?: string
  createdAt: string
}

export type HashtagTrend = {
  tag: string
  count: number
  delta?: string
}

export type SearchSuggestion = {
  keyword: string
  count?: number
}

export type LoLEsportsTeam = {
  id: string
  name: string
  code: string
  image: string
  result?: { outcome: string | null; gameWins: number }
  record?: { wins: number; losses: number }
}

export type LoLEsportsGame = {
  number: number
  id: string
  state: 'completed' | 'inProgress' | 'unstarted'
}

export type TimelinePoint = {
  minute: number
  blueGold: number
  redGold: number
  diff: number
}

export type LoLEsportsStream = {
  youtube: { videoId: string; locale: string; statsEnabled: boolean } | null
  twitch: { channel: string; locale: string; statsEnabled: boolean } | null
  lpl: { url: string; locale: string } | null
  bilibili: { url: string; locale: string } | null
}

export type LoLEsportsEvent = {
  id: string
  startTime: string
  state: 'completed' | 'inProgress' | 'unstarted'
  blockName?: string
  league: { id: string; name: string; slug: string; image: string }
  tournament?: { id: string }
  match: {
    id: string
    strategy?: { type: string; count: number }
    teams: LoLEsportsTeam[]
    games: LoLEsportsGame[]
  }
  streams: LoLEsportsStream
  liveGameId: string | null
}

export type LoLLiveTeamStats = {
  totalGold: number
  inhibitors: number
  towers: number
  barons: number
  totalKills: number
  dragons: string[]
}

export type LoLLiveParticipant = {
  participantId: number
  totalGold: number
  level: number
  kills: number
  deaths: number
  assists: number
  creepScore: number
  currentHealth: number
  maxHealth: number
}

export type LoLLiveFrame = {
  rfc460Timestamp: string
  gameState: string
  blueTeam: LoLLiveTeamStats & { participants: LoLLiveParticipant[] }
  redTeam: LoLLiveTeamStats & { participants: LoLLiveParticipant[] }
}

export type LoLLiveStatsWindow = {
  esportsGameId: string
  esportsMatchId: string
  gameMetadata?: { gameTime: number; patchVersion?: string; blueTeamMetadata?: any; redTeamMetadata?: any }
  frames: LoLLiveFrame[]
}

export type PostgameParticipant = {
  participantId: number
  summonerName: string
  championId: string
  role: string
  kills: number
  deaths: number
  assists: number
  totalGold: number
  creepScore: number
  level: number
}

export type PostgameTeamStats = {
  totalGold: number
  totalKills: number
  towers: number
  inhibitors: number
  barons: number
  dragons: string[]
  participants: PostgameParticipant[]
}

export type PostgameStats = {
  gameState: string
  blueTeam: PostgameTeamStats
  redTeam: PostgameTeamStats
}

export type MatchTeam = {
  name: string
  acronym?: string
  imageUrl?: string
  score?: number
  externalId?: number
}

export type MatchStatus = 'live' | 'not_started' | 'finished'

// ── Entity Trending ──────────────────────────────────────────────────────────
export type EntityTrendItem = {
  rank: number
  entity: string
  type: 'PLAYER' | 'TEAM' | 'TOURNAMENT'
  mentionCount: number
  sentiment: { positive: number; negative: number; neutral: number; toxic: number }
  toxicRate: number
  intent: { praise: number; complain: number; question: number; other: number }
}

export type EntityTrendsResponse = {
  window: string
  items: EntityTrendItem[]
}

// ── Admin AI Stats ────────────────────────────────────────────────────────────
export type AiModerationStat = {
  date: string
  approved?: number
  rejected?: number
  pending?: number
  under_review?: number
}

export type Sentiment4Distribution = {
  label: string
  count: number
  ratio: number
}

export type ToxicByGame = {
  game: string
  total: number
  toxic: number
  toxicRate: number
}

export type AdminAlert = {
  id: string
  type: string
  tag: string
  ratio3h: number
  ratio24h: number
  isRead: boolean
  createdAt: string
}

// ── Under-review Comments ─────────────────────────────────────────────────────
export type UnderReviewComment = {
  id: string
  postId?: string
  newsId?: string
  authorId: string
  content: string
  confidence?: number
  sentiment4?: string
  intent?: string
  toxicityScore?: number
  createdAt: string
}

export type UnderReviewResponse = {
  items: UnderReviewComment[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// ── MatchItem (existing) ──────────────────────────────────────────────────────
export type MatchItem = {
  _id: string
  externalId: string
  game: string
  region?: string
  status: MatchStatus
  startsAt?: string
  endedAt?: string
  teams: MatchTeam[]
  matchName?: string
  tournamentName?: string
  leagueName?: string
  serieName?: string
  numberOfGames?: number
  provider?: string
  syncedAt: string
}

// ── PandaScore Leagues / Series / Tournaments ─────────────────────────────────
export type PandaScoreVideogame = { id: number; name: string; slug: string }

export type PandaScoreLeague = {
  id: number
  name: string
  slug: string
  url?: string
  image_url?: string
  videogame?: PandaScoreVideogame
}

export type PandaScoreTournamentRef = {
  id: number
  name: string
  slug: string
  begin_at?: string
  end_at?: string
  prizepool?: string
  tier?: string
}

export type PandaScoreSerie = {
  id: number
  name?: string
  full_name: string
  slug: string
  begin_at?: string | null
  end_at?: string | null
  year?: number
  season?: string
  league?: { id: number; name: string; slug: string; image_url?: string }
  league_id?: number
  videogame?: PandaScoreVideogame
  tournaments?: PandaScoreTournamentRef[]
}

export type PandaScoreTeamRef = {
  id: number
  name: string
  acronym?: string
  image_url?: string
  location?: string
  players?: PandaScorePlayer[]
}


export type PandaScoreStanding = {
  rank: number
  team: PandaScoreTeamRef
  wins: number
  losses: number
  draws: number
  total: number
}

export type PandaScoreSerieOpponent = {
  opponent: PandaScoreTeamRef
  type: string
}

export type PandaScoreSerieMatch = {
  id: number
  name: string
  status: 'not_started' | 'running' | 'finished' | 'canceled' | 'postponed'
  scheduled_at?: string
  begin_at?: string
  end_at?: string
  number_of_games?: number
  opponents?: PandaScoreOpponent[]
  results?: Array<{ team_id: number; score: number }>
  tournament?: { id: number; name: string; slug: string }
  league?: { id: number; name: string; slug: string }
}

export type PandaScoreOpponent = {
  opponent: PandaScoreTeamRef
  type: string
}

export type PandaScorePlayer = {
  id: number
  name: string
  first_name?: string
  last_name?: string
  image_url?: string
  nationality?: string
  role?: string
  age?: number
  hometown?: string
}

export type PandaScoreRoster = {
  team: PandaScoreTeamRef
  players: PandaScorePlayer[]
}

export type NotificationType =
  | 'comment'
  | 'reply'
  | 'follow'
  | 'post_like'
  | 'toxic_warning'
  | 'account_ban'

export type Notification = {
  _id: string
  userId: string
  actorId?: string
  type: NotificationType
  postId?: string
  commentId?: string
  message?: string
  isRead: boolean
  readAt?: string
  createdAt: string
  // legacy fields from old notification shape
  read?: boolean
  title?: string
  body?: string
}

/** User with toxic strike info — returned by GET /admin/users/toxic */
export type ToxicUser = {
  _id: string
  displayName: string
  email: string
  avatarUrl?: string
  toxicStrikeCount: number
  banUntil: string | null
  banReason: string | null
  isBanned: boolean
  isPermanent: boolean
}

