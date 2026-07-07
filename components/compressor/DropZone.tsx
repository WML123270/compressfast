'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, AlertCircle } from 'lucide-react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { getLimits } from '@/lib/compression/types'
import { formatFileSize } from '@/lib/compression/utils'
import { useT } from '@/lib/i18n/context'

const ACCEPT = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/svg+xml': ['.svg'],
  'image/heic': ['.heic', '.heif'],
}

export function DropZone() {
  const { t } = useT()
  const { files, addFiles, isCompressing, isPro } = useCompressionStore()
  const limits = getLimits(isPro)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null)
      if (fileRejections.length > 0) {
        const first = fileRejections[0]?.errors[0]
        if (first?.code === 'file-too-large') setError(t('dropzone.error.tooLarge', { maxSize: formatFileSize(limits.maxSizePerFile) }))
        else if (first?.code === 'file-invalid-type') setError(t('dropzone.error.unsupported'))
        else if (first?.code === 'too-many-files') setError(t('dropzone.error.tooMany', { maxFiles: limits.maxFiles }))
        else setError(t('dropzone.error.invalid'))
        return
      }
      const imageFiles = acceptedFiles.filter(f => f.type.startsWith('image/'))
      if (imageFiles.length === 0) {
        setError(t('dropzone.error.imagesOnly'))
        return
      }
      const available = limits.maxFiles - files.length
      if (available <= 0) {
        setError(t('dropzone.error.tooMany', { maxFiles: limits.maxFiles }))
        return
      }
      if (imageFiles.length > available) {
        setError(t('dropzone.remaining', { n: available }))
      }
      addFiles(imageFiles)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files.length, addFiles, t]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: limits.maxSizePerFile,
    maxFiles: limits.maxFiles,
    disabled: isCompressing,
    multiple: true,
  })

  const remaining = limits.maxFiles - files.length

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={[
          'relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dropzone-active'
            : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800',
          isCompressing ? 'opacity-50 pointer-events-none' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
        <p className="text-base font-medium text-slate-700 dark:text-slate-200 mb-1">
          {isDragActive ? t('dropzone.dragActive') : t('dropzone.drag')}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isPro
            ? t('dropzone.hintPro', { maxFiles: limits.maxFiles, maxSize: formatFileSize(limits.maxSizePerFile) })
            : t('dropzone.hint', { maxFiles: limits.maxFiles, maxSize: formatFileSize(limits.maxSizePerFile) })
          }
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {t('dropzone.paste')}
        </p>
        {remaining < limits.maxFiles && remaining > 0 && (
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-2">{t('dropzone.remaining', { n: remaining })}</p>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
