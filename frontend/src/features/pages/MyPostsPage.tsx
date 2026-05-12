import { useState } from 'react'
import { Badge, Btn, Tabs } from '../../shared/components/Ui'

export function MyPostsPage() {
  const [tab, setTab] = useState<'pub' | 'draft'>('pub')

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tài khoản</p>
        <h1>Bài viết của tôi</h1>
        <p>Quản lý bản nháp và bài đã đăng.</p>
      </section>

      <Tabs
        tabs={[
          { id: 'pub', label: 'Đã đăng' },
          { id: 'draft', label: 'Bản nháp' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

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
              <td>Nhận định tuần playoff</td>
              <td>Cộng đồng</td>
              <td>
                <Badge tone={tab === 'pub' ? 'default' : 'warn'}>
                  {tab === 'pub' ? 'Đang hiển thị' : 'Nháp'}
                </Badge>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Btn variant="ghost">Sửa</Btn>
              </td>
            </tr>
            <tr>
              <td>Patch breakdown</td>
              <td>Tin</td>
              <td>
                <Badge tone="warn">Nháp</Badge>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Btn variant="ghost">Xoá</Btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
