import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Btn, SectionHeader, Tabs } from '../../shared/components/Ui'

export function SettingsPage() {
  const [tab, setTab] = useState<'account' | 'security' | 'notification'>('account')

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Tài khoản</p>
        <h1>Cài đặt</h1>
        <p>Quản lý thông tin, bảo mật và tuỳ chọn nhận thông báo.</p>
      </section>

      <Tabs
        tabs={[
          { id: 'account', label: 'Tài khoản' },
          { id: 'security', label: 'Bảo mật' },
          { id: 'notification', label: 'Thông báo' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'account' ? (
        <div className="surface-card">
          <SectionHeader title="Thông tin cá nhân" />
          <div style={{ display: 'grid', gap: '0.85rem', marginTop: '0.85rem' }}>
            <div className="field">
              <label htmlFor="display">Tên hiển thị</label>
              <input id="display" defaultValue="@fan_esports" />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" defaultValue="ban@email.com" />
            </div>
            <div className="field">
              <label htmlFor="bio">Giới thiệu</label>
              <textarea id="bio" rows={3} placeholder="Vài dòng về bạn…" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn>Lưu thay đổi</Btn>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'security' ? (
        <div className="section-stack">
          <div className="surface-card">
            <SectionHeader title="Mật khẩu" subtitle="Đổi mật khẩu định kỳ để giữ tài khoản an toàn." />
            <div style={{ display: 'grid', gap: '0.85rem', marginTop: '0.85rem' }}>
              <div className="field">
                <label htmlFor="cur">Mật khẩu hiện tại</label>
                <input id="cur" type="password" placeholder="••••••••" />
              </div>
              <div className="field">
                <label htmlFor="new">Mật khẩu mới</label>
                <input id="new" type="password" placeholder="Tối thiểu 8 ký tự" />
              </div>
              <div className="field">
                <label htmlFor="confirm">Xác nhận mật khẩu</label>
                <input id="confirm" type="password" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn>Cập nhật</Btn>
              </div>
            </div>
          </div>

          <div className="surface-card" style={{ borderColor: 'rgb(239 68 68 / 28%)' }}>
            <SectionHeader
              title="Vùng nguy hiểm"
              subtitle="Các thao tác không thể hoàn tác. Hãy cân nhắc kỹ."
            />
            <div style={{ marginTop: '0.85rem' }}>
              <Btn variant="danger">Xoá tài khoản</Btn>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'notification' ? (
        <div className="surface-card">
          <SectionHeader title="Tuỳ chọn nhận thông báo" />
          <div style={{ display: 'grid', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[
              { id: 'match', label: 'Trận đấu', sub: 'Nhắc trước trận, kết quả' },
              { id: 'community', label: 'Cộng đồng', sub: 'Trả lời, mention, vote' },
              { id: 'order', label: 'Đơn hàng', sub: 'Trạng thái giao hàng' },
              { id: 'news', label: 'Tin nóng', sub: 'Tin breaking từ biên tập' },
            ].map((g) => (
              <label
                key={g.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'rgb(255 255 255 / 2%)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.92rem', fontWeight: 600 }}>{g.label}</strong>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>{g.sub}</p>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }} />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
        <Link to="/profile" className="link-inline">
          ← Trở về hồ sơ
        </Link>
      </p>
    </div>
  )
}
