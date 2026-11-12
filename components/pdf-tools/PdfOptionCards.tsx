'use client'

interface OptionCard<T extends string> {
  value: T
  title: string
  desc: string
  badge?: string
}

interface PdfOptionCardsProps<T extends string> {
  options: OptionCard<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  columns?: 2 | 3
}

export function PdfOptionCards<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  columns = 3,
}: PdfOptionCardsProps<T>) {
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2`}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-pressed={active}
            className={`relative text-left rounded-xl border px-3 py-3 transition-all disabled:opacity-50 ${
              active
                ? 'border-cyan-400 bg-cyan-50/50 ring-1 ring-cyan-200'
                : 'border-gray-200 bg-white hover:border-cyan-300'
            }`}
          >
            {option.badge && (
              <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                {option.badge}
              </span>
            )}
            <p className={`text-sm font-semibold ${active ? 'text-cyan-800' : 'text-gray-900'}`}>{option.title}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{option.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
