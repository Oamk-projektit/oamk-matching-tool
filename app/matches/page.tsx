'use client'

import { useTranslations } from '@/lib/i18n'

export default function MatchesPage() {
  const { t } = useTranslations()

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#171717] mb-6">{t('matches.title')}</h1>
        <p className="text-[#666666] mb-6">{t('matches.description')}</p>
      </div>
    </div>
  )
}
