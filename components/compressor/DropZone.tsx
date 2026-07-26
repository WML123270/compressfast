'use client'

import { useCallback, useState, useRef } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, AlertCircle, Loader2, Camera } from 'lucide-react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { getLimits, MONTHLY_FREE_QUOTA, getMonthlyQuota } from '@/lib/compression/types'
import { formatFileSize } from '@/lib/compression/utils'
import { useT } from '@/lib/i18n/context'
import { isCnDeploy } from '@/lib/utils'
import { SAMPLE_IMAGES, type SampleImage } from '@/lib/sample-images'

const ACCEPT = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/svg+xml': ['.svg'],
  'image/heic': ['.heic', '.heif'],
}

export function DropZone() {
  const { t, locale } = useT()
  const { files, addFiles, isCompressing, isPro } = useCompressionStore()
  const limits = getLimits(isPro)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [sampleLoading, setSampleLoading] = useState<string | null>(null)

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFiles = e.target.files
    if (!capturedFiles || capturedFiles.length === 0) return
    setError(null)

    const imageFiles = Array.from(capturedFiles).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError(t('dropzone.error.imagesOnly'))
      return
    }

    const available = limits.maxFiles - files.length
    if (available <= 0) {
      setError(t('dropzone.error.tooMany', { maxFiles: limits.maxFiles }))
      return
    }

    // Monthly quota check for free users
    if (!isPro && !isCnDeploy()) {
      const q = getMonthlyQuota()
      if (q.count >= MONTHLY_FREE_QUOTA) {
        setError(t('pro.quotaExceeded'))
        return
      }
    }

    addFiles(imageFiles)

    // Reset input value so same camera can be opened again
    e.target.value = ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length, addFiles, t, isPro, limits])

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
      // Monthly quota check for free users (overseas only)
      if (!isPro && !isCnDeploy()) {
        const q = getMonthlyQuota()
        if (q.count >= MONTHLY_FREE_QUOTA) {
          setError(t('pro.quotaExceeded'))
          return
        }
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

  const handleSample = useCallback(async (sample: SampleImage) => {
    setSampleLoading(sample.name)
    setError(null)
    try {
      const file = await sample.generator()
      addFiles([file])
    } catch {
      setError(t('dropzone.samples.error'))
    }
    setSampleLoading(null)
  }, [addFiles, t])

  const remaining = limits.maxFiles - files.length
  const isZh = locale === 'zh'

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={[
          'relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-blue-400 bg-blue-50 shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-[1.02]'
            : 'border-gray-200 hover:border-blue-400 hover:bg-white/5',
          isCompressing ? 'opacity-50 pointer-events-none' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <p className="font-semibold text-neutral-900 mb-2">
          {isDragActive ? t('dropzone.dragActive') : t('dropzone.drag')}
        </p>
        <p className="text-neutral-700 max-w-sm mx-auto">
          {isPro
            ? t('dropzone.hintPro', { maxFiles: limits.maxFiles, maxSize: formatFileSize(limits.maxSizePerFile) })
            : t('dropzone.hint', { maxFiles: limits.maxFiles, maxSize: formatFileSize(limits.maxSizePerFile) })
          }
        </p>
        <p className="text-neutral-700 mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">
          {t('dropzone.paste')}
          <kbd className="hidden sm:inline text-[10px] px-1 py-0.5 rounded bg-gray-200 text-neutral-700 font-mono">⌘V</kbd>
        </p>

        {/* Camera capture — primary action for mobile users */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {/* Hidden camera input with capture="environment" for rear camera */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraCapture}
            multiple
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              cameraInputRef.current?.click()
            }}
            disabled={isCompressing}
            className="inline-flex items-center gap-2 px-5 py-3 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/20 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="sm:hidden">{t('dropzone.camera')}</span>
            <span className="hidden sm:inline">{t('dropzone.camera')}</span>
          </button>
        </div>

        {remaining < limits.maxFiles && remaining > 0 && (
          <p className="text-blue-600 mt-3">{t('dropzone.remaining', { n: remaining })}</p>
        )}
      </div>

      {/* Sample images — only show when no files loaded */}
      {files.length === 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <p className="text-xs text-neutral-700 whitespace-nowrap">{t('dropzone.samples.label')}</p>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_IMAGES.map((sample) => {
              const isLoading = sampleLoading === sample.name
              return (
                <button
                  key={sample.name}
                  onClick={() => handleSample(sample)}
                  disabled={isCompressing || sampleLoading !== null}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : sample.icon}
                  </span>
                  <span className="text-xs font-medium text-neutral-800 group-hover:text-blue-600 transition-colors">
                    {isZh
                      ? { photo: '风景照', screenshot: '截图', design: 'Logo', gradient: '渐变' }[sample.name]
                      : { photo: 'Photo', screenshot: 'Screenshot', design: 'Logo', gradient: 'Gradient' }[sample.name]
                    }
                  </span>
                  <span className="text-[10px] text-neutral-600">{sample.size}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-slide-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
