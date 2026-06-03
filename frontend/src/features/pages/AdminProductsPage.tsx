import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../shared/api/client'
import type { PaginatedResponse, Product } from '../../shared/api/types'
import { Btn, SectionHeader } from '../../shared/components/Ui'

// ── helpers ────────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫'
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}


const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'physical', label: '📦 Vật lý (Physical)' },
  { value: 'digital', label: '💾 Kỹ thuật số (Digital)' },
  { value: 'ticket', label: '🎟️ Vé sự kiện (Ticket)' },
  { value: 'service', label: '🛠️ Dịch vụ (Service)' },
]

// ── empty form state ────────────────────────────────────────────────────────
type ProductForm = {
  name: string
  slug: string
  description: string
  price: string
  stock: string
  type: string
  status: 'active' | 'inactive'
  imageUrls: string // comma-separated
  tags: string // comma-separated
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '',
  type: 'physical',
  status: 'active',
  imageUrls: '',
  tags: '',
}

function formToPayload(f: ProductForm) {
  const imageUrls = f.imageUrls
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const tags = f.tags
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    name: f.name.trim(),
    slug: f.slug.trim() || slugify(f.name),
    description: f.description.trim() || undefined,
    price: Number(f.price),
    stock: Number(f.stock),
    type: f.type || 'physical',
    status: f.status,
    imageUrls: imageUrls.length ? imageUrls : undefined,
    tags: tags.length ? tags : undefined,
  }
}

function productToForm(p: Product): ProductForm {
  return {
    name: p.name,
    slug: slugify(p.name),
    description: p.description ?? '',
    price: String(p.price),
    stock: String(p.stock ?? ''),
    type: 'physical',
    status: 'active',
    imageUrls: (p.imageUrls ?? (p.imageUrl ? [p.imageUrl] : [])).join(', '),
    tags: '',
  }
}

// ── sub-components ──────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--muted-2)' }}>{hint}</p>
      )}
    </div>
  )
}

/** Form tạo / sửa sản phẩm */
function ProductForm({
  initial,
  isEdit,
  onSave,
  onCancel,
  isLoading,
  error,
}: {
  initial: ProductForm
  isEdit: boolean
  onSave: (data: ReturnType<typeof formToPayload>) => void
  onCancel: () => void
  isLoading: boolean
  error?: string
}) {
  const [form, setForm] = useState<ProductForm>(initial)
  const nameRef = useRef<HTMLInputElement>(null)

  function set(key: keyof ProductForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // auto-generate slug from name if user hasn't typed slug yet
      if (key === 'name' && !isEdit) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { nameRef.current?.focus(); return }
    if (!form.price || Number(form.price) < 0) return
    if (form.stock === '' || Number(form.stock) < 0) return
    onSave(formToPayload(form))
  }

  const previewImages = form.imageUrls
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http'))

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 8,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: '0.85rem', color: '#f87171',
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <FormField label="Tên sản phẩm" required>
          <input
            ref={nameRef}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Áo đội T1 2024 Season…"
            required
          />
        </FormField>

        <FormField label="Slug (URL)" hint="Tự tạo từ tên, hoặc nhập tay">
          <input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="ao-doi-t1-2024"
          />
        </FormField>
      </div>

      <FormField label="Mô tả sản phẩm">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Mô tả chi tiết: chất liệu, kích thước, thông tin sản phẩm…"
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <FormField label="Giá bán (VNĐ)" required>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="350000"
            required
          />
        </FormField>

        <FormField label="Tồn kho" required hint="0 = hết hàng">
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
            placeholder="100"
            required
          />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <FormField label="Loại sản phẩm">
          <select value={form.type} onChange={(e) => set('type', e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Trạng thái">
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}
          >
            <option value="active">✅ Đang bán</option>
            <option value="inactive">⏸️ Tạm ẩn</option>
          </select>
        </FormField>
      </div>

      <FormField label="Tags" hint="Cách nhau bởi dấu phẩy">
        <input
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="jersey, t1, limited"
        />
      </FormField>

      <FormField
        label="URLs hình ảnh"
        hint="Nhập link ảnh, cách nhau bởi dấu phẩy. Ảnh đầu tiên là ảnh đại diện."
      >
        <textarea
          rows={2}
          value={form.imageUrls}
          onChange={(e) => set('imageUrls', e.target.value)}
          placeholder="https://cdn.example.com/img1.jpg, https://cdn.example.com/img2.jpg"
        />
      </FormField>

      {/* Image preview */}
      {previewImages.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {previewImages.map((src, i) => (
            <div
              key={i}
              style={{
                width: 72, height: 72, borderRadius: 8, overflow: 'hidden',
                border: i === 0 ? '2px solid var(--accent)' : '1px solid var(--line)',
                flexShrink: 0, position: 'relative',
              }}
            >
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              {i === 0 && (
                <span style={{
                  position: 'absolute', bottom: 2, left: 0, right: 0,
                  textAlign: 'center', fontSize: '0.6rem', color: 'var(--accent)',
                  fontWeight: 700, background: 'rgba(0,0,0,0.6)',
                }}>Đại diện</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--line)' }}>
        <Btn type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Btn>
        <Btn type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu…' : isEdit ? '💾 Cập nhật sản phẩm' : '➕ Tạo sản phẩm'}
        </Btn>
      </div>
    </form>
  )
}

/** Hàng trong bảng sản phẩm */
function ProductRow({
  p,
  onEdit,
  onDelete,
  isDeleting,
}: {
  p: Product
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const imgSrc = p.imageUrls?.[0] ?? p.imageUrl
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={p.name}
              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--line)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }}
            />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              📦
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3 }}>{p.name}</p>
          </div>
        </div>
      </td>
      <td style={{ fontWeight: 700, color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {fmtPrice(p.price)}
      </td>
      <td>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
          fontSize: '0.78rem', fontWeight: 700,
          color: (p.stock ?? 0) > 0 ? '#4ade80' : '#f87171',
          background: (p.stock ?? 0) > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${(p.stock ?? 0) > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
          borderRadius: '999px', padding: '0.1rem 0.5rem',
        }}>
          {(p.stock ?? 0) > 0 ? `✓ ${p.stock}` : '✗ Hết'}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" style={{ fontSize: '0.78rem' }} onClick={() => onEdit(p)}>
            ✏️ Sửa
          </Btn>
          <Btn
            style={{ fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            disabled={isDeleting}
            onClick={() => {
              if (window.confirm(`Xóa sản phẩm "${p.name}"? Hành động này không thể hoàn tác.`)) {
                onDelete(p._id)
              }
            }}
          >
            🗑️
          </Btn>
        </div>
      </td>
    </tr>
  )
}

// ── main page ───────────────────────────────────────────────────────────────
export function AdminProductsPage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [mutErr, setMutErr] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search.trim()) params.set('q', search.trim())
      return apiRequest<PaginatedResponse<Product>>(`/products/admin/list?${params}`)
    },
    staleTime: 20_000,
  })

  const createMut = useMutation({
    mutationFn: (body: object) =>
      apiRequest<Product>('/products/admin', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      setMode('list')
      setMutErr('')
    },
    onError: (e: any) => setMutErr(e?.message ?? 'Tạo thất bại'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      apiRequest<Product>(`/products/admin/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      setMode('list')
      setEditTarget(null)
      setMutErr('')
    },
    onError: (e: any) => setMutErr(e?.message ?? 'Cập nhật thất bại'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/products/admin/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = data?.hasMore ?? false

  function openEdit(p: Product) {
    setEditTarget(p)
    setMutErr('')
    setMode('edit')
  }

  function openCreate() {
    setEditTarget(null)
    setMutErr('')
    setMode('create')
  }

  // ── list view ─────────────────────────────────────────────────────
  if (mode === 'list') {
    return (
      <div className="page-padding content-shell">
        <section className="hero-panel compact" style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow">Admin · Cửa hàng</p>
          <h1>Quản lý sản phẩm</h1>
          <p>Thêm, sửa, xóa sản phẩm trong cửa hàng esports. Sản phẩm mới sẽ hiển thị ngay trên trang /store.</p>
        </section>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          <input
            className="tab"
            placeholder="🔍 Tìm theo tên sản phẩm…"
            style={{ flex: '1 1 260px' }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <Btn onClick={openCreate} style={{ flexShrink: 0 }}>
            ➕ Thêm sản phẩm
          </Btn>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {[
            { label: 'Tổng sản phẩm', value: total, color: '#60a5fa' },
            { label: 'Còn hàng', value: products.filter((p) => (p.stock ?? 0) > 0).length, color: '#4ade80' },
            { label: 'Hết hàng', value: products.filter((p) => (p.stock ?? 0) === 0).length, color: '#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} className="surface-card" style={{ padding: '0.75rem 1.1rem', minWidth: 110 }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '1.6rem', fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>

        <SectionHeader title="Danh sách sản phẩm" subtitle={total > 0 ? `${total} sản phẩm` : undefined} />
        <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>Đang tải…</td></tr>
              )}
              {!isLoading && products.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                    <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📦</p>
                    <p style={{ margin: 0 }}>
                      {search ? `Không tìm thấy sản phẩm khớp "${search}".` : 'Chưa có sản phẩm nào.'}
                    </p>
                    <Btn style={{ marginTop: '0.85rem' }} onClick={openCreate}>➕ Thêm sản phẩm đầu tiên</Btn>
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <ProductRow
                  key={p._id}
                  p={p}
                  onEdit={openEdit}
                  onDelete={(id) => deleteMut.mutate(id)}
                  isDeleting={deleteMut.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <Btn variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Btn>
            <span style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>Trang {page}</span>
            <Btn variant="ghost" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Tiếp →</Btn>
          </div>
        )}
      </div>
    )
  }

  // ── create / edit view ─────────────────────────────────────────────
  const isEdit = mode === 'edit' && editTarget !== null
  const formTitle = isEdit ? `Chỉnh sửa: ${editTarget!.name}` : 'Thêm sản phẩm mới'
  const isSubmitting = createMut.isPending || updateMut.isPending

  return (
    <div className="page-padding content-shell">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        <button
          type="button"
          onClick={() => { setMode('list'); setMutErr('') }}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          ← Danh sách sản phẩm
        </button>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formTitle}</span>
      </div>

      <div className="surface-card" style={{ maxWidth: 780 }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.6rem' }}>{isEdit ? '✏️' : '📦'}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{formTitle}</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                {isEdit ? 'Thay đổi sẽ được lưu ngay vào cơ sở dữ liệu.' : 'Điền đầy đủ thông tin để đăng sản phẩm lên cửa hàng.'}
              </p>
            </div>
          </div>
        </div>

        <ProductForm
          initial={isEdit ? productToForm(editTarget!) : EMPTY_FORM}
          isEdit={isEdit}
          isLoading={isSubmitting}
          error={mutErr}
          onCancel={() => { setMode('list'); setMutErr('') }}
          onSave={(payload) => {
            if (isEdit) {
              updateMut.mutate({ id: editTarget!._id, body: payload })
            } else {
              createMut.mutate(payload)
            }
          }}
        />
      </div>
    </div>
  )
}
