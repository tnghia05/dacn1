import { Link } from 'react-router-dom'
import { IMG, mockNews } from '../../shared/data/mock'
import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'

export function TournamentDetailPage() {
  const rounds = [
    { label: 'Vòng 1', matches: ['SGB vs TW', 'GAM vs CES'] },
    { label: 'Vòng 2', matches: ['Winner A vs Winner B'] },
    { label: 'Bán kết', matches: ['TBD vs TBD'] },
    { label: 'Chung kết', matches: ['Champion'] },
  ]

  return (
    <div className="page-padding content-shell">
      <Link to="/tournaments" className="link-inline" style={{ fontSize: '0.84rem' }}>
        ← Giải đấu
      </Link>

      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          backgroundImage: `url(${IMG.arena})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '220px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgb(7 9 14 / 30%) 0%, rgb(7 9 14 / 92%) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            padding: '1.5rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: '220px',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Badge tone="live">Đang diễn ra</Badge>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>VCS · LoL · Bo5</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.7rem, 2.8vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
            VCS Spring Playoffs 2026
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>HCMC · Tuần 1 · 8 đội tham gia</p>
        </div>
      </section>

      {/* KPI strip */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Tổng giải thưởng</p>
          <p className="kpi-value" style={{ color: 'var(--accent-2)' }}>2B ₫</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Số đội</p>
          <p className="kpi-value">8</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Thể thức</p>
          <p className="kpi-value" style={{ fontSize: '1.2rem' }}>Double Elim · Bo5</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Lịch</p>
          <p className="kpi-value" style={{ fontSize: '1.2rem' }}>5 – 28 / 5 / 2026</p>
        </div>
      </div>

      <div className="two-col">
        <div className="section-stack">
          <div className="surface-card">
            <SectionHeader title="Bracket" subtitle="Sơ đồ rút gọn" />
            <div className="bracket" style={{ marginTop: '0.85rem' }}>
              {rounds.map((col) => (
                <div key={col.label} className="bracket-col">
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--muted-2)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {col.label}
                  </span>
                  {col.matches.map((m) => (
                    <div key={m} className="bracket-match">
                      {m}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card">
            <SectionHeader title="Đội tham gia" />
            <div className="stat-pills" style={{ marginTop: '0.6rem' }}>
              {['SGB', 'GAM', 'CES', 'TW', 'TF', 'MR', 'VKE', 'BRT'].map((t) => (
                <span key={t} className="stat-pill">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="section-stack">
          <div className="video-placeholder" style={{ backgroundImage: `url(${IMG.stream})`, aspectRatio: '16 / 10' }}>
            <span className="video-play">▶</span>
          </div>
          <Btn>Đăng ký theo dõi</Btn>

          <div className="surface-card">
            <SectionHeader title="Tin liên quan" />
            <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
              {mockNews.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <Link to="/news/detail" style={{ color: 'var(--text)', fontSize: '0.86rem', lineHeight: 1.45, fontWeight: 500 }}>
                    {n.title}
                  </Link>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: 'var(--muted-2)' }}>{n.date}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
