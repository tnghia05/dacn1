import { Link } from 'react-router-dom'
import { IMG, mockNews } from '../../shared/data/mock'
import { Badge, ChartBars, SectionHeader } from '../../shared/components/Ui'

export function TeamDetailPage() {
  const roster = ['ZeusSlayer', 'RiverMain', 'NeoMid', 'AceADC', 'Palette']

  return (
    <div className="page-padding content-shell">
      {/* Cover */}
      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          backgroundImage: `url(${IMG.arena})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '240px',
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
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: '0.85rem',
          }}
        >
          <Link to="/teams" className="link-inline" style={{ fontSize: '0.82rem' }}>
            ← Đội tuyển
          </Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
            <div>
              <p className="eyebrow">Hồ sơ đội</p>
              <h1 style={{ margin: '0.4rem 0 0.3rem', fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Saigon Buffalo
              </h1>
              <p style={{ margin: 0, color: 'var(--muted)' }}>Vietnam · LoL · VCS</p>
            </div>
            <div className="stat-pills">
              <span className="stat-pill">Hạng #12</span>
              <span className="stat-pill">Tỷ lệ thắng 61%</span>
              <span className="stat-pill">Phong độ WWLWW</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Trận đã đấu</p>
          <p className="kpi-value">128</p>
          <p className="kpi-trend">+ 12 mùa này</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Tỷ lệ thắng</p>
          <p className="kpi-value">61%</p>
          <p className="kpi-trend">+3% vs mùa trước</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Danh hiệu</p>
          <p className="kpi-value">4</p>
          <p className="kpi-trend" style={{ color: 'var(--muted)' }}>1 trong năm 2025</p>
        </div>
      </div>

      <div className="two-col">
        <div className="section-stack">
          <div className="surface-card">
            <SectionHeader title="Đội hình" />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {roster.map((p) => (
                <div key={p} style={{ textAlign: 'center', minWidth: '64px' }}>
                  <div
                    className="avatar-circle"
                    style={{ width: '60px', height: '60px', backgroundImage: `url(${IMG.player1})`, margin: '0 auto 0.45rem' }}
                  />
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{p}</div>
                </div>
              ))}
            </div>
          </div>

          <ChartBars
            title="Phong độ 4 tuần"
            data={[
              { label: 'T1', value: 62 },
              { label: 'T2', value: 58 },
              { label: 'T3', value: 71 },
              { label: 'T4', value: 66 },
            ]}
          />

          <div className="surface-card">
            <SectionHeader title="Trận gần đây" />
            <table className="data-table">
              <thead>
                <tr>
                  <th>Đối thủ</th>
                  <th>KQ</th>
                  <th>Tỉ số</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>GAM Esports</td>
                  <td>
                    <Badge tone="default">W</Badge>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>2 – 1</td>
                </tr>
                <tr>
                  <td>Cerberus Esports</td>
                  <td>
                    <Badge tone="default">W</Badge>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>2 – 0</td>
                </tr>
                <tr>
                  <td>Team Whales</td>
                  <td>
                    <Badge tone="live">L</Badge>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>1 – 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside className="section-stack">
          <div className="surface-card">
            <SectionHeader title="Tin liên quan" />
            <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
              {mockNews.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <Link to="/news/detail" style={{ color: 'var(--text)', fontSize: '0.86rem', lineHeight: 1.5, fontWeight: 500 }}>
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
