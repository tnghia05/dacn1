import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { UnderReviewResponse, UnderReviewComment } from '../../shared/api/types'
import { Badge, Btn, SectionHeader } from '../../shared/components/Ui'

const SENT_COLOR: Record<string, string> = {
  positive: '#22c55e',
  negative: '#f97316',
  neutral: '#6b7280',
  toxic: '#ef4444',
}

function ToxicBadge({ score }: { score?: number }) {
  if (score == null) return null
  const tone = score >= 0.7 ? 'live' : score >= 0.4 ? 'warn' : 'default'
  return <Badge tone={tone}>toxic {Math.round(score * 100)}%</Badge>
}

function ConfidencePill({ value }: { value?: number }) {
  if (value == null) return null
  return (
    <span style={{ fontSize: '0.72rem', color: value < 0.6 ? '#f97316' : 'var(--muted)' }}>
      conf {Math.round(value * 100)}%
    </span>
  )
}

function CommentRow({ comment, onDecision }: { comment: UnderReviewComment; onDecision: (id: string, d: 'approved' | 'rejected') => void }) {
  return (
    <tr>
      <td style={{ minWidth: 100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <ToxicBadge score={comment.toxicityScore} />
          <ConfidencePill value={comment.confidence} />
        </div>
      </td>
      <td style={{ maxWidth: 340 }}>
        <p style={{ margin: 0, color: '#d6d9e0', fontSize: '0.88rem', lineHeight: 1.5 }}>{comment.content}</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
          {comment.sentiment4 && (
            <span style={{ fontSize: '0.7rem', color: SENT_COLOR[comment.sentiment4] ?? 'var(--muted)' }}>
              {comment.sentiment4}
            </span>
          )}
          {comment.intent && (
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{comment.intent}</span>
          )}
        </div>
      </td>
      <td style={{ color: 'var(--muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => onDecision(comment.id, 'approved')}>Duyệt</Btn>
          <Btn variant="danger" onClick={() => onDecision(comment.id, 'rejected')}>Từ chối</Btn>
        </div>
      </td>
    </tr>
  )
}

export function AdminModerationPage() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-review', page],
    queryFn: () => apiRequest<UnderReviewResponse>(`/admin/ai/pending-review?page=${page}&limit=20`),
    staleTime: 30_000,
  })

  const { mutate: decide, isPending } = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) =>
      apiRequest(`/admin/ai/review/${id}`, { method: 'PATCH', body: { decision } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pending-review'] }),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="page-padding content-shell">
      <section className="hero-panel compact">
        <p className="eyebrow">Admin · Moderation</p>
        <h1>Hàng chờ kiểm duyệt</h1>
        <p>Comments bị AI đánh dấu độ tin cậy thấp hoặc toxic zone — cần duyệt thủ công.</p>
      </section>

      <SectionHeader
        title={`Cần xử lý (${total})`}
        subtitle="Sắp xếp theo thời gian tạo mới nhất"
      />

      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <p style={{ padding: '1.5rem', color: 'var(--muted)' }}>Đang tải...</p>
        ) : items.length === 0 ? (
          <p style={{ padding: '1.5rem', color: 'var(--muted)' }}>Không có comment nào cần duyệt.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Toxic / Conf</th>
                <th>Nội dung</th>
                <th>Ngày</th>
                <th />
              </tr>
            </thead>
            <tbody style={{ opacity: isPending ? 0.5 : 1 }}>
              {items.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  onDecision={(id, decision) => decide({ id, decision })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total > 20 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
          <Btn variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Trước
          </Btn>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.84rem', color: 'var(--muted)' }}>
            Trang {page} / {Math.ceil(data.total / 20)}
          </span>
          <Btn variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={!data.hasMore}>
            Sau →
          </Btn>
        </div>
      )}
    </div>
  )
}
