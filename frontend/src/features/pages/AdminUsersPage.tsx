import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'
import { mockAdminUsers } from '../../shared/data/mock'

export function AdminUsersPage() {
  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin</p>
        <h1>Quản lý người dùng</h1>
        <p>Tìm kiếm, lọc theo vai trò và xử lý tài khoản.</p>
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input className="tab" placeholder="Tìm theo email…" style={{ flex: '1 1 240px' }} />
        <select className="tab" defaultValue="all-roles">
          <option value="all-roles">Tất cả vai trò</option>
          <option>Admin</option>
          <option>User</option>
        </select>
        <select className="tab" defaultValue="all-status">
          <option value="all-status">Tất cả trạng thái</option>
          <option>active</option>
          <option>banned</option>
        </select>
      </div>

      <SectionHeader title="Danh sách" subtitle={`${mockAdminUsers.length} tài khoản`} />
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mockAdminUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <Badge tone={u.role === 'Admin' ? 'warn' : 'default'}>{u.role}</Badge>
                </td>
                <td>
                  <Badge tone={u.status === 'active' ? 'default' : 'live'}>{u.status === 'active' ? 'Hoạt động' : 'Cấm'}</Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Btn variant="ghost">{u.status === 'active' ? 'Khóa' : 'Mở khóa'}</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
