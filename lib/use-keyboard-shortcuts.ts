'use client'

import { useEffect } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'

/**
 * Global keyboard shortcuts for the compressor:
 * - Ctrl+Enter / Cmd+Enter → Compress all pending files
 * - Ctrl+Z / Cmd+Z       → Undo last file removal
 * - Escape                → (reserved for future use: close panels)
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()
      const isEditing = tag === 'input' || tag === 'textarea' || target.isContentEditable
      if (isEditing) return

      const mod = e.ctrlKey || e.metaKey

      // Ctrl+Enter → Compress all
      if (mod && e.key === 'Enter') {
        e.preventDefault()
        const { files, isCompressing, compressAll } = useCompressionStore.getState()
        const pending = files.filter(f => f.status === 'pending')
        if (pending.length > 0 && !isCompressing) {
          compressAll()
        }
        return
      }

      // Ctrl+Z → Undo last removal
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useCompressionStore.getState().undoRemove()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
