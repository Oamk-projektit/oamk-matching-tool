'use client'

import { localeLabels, locales, useTranslations } from '@/lib/i18n'

type LanguageSwitcherProps = {
  /** denser row for desktop header */
  compact?: boolean
  className?: string
}

export function LanguageSwitcher({
  compact = false,
  className = '',
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslations()

  return (
    <div
      className={`${compact ? 'flex items-center gap-1' : 'px-4 py-3'} ${className}`}
      role="group"
      aria-label={t('common.language')}
    >
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wide text-[#666666] mb-2">
          {t('common.language')}
        </p>
      )}
      <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
        {locales.map((code) => {
          const active = locale === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={active}
              className={
                compact
                  ? `min-w-9 rounded px-2 py-1 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#005EB8] text-white'
                        : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#171717]'
                    }`
                  : `flex-1 rounded border px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#005EB8] bg-[#005EB8] text-white'
                        : 'border-[#e0e0e0] bg-white text-[#171717] hover:border-[#005EB8]'
                    }`
              }
            >
              {compact ? code.toUpperCase() : localeLabels[code]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
