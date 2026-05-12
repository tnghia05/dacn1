import { Link } from 'react-router-dom'
import { mockPlayers } from '../../shared/data/mock'
import { Badge, Btn, ChartBars, SectionHeader } from '../../shared/components/Ui'

export function PlayerDetailPage() {
  const p = mockPlayers[0]

  return (
    <div className="page-padding content-shell">
      <Link to="/players" className="link-inline" style={{ fontSize: '0.84rem' }}>
        ← Tuyển thủ
      </Link>

      <div className="surface-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', padding: '1.25rem 1.4rem' }}>
        <div
          className="avatar-circle"
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '20px',
            backgroundImage: `url(${p.avatar})`,
            border: '2px solid var(--accent-line)',
          }}
        />
        <div style={{ flex: '1 1 240px', display: 'grid', gap: '0.4rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{p.nick}</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            {p.name} · <Link to="/teams/detail" className="link-inline">{p.team}</Link> · {p.role}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            <Link to="/comparison">
              <Btn>So sánh</Btn>
            </Link>
            <Btn variant="ghost">Theo dõi</Btn>
          </div>
        </div>
        <div className="stat-pills">
          <span className="stat-pill">KDA {p.kda}</span>
          <span className="stat-pill">Trận 42</span>
          <span className="stat-pill">MVP 7</span>
        </div>
      </div>

      <div className="compare-grid">
        <ChartBars
          title="Chỉ số chính"
          data={[
            { label: 'KP', value: 74 },
            { label: 'VS', value: 62 },
            { label: 'DMG', value: 81 },
            { label: 'Vision', value: 58 },
          ]}
        />
        <div className="surface-card">
          <SectionHeader title="Phong độ gần đây" />
          <table className="data-table">
            <thead>
              <tr>
                <th>Đối thủ</th>
                <th>KQ</th>
                <th>KDA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GAM</td>
                <td>
                  <Badge tone="default">W</Badge>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>7/2/9</td>
              </tr>
              <tr>
                <td>Cerberus</td>
                <td>
                  <Badge tone="default">W</Badge>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>3/1/11</td>
              </tr>
              <tr>
                <td>Whales</td>
                <td>
                  <Badge tone="live">L</Badge>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>2/4/6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
