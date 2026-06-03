import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../api/client'

type DigestAggregate = {
  commentCount: number
  sentiment: { positive: number; neutral: number; negative: number }
  sentiment4: { positive: number; negative: number; neutral: number; toxic: number }
  intent: { praise: number; complain: number; question: number; other: number }
  aspects: Record<string, number>
  avgQualityScore: number
  avgToxicityScore: number
  toxicCount: number
}

type DigestResponse = {
  summary: string | null
  aggregate: DigestAggregate | null
  commentCount: number
  cached?: boolean
}

function SentimentBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      <span style={{ width: '70px', color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '99px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ width: '30px', textAlign: 'right', fontWeight: 700, color }}>{pct}%</span>
    </div>
  )
}

const ASPECT_LABELS: Record<string, string> = {
  caster: '🎙️ Bình luận viên',
  meta: '🎮 Meta',
  player_team: '⚔️ Cầu thủ/Đội',
  tournament: '🏆 Giải đấu',
  result: '📊 Kết quả',
  general: '💬 Chung',
}

const INTENT_MAP: Record<string, { label: string; color: string }> = {
  praise: { label: 'Khen ngợi', color: '#22c55e' },
  complain: { label: 'Phàn nàn', color: '#f87171' },
  question: { label: 'Hỏi đáp', color: '#60a5fa' },
  other: { label: 'Khác', color: 'var(--muted)' },
}

export function CommentDigestPanel({ postId }: { postId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery<DigestResponse>({
    queryKey: ['comment-digest', postId],
    queryFn: () => apiRequest<DigestResponse>(`/posts/${postId}/comment-digest`),
    enabled: expanded,
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return
    setIsRefreshing(true)
    try {
      const refreshedData = await apiRequest<DigestResponse>(`/posts/${postId}/comment-digest?force=true`)
      qc.setQueryData(['comment-digest', postId], refreshedData)
    } catch (err) {
      console.error('Failed to force refresh comment digest:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          width: '100%',
          padding: '0.7rem 1rem',
          borderRadius: '12px',
          border: '1.5px dashed rgba(139, 92, 246, 0.35)',
          background: 'rgba(139, 92, 246, 0.04)',
          color: 'var(--muted)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          marginBottom: '0.85rem',
        }}
      >
        <span style={{ fontSize: '1rem' }}>🤖</span>
        Xem AI phân tích không khí bình luận trước khi viết
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.6 }}>PhoBERT + Gemini 3.1</span>
      </button>
    )
  }

  return (
    <div
      style={{
        marginBottom: '0.85rem',
        borderRadius: '16px',
        border: '1.5px solid rgba(139, 92, 246, 0.3)',
        background: 'linear-gradient(135deg, rgba(20, 10, 40, 0.85), rgba(30, 10, 30, 0.85))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 20px rgba(139, 92, 246, 0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          background: 'rgba(139, 92, 246, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🤖</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', color: '#c4b5fd' }}>
              AI Phân tích Bình luận
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-2)' }}>
              PhoBERT Multitask · Tóm tắt bởi Gemini 3.1 Flash Lite
              {data?.cached && !isRefreshing && (
                <span
                  style={{
                    marginLeft: '0.4rem',
                    background: 'rgba(34,197,94,0.15)',
                    color: '#4ade80',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '99px',
                    border: '1px solid rgba(34,197,94,0.3)',
                    verticalAlign: 'middle',
                  }}
                >
                  đã lưu
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: (isRefreshing || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: (isRefreshing || isLoading) ? 0.5 : 0.8,
              transition: 'opacity 0.2s',
              padding: '0.2rem 0.4rem',
            }}
            title="Cập nhật phân tích bình luận mới nhất"
          >
            <span>{isRefreshing ? '🔄 Đang làm mới...' : '🔄 Làm mới'}</span>
          </button>
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.2rem 0.4rem',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '1rem 1.1rem',
          display: 'grid',
          gap: '1rem',
          opacity: isRefreshing ? 0.6 : 1,
          pointerEvents: isRefreshing ? 'none' : 'auto',
          transition: 'opacity 0.25s ease',
          position: 'relative',
        }}
      >
        {isRefreshing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10, 5, 25, 0.45)',
              backdropFilter: 'blur(1.5px)',
              zIndex: 10,
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(15, 10, 25, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                color: '#c4b5fd',
                fontSize: '0.82rem',
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2.5px solid rgba(139,92,246,0.3)',
                  borderTopColor: '#a78bfa',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
              Đang phân tích lại bình luận...
            </div>
          </div>
        )}

        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: 'var(--muted)',
              fontSize: '0.83rem',
            }}
          >
            <span
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(139,92,246,0.4)',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }}
            />
            Đang tổng hợp dữ liệu AI từ các bình luận…
          </div>
        )}

        {error && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#f87171' }}>
            Không thể tải phân tích lúc này.
          </p>
        )}

        {data && data.commentCount === 0 && (
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--muted)' }}>
            Chưa có bình luận nào được phân tích để tóm tắt.
          </p>
        )}

        {data && data.aggregate && data.commentCount > 0 && (
          <>
            {/* AI Summary */}
            {data.summary && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '12px',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Gemini 3.1
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    lineHeight: 1.65,
                    color: 'var(--text)',
                    fontStyle: 'italic',
                  }}
                >
                  {data.summary}
                </p>
              </div>
            )}

            {/* Sentiment bars */}
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <p
                style={{
                  margin: '0 0 0.25rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Phân bố cảm xúc
              </p>
              <SentimentBar
                label="Tích cực"
                value={data.aggregate.sentiment4.positive}
                total={data.commentCount}
                color="#22c55e"
              />
              <SentimentBar
                label="Trung lập"
                value={data.aggregate.sentiment4.neutral}
                total={data.commentCount}
                color="#60a5fa"
              />
              <SentimentBar
                label="Tiêu cực"
                value={data.aggregate.sentiment4.negative}
                total={data.commentCount}
                color="#fb923c"
              />
              <SentimentBar
                label="Độc hại 🚫"
                value={data.aggregate.sentiment4.toxic}
                total={data.commentCount}
                color="#f43f5e"
              />
            </div>

            {/* Intent pills */}
            <div>
              <p
                style={{
                  margin: '0 0 0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Mục đích bình luận
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {Object.entries(data.aggregate.intent)
                  .sort((a, b) => b[1] - a[1])
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => {
                    const m = INTENT_MAP[k]
                    const pct = Math.round((v / data.commentCount) * 100)
                    return (
                      <span
                        key={k}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: `${m.color}18`,
                          border: `1px solid ${m.color}40`,
                          color: m.color,
                        }}
                      >
                        {m.label} {pct}%
                      </span>
                    )
                  })}
              </div>
            </div>

            {/* Top aspects */}
            {Object.keys(data.aggregate.aspects).length > 0 && (
              <div>
                <p
                  style={{
                    margin: '0 0 0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Chủ đề chính
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {Object.entries(data.aggregate.aspects)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--muted)',
                        }}
                      >
                        {ASPECT_LABELS[k] ?? k} · {v}
                      </span>
                    ))}
                </div>
              </div>
            )}


          </>
        )}
      </div>
    </div>
  )
}
