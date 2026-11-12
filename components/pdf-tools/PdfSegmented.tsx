'use client'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface PdfSegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  fullWidth?: boolean
  disabled?: boolean
}

export function PdfSegmented<T extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
  disabled = false,
}: PdfSegmentedProps<T>) {
  return (
    <div
      className={`inline-flex flex-wrap items-center rounded-lg border border-gray-300 p-0.5 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={value === option.value}
          className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
            value === option.value ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
