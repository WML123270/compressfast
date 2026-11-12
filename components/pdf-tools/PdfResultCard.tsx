'use client'

import type { ReactNode } from 'react'
import { CheckCircle2, Download, RefreshCw } from 'lucide-react'

interface PdfResultCardProps {
  title: string
  children?: ReactNode
  warning?: string
  note?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  extra?: ReactNode
  disabled?: boolean
}

export function PdfResultCard({
  title,
  children,
  warning,
  note,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  extra,
  disabled = false,
}: PdfResultCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-center gap-2 text-emerald-700">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        <p className="font-semibold text-sm sm:text-base text-center">{title}</p>
      </div>

      {children && <div className="text-center text-sm text-gray-700">{children}</div>}

      {warning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
          {warning}
        </div>
      )}

      {note && <p className="text-xs text-gray-500 text-center">{note}</p>}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {primaryLabel}
        </button>

        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            disabled={disabled}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:border-cyan-300 disabled:opacity-40"
          >
            <RefreshCw className="w-4 h-4" />
            {secondaryLabel}
          </button>
        )}

        {extra}
      </div>
    </div>
  )
}
