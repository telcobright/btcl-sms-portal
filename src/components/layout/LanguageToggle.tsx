'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

interface LanguageToggleProps {
  variant?: 'header' | 'mobile'
}

export function LanguageToggle({ variant = 'header' }: LanguageToggleProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (target: 'en' | 'bn') => {
    if (target === locale) return
    const newPath = pathname.startsWith(`/${locale}`)
      ? pathname.replace(`/${locale}`, `/${target}`)
      : `/${target}${pathname}`
    router.push(newPath)
    router.refresh()
  }

  const isEn = locale === 'en'
  const containerBase =
    variant === 'mobile'
      ? 'mx-auto flex w-fit items-center rounded-full border border-white/30 bg-white/10 p-1'
      : 'inline-flex items-center rounded-full border border-white/30 bg-white/10 p-1'

  const optionBase =
    'relative z-10 cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition-colors duration-300 select-none'

  return (
    <div
      role="switch"
      aria-checked={!isEn}
      aria-label="Switch language"
      tabIndex={0}
      onClick={() => switchTo(isEn ? 'bn' : 'en')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          switchTo(isEn ? 'bn' : 'en')
        }
      }}
      className={`${containerBase} relative cursor-pointer transition-colors hover:bg-white/15`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-all duration-300 ease-out ${
          isEn ? 'left-1' : 'left-[calc(50%+0.0rem)]'
        }`}
      />
      <span
        className={`${optionBase} ${isEn ? 'text-btcl-primary' : 'text-white/80'}`}
      >
        EN
      </span>
      <span
        className={`${optionBase} ${!isEn ? 'text-btcl-primary' : 'text-white/80'}`}
      >
        বাং
      </span>
    </div>
  )
}
