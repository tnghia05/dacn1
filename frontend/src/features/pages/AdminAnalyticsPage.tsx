import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { AiModerationStat, Sentiment4Distribution, ToxicByGame, AdminAlert } from '../../shared/api/types'
import { AITag, ChartBars, SectionHeader, Btn, Badge } from '../../shared/components/Ui'

const SENT_COLOR: Record<string, string> = {
  positive: '#22c55e',
  negative: '#f97316',
  neutral: '#6b7280',
  toxic: '#ef4444',
}

export function AdminAnalyticsPage() {
  const qc = useQueryClient()
  const [testText, setTestText] = useState('')

  const { mutate: runTest, data: testResult, isPending: testPending, error: testError } = useMutation({
    mutationFn: (text: string) => apiRequest<any>('/admin/ai/test', { method: 'POST', body: { text } }),
  })

  const { data: statsRaw } = useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: () => apiRequest<AiModerationStat[]>('/admin/ai/stats?days=7'),
    staleTime: 5 * 60_000,
  })

  const { data: sentiment } = useQuery({
    queryKey: ['admin-ai-sentiment'],
    queryFn: () => apiRequest<Sentiment4Distribution[]>('/admin/ai/sentiment'),
    staleTime: 5 * 60_000,
  })

  const { data: toxicByGame } = useQuery({
    queryKey: ['admin-ai-toxic-game'],
    queryFn: () => apiRequest<ToxicByGame[]>('/admin/ai/toxic-by-game'),
    staleTime: 5 * 60_000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['admin-ai-alerts'],
    queryFn: () => apiRequest<AdminAlert[]>('/admin/ai/alerts?limit=10'),
    staleTime: 60_000,
  })

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/ai/alerts/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ai-alerts'] }),
  })

  // KPI totals from 7-day stats
  const totals = (statsRaw ?? []).reduce(
    (acc, r) => ({
      approved: acc.approved + (r.approved ?? 0),
      rejected: acc.rejected + (r.rejected ?? 0),
      under_review: acc.under_review + (r.under_review ?? 0),
    }),
    { approved: 0, rejected: 0, under_review: 0 },
  )
  const totalComments = totals.approved + totals.rejected + totals.under_review
  const approvalRate = totalComments > 0 ? Math.round((totals.approved / totalComments) * 100) : 0

  // Chart: approved per day
  const approvedChart = (statsRaw ?? []).map((r) => ({
    label: r.date.slice(5),
    value: r.approved ?? 0,
  }))

  const unreadAlerts = (alerts ?? []).filter((a) => !a.isRead)

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin · AI Analytics</p>
        <h1>AI Health</h1>
        <p>Thống kê kiểm duyệt, phân phối cảm xúc và cảnh báo toxicity spike từ PhoBERT.</p>
      </section>

      {/* KPIs */}
      <div className="quick-grid">
        <div className="kpi">
          <p className="kpi-label">Approved (7 ngày)</p>
          <p className="kpi-value">{totals.approved.toLocaleString()}</p>
          <p className="kpi-trend" style={{ color: '#22c55e' }}>Tỉ lệ {approvalRate}%</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Rejected (7 ngày)</p>
          <p className="kpi-value">{totals.rejected.toLocaleString()}</p>
          <p className="kpi-trend" style={{ color: '#ef4444' }}>
            {totalComments > 0 ? Math.round((totals.rejected / totalComments) * 100) : 0}% tổng số
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Chờ duyệt tay</p>
          <p className="kpi-value">{totals.under_review.toLocaleString()}</p>
          <p className="kpi-trend" style={{ color: '#f97316' }}>under_review</p>
        </div>
      </div>

      <div className="two-col">
        {/* Approved per day chart */}
        {approvedChart.length > 0 ? (
          <ChartBars title="Comments approved / ngày" data={approvedChart} />
        ) : (
          <div className="chart-card">
            <h3 className="chart-title">Comments approved / ngày</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>Chưa có dữ liệu.</p>
          </div>
        )}

        {/* Sentiment4 distribution */}
        <div className="ai-panel">
          <p className="ai-panel-title">Phân phối Sentiment4</p>
          {!sentiment || sentiment.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem' }}>
              {sentiment.map((s) => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: SENT_COLOR[s.label] ?? 'var(--text)', fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {s.count.toLocaleString()} ({Math.round(s.ratio * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${s.ratio * 100}%`, height: '100%', background: SENT_COLOR[s.label] ?? '#6b7280', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="two-col">
        {/* Toxic rate by game */}
        <div className="surface-card">
          <SectionHeader title="Toxic rate theo game" action={<AITag>AI</AITag>} />
          {!toxicByGame || toxicByGame.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: '0.5rem' }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
              {toxicByGame.slice(0, 8).map((g) => (
                <div key={g.game} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ minWidth: 80, fontSize: '0.82rem', fontWeight: 600 }}>{g.game}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${g.toxicRate * 100}%`, height: '100%', background: '#ef4444', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
                    {Math.round(g.toxicRate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toxicity spike alerts */}
        <div className="surface-card">
          <SectionHeader
            title={`Cảnh báo Toxicity Spike${unreadAlerts.length > 0 ? ` (${unreadAlerts.length} mới)` : ''}`}
            subtitle="Raid toxic được phát hiện tự động"
            action={<AITag>AI</AITag>}
          />
          {!alerts || alerts.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: '0.5rem' }}>Không có cảnh báo nào.</p>
          ) : (
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem' }}>
              {alerts.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.6rem',
                    borderRadius: 6,
                    background: a.isRead ? 'transparent' : 'rgba(239,68,68,0.07)',
                    border: a.isRead ? 'none' : '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>
                      #{a.tag}
                      {!a.isRead && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#ef4444' }}>● NEW</span>}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      3h: {Math.round(a.ratio3h * 100)}% toxic · 24h: {Math.round(a.ratio24h * 100)}% toxic
                      · {new Date(a.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!a.isRead && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => markRead(a.id)}
                    >
                      Đã đọc
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* AI Moderation Sandbox */}
      <section className="surface-card" style={{ marginTop: '2rem' }}>
        <SectionHeader
          title="AI Moderation Sandbox & Playground"
          subtitle="Chạy thử nghiệm mô hình PhoBERT đa nhiệm để chẩn đoán & tinh chỉnh luật kiểm duyệt tự động"
          action={<AITag>LIVE PROBE</AITag>}
        />

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr', marginTop: '1.25rem' }}>
          <div>
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="sandbox-text" style={{ fontSize: '0.86rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nội dung bình luận mẫu</label>
              <textarea
                id="sandbox-text"
                rows={3}
                placeholder="Nhập nội dung bình luận tiếng Việt để PhoBERT phân tích (ví dụ: SofM phân tích chiến thuật meta đỉnh quá, cơ mà mấy ông caster GAM bình luận hơi chán...)"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: '0.92rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Btn
                onClick={() => testText.trim() && runTest(testText.trim())}
                disabled={testPending || !testText.trim()}
              >
                {testPending ? 'Đang phân tích...' : '✦ Phân tích bằng PhoBERT'}
              </Btn>
              {testResult && (
                <button
                  type="button"
                  onClick={() => {
                    setTestText('')
                    runTest('')
                  }}
                  style={{ background: 'none', border: '1px solid var(--line)', borderRadius: '8px', padding: '0.4rem 0.85rem', color: 'var(--muted)', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {testError && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.88rem' }}>
              Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra lại AI_MODERATION_URL.
            </div>
          )}

          {testResult && !testResult.error && (
            <div className="ai-panel" style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', padding: '1.25rem', border: '1px solid var(--accent-line)', background: 'linear-gradient(135deg, var(--surface) 0%, rgba(139,92,246,0.03) 100%)', borderRadius: 'var(--r-lg)' }}>
              
              {/* Cột 1: Quyết định kiểm duyệt và NER */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Quyết định kiểm duyệt</h4>
                  {testResult.toxicity?.isToxic ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>❌ AUTO-REJECT</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 'auto' }}>Toxic: {Math.round(testResult.toxicity.score * 100)}%</span>
                    </div>
                  ) : testResult.confidence != null && testResult.confidence < 0.65 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px', color: '#f97316', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>⚠️ ESCALATE MANUAL REVIEW</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 'auto' }}>Conf: {Math.round(testResult.confidence * 100)}%</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', color: '#22c55e', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>✅ AUTO-APPROVE</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 'auto' }}>Độ tin cậy: {Math.round((testResult.confidence ?? 1) * 100)}%</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Thực thể trích xuất (NER)</h4>
                  {(!testResult.entities || testResult.entities.length === 0) ? (
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>Không phát hiện thực thể nào trong câu mẫu.</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {testResult.entities.map((ent: any, idx: number) => {
                        let tone: 'default' | 'live' | 'warn' = 'default'
                        if (ent.type === 'PLAYER') tone = 'live'
                        if (ent.type === 'TEAM') tone = 'warn'
                        return (
                          <Badge key={idx} tone={tone}>
                            {ent.text} ({ent.type})
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Thông tin Mô hình</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    Mô hình: <code style={{ color: 'var(--accent)' }}>vinai/phobert-base</code><br />
                    Tác vụ: <code>Sentiment4 + Intent + Aspect + NER</code><br />
                    Phiên bản AI: <code>{testResult.aiVersion ?? 'PhoBERT-Multitask-v1.0'}</code>
                  </p>
                </div>
              </div>

              {/* Cột 2: Cảm xúc 4 lớp & Mục đích */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Xác suất Sentiment4</h4>
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    {Object.entries(testResult.sentiment4Scores ?? {}).map(([label, val]: any) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                          <span style={{ color: SENT_COLOR[label] ?? 'inherit', fontWeight: 600 }}>{label}</span>
                          <span style={{ color: 'var(--muted)' }}>{Math.round(val * 100)}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--surface)', borderRadius: 2.5, overflow: 'hidden' }}>
                          <div style={{ width: `${val * 100}%`, height: '100%', background: SENT_COLOR[label] ?? '#6b7280', borderRadius: 2.5 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Xác suất Intent</h4>
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    {Object.entries(testResult.intentScores ?? {}).map(([label, val]: any) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                          <span style={{ fontWeight: 600, color: label === 'praise' ? '#22c55e' : label === 'complain' ? '#f97316' : label === 'question' ? '#3b82f6' : 'var(--text)' }}>
                            {label === 'praise' ? 'khen ngợi (praise)' : label === 'complain' ? 'góp ý (complain)' : label === 'question' ? 'hỏi đáp (question)' : 'khác (other)'}
                          </span>
                          <span style={{ color: 'var(--muted)' }}>{Math.round(val * 100)}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--surface)', borderRadius: 2.5, overflow: 'hidden' }}>
                          <div style={{ width: `${val * 100}%`, height: '100%', background: label === 'praise' ? '#22c55e' : label === 'complain' ? '#f97316' : label === 'question' ? '#3b82f6' : '#6b7280', borderRadius: 2.5 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cột 3: Khía cạnh Aspects */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Khía cạnh thảo luận (Aspects)</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted-2)' }}>Khía cạnh có xác suất vượt ngưỡng sẽ được kích hoạt</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {['caster', 'meta', 'player_team', 'tournament', 'result', 'general'].map((aspect) => {
                    const isMatched = testResult.aspects?.includes(aspect)
                    const score = testResult.aspectScores?.[aspect] ?? 0
                    return (
                      <div
                        key={aspect}
                        style={{
                          padding: '0.45rem',
                          borderRadius: '6px',
                          border: `1px solid ${isMatched ? 'rgba(139,92,246,0.3)' : 'var(--line)'}`,
                          background: isMatched ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.01)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isMatched ? 'var(--accent-2)' : 'var(--muted)' }}>
                          {aspect.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isMatched ? '#c084fc' : 'var(--muted-2)' }}>
                          Score: {Math.round(score * 100)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </section>
    </div>
  )
}
