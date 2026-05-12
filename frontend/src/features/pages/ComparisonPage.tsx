import { useState } from 'react'
import { mockPlayers } from '../../shared/data/mock'
import { Btn, ChartBars, SectionHeader, Tabs } from '../../shared/components/Ui'

export function ComparisonPage() {
  const [mode, setMode] = useState<'players' | 'teams'>('players')

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">So sánh</p>
        <h1>Đối chiếu chỉ số</h1>
        <p>Chọn hai tuyển thủ hoặc đội để xem chỉ số và biểu đồ song song.</p>
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs
          tabs={[
            { id: 'players', label: 'Tuyển thủ' },
            { id: 'teams', label: 'Đội' },
          ]}
          active={mode}
          onChange={(id) => setMode(id as typeof mode)}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <select className="tab" defaultValue={mockPlayers[0]?.nick}>
            {mockPlayers.map((p) => (
              <option key={p.id}>{p.nick}</option>
            ))}
          </select>
          <select className="tab" defaultValue={mockPlayers[1]?.nick}>
            {mockPlayers.map((p) => (
              <option key={p.id}>{p.nick}</option>
            ))}
          </select>
          <select className="tab" defaultValue="90">
            <option value="90">90 ngày</option>
            <option value="split">Split hiện tại</option>
          </select>
          <Btn variant="ghost">Áp dụng</Btn>
        </div>
      </div>

      <div className="compare-grid">
        <div className="surface-card">
          <SectionHeader title={mockPlayers[0]?.nick ?? 'P1'} subtitle={`${mockPlayers[0]?.team} · ${mockPlayers[0]?.role}`} />
          <ChartBars
            data={[
              { label: 'KP', value: 72 },
              { label: 'VS', value: 64 },
              { label: 'DMG', value: 81 },
              { label: 'KDA', value: 78 },
            ]}
          />
        </div>
        <div className="surface-card">
          <SectionHeader title={mockPlayers[1]?.nick ?? 'P2'} subtitle={`${mockPlayers[1]?.team} · ${mockPlayers[1]?.role}`} />
          <ChartBars
            data={[
              { label: 'KP', value: 69 },
              { label: 'VS', value: 77 },
              { label: 'DMG', value: 73 },
              { label: 'KDA', value: 71 },
            ]}
          />
        </div>
      </div>

      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Chỉ số</th>
              <th>{mockPlayers[0]?.nick ?? 'P1'}</th>
              <th>{mockPlayers[1]?.nick ?? 'P2'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>KDA</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>4.2</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>3.8</td>
            </tr>
            <tr>
              <td>First-blood participation</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>38%</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>41%</td>
            </tr>
            <tr>
              <td>Damage share</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>24%</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>27%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
