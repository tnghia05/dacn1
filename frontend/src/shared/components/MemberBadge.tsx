import { getTierFromPoints, TIER_CONFIG } from '../utils/membership'
import type { MemberTier } from '../utils/membership'

interface Props {
  points: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  /** Override tier instead of computing from points */
  tier?: MemberTier
}

/** Crown SVGs mimicking Weibo VIP style */
function CrownSvg({ tier, size }: { tier: MemberTier; size: number }) {
  if (tier === 'member') return null

  if (tier === 'vip') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vip-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path d="M12 2L4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6L12 2z" fill="url(#vip-g)" opacity="0.9"/>
      {/* Star inside */}
      <path d="M12 7l1.2 3.5H17l-2.9 2.1 1.1 3.4L12 14l-3.2 2 1.1-3.4L7 10.5h3.8z" fill="white" opacity="0.95"/>
    </svg>
  )

  if (tier === 'svip') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="svip-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      {/* Crown base */}
      <path d="M3 17h18v2H3z" fill="url(#svip-g)" rx="1"/>
      {/* Crown peaks */}
      <path d="M3 17L6 8l4 5 2-6 2 6 4-5 3 9" fill="url(#svip-g)" stroke="#f59e0b" strokeWidth="0.3"/>
      {/* Jewels */}
      <circle cx="6.5" cy="15.5" r="1" fill="white" opacity="0.8"/>
      <circle cx="12" cy="14" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="17.5" cy="15.5" r="1" fill="white" opacity="0.8"/>
      {/* Crown rim */}
      <rect x="3" y="17" width="18" height="2" rx="1" fill="url(#svip-g)"/>
    </svg>
  )

  // VVIP — gradient crown with gems
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vvip-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="vvip-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Crown peaks */}
      <path d="M3 17L6 7l4 6 2-7 2 7 4-6 3 10" fill="url(#vvip-g)"/>
      {/* Crown rim */}
      <rect x="3" y="17" width="18" height="2.5" rx="1.2" fill="url(#vvip-g)"/>
      {/* Center gem */}
      <polygon points="12,8.5 13.2,11.5 16.4,11.5 13.9,13.4 14.8,16.4 12,14.5 9.2,16.4 10.1,13.4 7.6,11.5 10.8,11.5" fill="url(#vvip-gem)" opacity="0.95"/>
      {/* Side dots */}
      <circle cx="6" cy="16" r="1" fill="#fde68a" opacity="0.9"/>
      <circle cx="18" cy="16" r="1" fill="#fde68a" opacity="0.9"/>
    </svg>
  )
}

export function MemberBadge({ points, size = 'md', showLabel = false, tier: overrideTier }: Props) {
  const tier = overrideTier ?? getTierFromPoints(points)
  const cfg = TIER_CONFIG[tier]

  if (tier === 'member') return null

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18
  const fontSize = size === 'sm' ? '0.6rem' : size === 'lg' ? '0.8rem' : '0.68rem'

  return (
    <span
      title={`${cfg.label} — ${cfg.price}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
        verticalAlign: 'middle',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <CrownSvg tier={tier} size={iconSize} />
      {showLabel && (
        <span
          style={{
            fontSize,
            fontWeight: 800,
            letterSpacing: '0.04em',
            background: cfg.gradient !== 'none' ? cfg.gradient : undefined,
            WebkitBackgroundClip: cfg.gradient !== 'none' ? 'text' : undefined,
            WebkitTextFillColor: cfg.gradient !== 'none' ? 'transparent' : cfg.color,
            color: cfg.gradient !== 'none' ? 'transparent' : cfg.color,
          }}
        >
          {cfg.label}
        </span>
      )}
    </span>
  )
}
