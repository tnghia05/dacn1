import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'

export function AdminPostsPage() {
  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin</p>
        <h1>Quản lý bài viết</h1>
        <p>Duyệt nội dung biên tập viên đăng và bài cộng đồng.</p>
      </section>

      <SectionHeader title="Hàng chờ duyệt" />
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>VCS playoff primer</td>
              <td>Tin</td>
              <td>
                <Badge tone="warn">Chờ duyệt</Badge>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Btn variant="ghost">Duyệt</Btn>
              </td>
            </tr>
            <tr>
              <td>Community: draft debate</td>
              <td>Bài cộng đồng</td>
              <td>
                <Badge tone="live">Bị báo cáo</Badge>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Btn variant="danger">Từ chối</Btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
