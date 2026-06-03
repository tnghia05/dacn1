export type MemberTier = 'member' | 'vip' | 'svip' | 'vvip'

/** Detect tier from accumulated points */
export function getTierFromPoints(points: number): MemberTier {
  if (points >= 5000) return 'vvip'
  if (points >= 2000) return 'svip'
  if (points >= 500)  return 'vip'
  return 'member'
}

/** Points required for each tier */
export const TIER_THRESHOLDS: Record<MemberTier, number> = {
  member: 0,
  vip:    500,
  svip:   2000,
  vvip:   5000,
}

export interface TierConfig {
  label: string
  icon: string          // emoji fallback
  color: string         // primary brand color
  gradient: string      // CSS gradient string
  avatarBorder: string  // CSS border string
  avatarShadow: string  // CSS box-shadow
  nameCss: string       // inline style for display name text
  commentBg: string     // comment card background
  commentBorder: string // comment card left border
  commentShadow: string // comment card box-shadow
  price: string         // monthly price label
  priceNum: number      // monthly price in VND
}

export const TIER_CONFIG: Record<MemberTier, TierConfig> = {
  member: {
    label: 'Thành viên',
    icon: '',
    color: 'var(--muted)',
    gradient: 'none',
    avatarBorder: '2px solid var(--accent-line)',
    avatarShadow: 'none',
    nameCss: 'inherit',
    commentBg: 'transparent',
    commentBorder: 'none',
    commentShadow: 'none',
    price: 'Miễn phí',
    priceNum: 0,
  },
  vip: {
    label: 'VIP',
    icon: '⭐',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    avatarBorder: '2px solid #3b82f6',
    avatarShadow: '0 0 10px rgba(59,130,246,0.4)',
    nameCss: '#60a5fa',
    commentBg: 'rgba(59,130,246,0.04)',
    commentBorder: '3px solid #3b82f6',
    commentShadow: 'none',
    price: '99.000₫/tháng',
    priceNum: 99000,
  },
  svip: {
    label: 'SVIP',
    icon: '🔥',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)',
    avatarBorder: '2px solid #fbbf24',
    avatarShadow: '0 0 14px rgba(251,191,36,0.55)',
    nameCss: '#fbbf24',
    commentBg: 'rgba(251,191,36,0.05)',
    commentBorder: '3px solid #fbbf24',
    commentShadow: '0 2px 12px rgba(251,191,36,0.2)',
    price: '199.000₫/tháng',
    priceNum: 199000,
  },
  vvip: {
    label: 'VVIP',
    icon: '👑',
    color: '#e11d48',
    gradient: 'linear-gradient(135deg, #e11d48, #9333ea, #e11d48)',
    avatarBorder: '2px solid transparent',
    avatarShadow: '0 0 18px rgba(225,29,72,0.6)',
    nameCss: 'transparent',          // use background-clip trick for gradient text
    commentBg: 'rgba(225,29,72,0.06)',
    commentBorder: '3px solid transparent',
    commentShadow: '0 2px 16px rgba(147,51,234,0.25)',
    price: '499.000₫/tháng',
    priceNum: 499000,
  },
}

/** Points needed to reach next tier, returns null if already VVIP */
export function pointsToNextTier(points: number): { next: MemberTier; needed: number } | null {
  if (points >= 5000) return null
  if (points >= 2000) return { next: 'vvip', needed: 5000 - points }
  if (points >= 500)  return { next: 'svip', needed: 2000 - points }
  return { next: 'vip', needed: 500 - points }
}
