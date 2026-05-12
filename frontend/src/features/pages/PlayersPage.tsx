import { Link } from 'react-router-dom'
import { mockPlayers } from '../../shared/data/mock'
import { SectionHeader } from '../../shared/components/Ui'

export function PlayersPage() {
  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tuyển thủ</p>
        <h1>Người chơi chuyên nghiệp</h1>
        <p>Tìm theo tên, đội hoặc vai trò để xem hồ sơ và chỉ số chi tiết.</p>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        <input className="tab" placeholder="Tìm tuyển thủ…" style={{ flex: '1 1 240px' }} />
        <select className="tab" defaultValue="all-teams">
          <option value="all-teams">Tất cả đội</option>
          <option>Saigon Buffalo</option>
          <option>Paper Rex</option>
        </select>
        <select className="tab" defaultValue="all-roles">
          <option value="all-roles">Vai trò</option>
          <option>Jungle</option>
          <option>Duelist</option>
          <option>AWPer</option>
        </select>
      </div>

      <SectionHeader title="Hồ sơ" subtitle={`${mockPlayers.length} tuyển thủ`} />
      <div className="news-grid">
        {mockPlayers.map((p) => (
          <Link
            key={p.id}
            to="/players/detail"
            className="surface-card"
            style={{ color: 'inherit', display: 'block' }}
          >
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div className="avatar-circle" style={{ width: '64px', height: '64px', backgroundImage: `url(${p.avatar})` }} />
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{p.nick}</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  {p.team} · {p.role}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-2)',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  KDA {p.kda}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
