import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IMG } from '../../shared/data/mock'
import { Badge, Btn, SectionHeader, Tabs } from '../../shared/components/Ui'

export function TournamentsPage() {
  const [tab, setTab] = useState<'up' | 'on' | 'done'>('up')

  const cards = [
    { name: 'VCS Spring Playoffs 2026', prize: '2B ₫', teams: 8, date: 'Tháng 5 · 2026', game: 'LoL', img: IMG.arena },
    { name: 'Valorant Masters APAC', prize: '$250k', teams: 16, date: 'Tháng 6 · 2026', game: 'Valorant', img: IMG.news2 },
    { name: 'CS2 ESL Pro League', prize: '$850k', teams: 24, date: 'Tháng 7 · 2026', game: 'CS2', img: IMG.news3 },
  ]

  return (
    <div className="page-padding content-shell">
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          backgroundImage: `url(${IMG.heroHome})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '260px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, rgb(7 9 14 / 88%) 0%, rgb(7 9 14 / 50%) 60%, transparent 100%)',
          }}
        />
        <div style={{ position: 'relative', padding: '2rem', maxWidth: '560px' }}>
          <Badge tone="live">Đang diễn ra</Badge>
          <h1 style={{ margin: '0.6rem 0 0.5rem', fontSize: 'clamp(1.7rem, 2.8vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Giải đấu chuyên nghiệp
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>
            Lịch playoff, bracket và stream — chọn giải để xem chi tiết.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/tournaments/detail">
              <Btn>Vào giải đang diễn ra</Btn>
            </Link>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <Tabs
          tabs={[
            { id: 'up', label: 'Sắp diễn ra' },
            { id: 'on', label: 'Đang diễn ra' },
            { id: 'done', label: 'Đã kết thúc' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
      </div>

      <SectionHeader title="Danh sách" subtitle={`${cards.length} giải`} />
      <div className="news-grid">
        {cards.map((c) => (
          <Link key={c.name} to="/tournaments/detail" className="news-card">
            <div className="news-card-img" style={{ backgroundImage: `url(${c.img})` }} />
            <div className="news-card-body">
              <Badge tone="warn">{c.game}</Badge>
              <h4>{c.name}</h4>
              <span className="news-meta">
                {c.date} · {c.teams} đội
              </span>
              <p
                style={{
                  margin: 0,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--accent-2)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {c.prize}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
