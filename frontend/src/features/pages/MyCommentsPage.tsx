import { Link } from 'react-router-dom'
import { SectionHeader } from '../../shared/components/Ui'

export function MyCommentsPage() {
  const rows = [
    { id: '1', text: 'Draft Ashe support có merit nếu duo với hyper-carry.', src: '/community/post', when: '2 giờ trước' },
    { id: '2', text: 'Macro Baron của SGB ổn hơn game trước.', src: '/matches/detail', when: '1 ngày trước' },
  ]

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tài khoản</p>
        <h1>Bình luận của tôi</h1>
        <p>Mở lại nguồn gốc của từng bình luận đã viết.</p>
      </section>

      <SectionHeader title={`Lịch sử (${rows.length})`} />
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nội dung</th>
              <th>Thời gian</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.text}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{r.when}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link className="link-inline" to={r.src}>
                    Mở →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
