import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  current: number
  total: number
  pageSize?: number
  onChange: (page: number) => void
}

export function Pagination({ current, total, pageSize = 20, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const start = Math.max(1, current - 2)
  const end = Math.min(totalPages, current + 2)
  const pages: (number | '...')[] = []
  if (start > 1) pages.push(1)
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push('...')
  if (end < totalPages) pages.push(totalPages)

  const from = (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  return (
    <div className="pagination">
      <span className="pagination-info">
        显示 {from}-{to}，共 {total} 条
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
          aria-label="上一页"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination-btn" style={{ cursor: 'default', border: 'none' }}>
              ···
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-btn${current === p ? ' is-active' : ''}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1)}
          aria-label="下一页"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
