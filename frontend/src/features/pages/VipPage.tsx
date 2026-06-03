import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { getTierFromPoints, TIER_CONFIG, TIER_THRESHOLDS, pointsToNextTier } from '../../shared/utils/membership'
import type { MemberTier } from '../../shared/utils/membership'
import { MemberBadge } from '../../shared/components/MemberBadge'

/* ── VIP product IDs that exist in the store/backend ───────────────── */
const VIP_PRODUCT_IDS: Record<Exclude<MemberTier, 'member'>, string> = {
  vip:  'vip-30d',
  svip: 'svip-30d',
  vvip: 'vvip-30d',
}

const VIP_PRICES: Record<Exclude<MemberTier, 'member'>, number> = {
  vip:  99000,
  svip: 199000,
  vvip: 499000,
}

const FEATURES: { label: string; member: string; vip: string; svip: string; vvip: string }[] = [
  { label: 'Huy hiệu cạnh tên',        member: '—',            vip: '⭐ Xanh',        svip: '🔥 Vàng',        vvip: '👑 Đỏ Gradient' },
  { label: 'Khung avatar',             member: 'Mặc định',     vip: 'Viền xanh',     svip: 'Viền vàng ánh kim', vvip: 'Gradient + animation' },
  { label: 'Màu tên hiển thị',         member: 'Trắng',        vip: 'Xanh dương',    svip: 'Vàng',           vvip: 'Gradient đỏ-tím' },
  { label: 'Tích xanh xác minh',       member: '—',            vip: '—',             svip: '—',              vvip: '✅' },
  { label: 'Khung bình luận',          member: '—',            vip: 'Viền xanh',     svip: 'Viền vàng glow', vvip: 'Gradient + pulse' },
  { label: 'Điểm danh hàng ngày',      member: '+10đ',         vip: '+15đ',          svip: '+20đ',           vvip: '+30đ' },
  { label: 'Đăng bài viết',            member: '+20đ',         vip: '+25đ',          svip: '+30đ',           vvip: '+40đ' },
  { label: 'Multiplier dự đoán',       member: '×1.0',         vip: '×1.2',          svip: '×1.5',           vvip: '×2.0' },
  { label: 'Giảm giá cửa hàng',        member: '0%',           vip: '5%',            svip: '10%',            vvip: '15%' },
  { label: 'Tỷ lệ quy đổi điểm',      member: '1:1',          vip: '1:1.1',         svip: '1:1.2',          vvip: '1:1.5' },
  { label: 'Early access sản phẩm drop', member: '—',          vip: '—',             svip: '2h sớm',         vvip: '24h sớm' },
]

const TIERS: Exclude<MemberTier, 'member'>[] = ['vip', 'svip', 'vvip']

export function VipPage() {
  const { user, isLoggedIn } = useAuth()
  const { addItem } = useCart()

  const currentTier  = isLoggedIn ? getTierFromPoints(user?.points ?? 0) : 'member'
  const progressInfo = isLoggedIn ? pointsToNextTier(user?.points ?? 0) : null

  function handleBuy(tier: Exclude<MemberTier, 'member'>) {
    addItem({
      productId: VIP_PRODUCT_IDS[tier],
      name:      `Gói ${TIER_CONFIG[tier].label} 30 ngày`,
      price:     VIP_PRICES[tier],
      imageUrl:  '',
      qty:       1,
    })
    window.location.href = '/checkout'
  }

  return (
    <div style={{ background: '#070910', minHeight: '100vh', color: '#fff' }}>

      {/* ── Keyframe injector ─────────────────────────────────────── */}
      <style>{`
        @keyframes vvip-border-spin {
          0%   { background-position: 0% 50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes vvip-pulse {
          0%, 100% { box-shadow: 0 0 14px rgba(225,29,72,0.35), 0 0 40px rgba(147,51,234,0.15) }
          50%       { box-shadow: 0 0 28px rgba(225,29,72,0.65), 0 0 60px rgba(147,51,234,0.35) }
        }
        @keyframes gold-shimmer {
          0%   { filter: brightness(1) }
          50%  { filter: brightness(1.25) }
          100% { filter: brightness(1) }
        }
        .vip-card-vvip { animation: vvip-pulse 2.5s ease-in-out infinite }
        .vip-card-svip:hover { animation: gold-shimmer 1.5s ease-in-out infinite }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.12) 0%, transparent 65%)',
        borderBottom: '1px solid rgba(251,191,36,0.15)',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
      }}>
        {/* Crown icons row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '2rem' }}>
          {TIERS.map(t => (
            <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <MemberBadge points={TIER_THRESHOLDS[t]} size="lg" showLabel tier={t} />
            </div>
          ))}
        </div>

        <h1 style={{
          margin: '0 0 0.75rem',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #fff 30%, #fbbf24 70%, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Esport Nexus Premium
        </h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.7 }}>
          Nâng cấp trải nghiệm — huy hiệu độc quyền, điểm thưởng cao hơn, ưu đãi cửa hàng và nhiều hơn nữa.
        </p>

        {/* Current status */}
        {isLoggedIn && (
          <div style={{ marginTop: '1.75rem', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
              Cấp độ hiện tại của bạn:&nbsp;
              <strong style={{ color: TIER_CONFIG[currentTier].color }}>
                {TIER_CONFIG[currentTier].label}
              </strong>
              &nbsp;({(user?.points ?? 0).toLocaleString('vi-VN')} điểm)
            </span>
            {progressInfo && (
              <div style={{ width: '260px' }}>
                <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '99px',
                    width: `${Math.min(100, ((user?.points ?? 0) / TIER_THRESHOLDS[progressInfo.next]) * 100)}%`,
                    background: TIER_CONFIG[progressInfo.next].gradient,
                    transition: 'width 0.6s ease',
                  }}/>
                </div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  Cần thêm <strong style={{ color: TIER_CONFIG[progressInfo.next].color }}>{progressInfo.needed.toLocaleString('vi-VN')} điểm</strong> để lên {TIER_CONFIG[progressInfo.next].label}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TIER CARDS ───────────────────────────────────────────── */}
      <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {TIERS.map(tier => {
          const cfg = TIER_CONFIG[tier]
          const isCurrent = currentTier === tier
          const isPopular = tier === 'svip'

          return (
            <div
              key={tier}
              className={`vip-card-${tier}`}
              style={{
                position: 'relative',
                borderRadius: '20px',
                padding: tier === 'vvip' ? '2px' : '0',
                background: tier === 'vvip'
                  ? 'linear-gradient(135deg, #e11d48, #9333ea, #e11d48)'
                  : 'transparent',
                backgroundSize: '300% 300%',
              }}
            >
              <div style={{
                borderRadius: tier === 'vvip' ? '18px' : '20px',
                background: tier === 'vvip' ? '#0d0f1a' : 'rgba(255,255,255,0.04)',
                border: tier !== 'vvip' ? `1px solid ${tier === 'svip' ? 'rgba(251,191,36,0.4)' : 'rgba(59,130,246,0.35)'}` : 'none',
                padding: '2rem 1.75rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}>

                {isPopular && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    color: '#000', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em',
                    padding: '0.3rem 1rem', borderRadius: '99px', whiteSpace: 'nowrap',
                  }}>PHỔ BIẾN NHẤT</div>
                )}

                {/* Icon + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MemberBadge points={TIER_THRESHOLDS[tier]} size="lg" tier={tier} />
                  <div>
                    <div style={{
                      fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em',
                      background: cfg.gradient !== 'none' ? cfg.gradient : undefined,
                      WebkitBackgroundClip: cfg.gradient !== 'none' ? 'text' : undefined,
                      WebkitTextFillColor: cfg.gradient !== 'none' ? 'transparent' : cfg.color,
                      color: cfg.gradient !== 'none' ? 'transparent' : cfg.color,
                    }}>{cfg.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                      {tier === 'vip' ? 'Bắt đầu trải nghiệm' : tier === 'svip' ? 'Dành cho fan cuồng nhiệt' : 'Đỉnh cao thành viên'}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                    {(VIP_PRICES[tier] / 1000).toLocaleString('vi-VN')}k
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.4rem' }}>₫ / tháng</span>
                </div>

                {/* Feature bullets */}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem', flex: 1 }}>
                  {[
                    `Huy hiệu ${cfg.icon} ${cfg.label} độc quyền`,
                    `Khung avatar ${tier === 'vip' ? 'viền xanh' : tier === 'svip' ? 'vàng ánh kim' : 'gradient + animation'}`,
                    `Điểm danh +${tier === 'vip' ? 15 : tier === 'svip' ? 20 : 30} điểm/ngày`,
                    `Multiplier dự đoán ×${tier === 'vip' ? '1.2' : tier === 'svip' ? '1.5' : '2.0'}`,
                    `Giảm giá cửa hàng ${tier === 'vip' ? '5%' : tier === 'svip' ? '10%' : '15%'}`,
                    ...(tier !== 'vip' ? [`Early access drop ${tier === 'svip' ? '2h' : '24h'} sớm`] : []),
                    ...(tier === 'vvip' ? ['Tích xanh xác minh ✅', 'Khung comment gradient + pulse'] : []),
                  ].map((f, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', fontSize: '0.84rem', color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ color: cfg.color, marginTop: '1px', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{ textAlign: 'center', padding: '0.7rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.84rem', fontWeight: 600 }}>
                    ✓ Gói hiện tại
                  </div>
                ) : isLoggedIn ? (
                  <button
                    onClick={() => handleBuy(tier)}
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '12px', border: 'none',
                      background: cfg.gradient !== 'none' ? cfg.gradient : cfg.color,
                      color: tier === 'svip' ? '#000' : '#fff',
                      fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                      letterSpacing: '0.02em', transition: 'opacity 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.opacity = '0.88'; (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.opacity = '1'; (e.target as HTMLButtonElement).style.transform = 'translateY(0)' }}
                  >
                    Nâng cấp lên {cfg.label}
                  </button>
                ) : (
                  <Link to="/auth/login" style={{
                    display: 'block', textAlign: 'center', padding: '0.85rem', borderRadius: '12px',
                    background: cfg.gradient !== 'none' ? cfg.gradient : cfg.color,
                    color: tier === 'svip' ? '#000' : '#fff',
                    fontWeight: 800, fontSize: '0.92rem', textDecoration: 'none',
                  }}>
                    Đăng nhập để nâng cấp
                  </Link>
                )}

                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Thanh toán qua VNPay · Hủy bất kỳ lúc nào
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── COMPARISON TABLE ─────────────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem',
          background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.6))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          So sánh quyền lợi
        </h2>

        <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Tính năng</div>
            {(['member', ...TIERS] as MemberTier[]).map(t => (
              <div key={t} style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: t === 'member' ? 'rgba(255,255,255,0.4)' : TIER_CONFIG[t].color }}>
                {t === 'member' ? 'Member' : TIER_CONFIG[t].label}
              </div>
            ))}
          </div>

          {FEATURES.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <div style={{ padding: '0.85rem 1.25rem', fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)' }}>{row.label}</div>
              {[row.member, row.vip, row.svip, row.vvip].map((val, j) => {
                const tier = (['member', 'vip', 'svip', 'vvip'] as MemberTier[])[j]
                return (
                  <div key={j} style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontSize: '0.82rem',
                    color: tier === 'member' ? 'rgba(255,255,255,0.35)' : TIER_CONFIG[tier].color, fontWeight: tier !== 'member' ? 600 : 400 }}>
                    {val}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
