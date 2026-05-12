import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'
import { mockComments } from '../../shared/data/mock'

export function AdminCommentsPage() {
  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin</p>
        <h1>Quản lý bình luận</h1>
        <p>Ẩn / khôi phục bình luận và theo dõi báo cáo từ cộng đồng.</p>
      </section>

      <SectionHeader title="Bình luận gần đây" subtitle={`${mockComments.length} mục`} />
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mockComments.map((c) => (
              <tr key={c.id}>
                <td>@{c.user}</td>
                <td>{c.text}</td>
                <td>
                  <Badge tone="default">Hiển thị</Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Btn variant="ghost">Ẩn</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
