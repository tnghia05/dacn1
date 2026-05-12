import { Link } from 'react-router-dom'
import { mockTeams } from '../../shared/data/mock'
import { Badge, SectionHeader } from '../../shared/components/Ui'

export function TeamsPage() {
  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Đội tuyển</p>
        <h1>Tổ chức esports</h1>
        <p>Lịch sử thi đấu, đội hình hiện tại và phong độ gần đây của các tổ chức.</p>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        <select className="tab" defaultValue="all-games">
          <option value="all-games">Tất cả game</option>
          <option>LoL</option>
          <option>Valorant</option>
          <option>CS2</option>
        </select>
        <select className="tab" defaultValue="all-regions">
          <option value="all-regions">Khu vực</option>
          <option>VN</option>
          <option>EU</option>
          <option>APAC</option>
        </select>
        <select className="tab" defaultValue="rank">
          <option value="rank">Sắp xếp: Xếp hạng</option>
          <option>Tỷ lệ thắng</option>
          <option>Phong độ</option>
        </select>
      </div>

      <SectionHeader title="Danh sách" subtitle={`${mockTeams.length} đội`} />
      <div className="news-grid">
        {mockTeams.map((t) => (
          <Link key={t.id} to="/teams/detail" className="surface-card" style={{ color: 'inherit', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{t.name}</strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
                  {t.region} · {t.game}
                </p>
              </div>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--accent-2)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                #{t.rank}
              </span>
            </div>
            <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Badge tone="default">Form {t.form}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
