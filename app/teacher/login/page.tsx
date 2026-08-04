'use client'

import { useTranslations } from '@/lib/i18n'

export default function TeacherLoginPage() {
  const { t } = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-[#171717] mb-6">{t('teacher.loginTitle')}</h1>
        <p className="text-[#666666] mb-6">{t('teacher.loginDescription')}</p>
      </div>
    </div>
  )
}
