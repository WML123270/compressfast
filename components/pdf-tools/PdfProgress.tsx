'use client'

interface PdfProgressProps {
  done: number
  total: number
  label?: string
  indeterminate?: boolean
}

export function PdfProgress({ done, total, label, indeterminate = false }: PdfProgressProps) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs text-gray-600" aria-live="polite">
          <span className="truncate">{label}</span>
          {!indeterminate && <span className="tabular-nums">{pct}%</span>}
        </div>
      )}
      <div
        className="h-1.5 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : pct}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ${
            indeterminate ? 'w-1/3 animate-pulse' : ''
          }`}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
