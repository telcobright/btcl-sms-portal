import { Lock } from 'lucide-react'

export function AggregatorTag({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={
        tone === 'light'
          ? 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700'
          : 'inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm'
      }
    >
      <Lock className="h-3 w-3 flex-shrink-0" strokeWidth={2.4} />
      Only for SMS Aggregator
    </span>
  )
}
