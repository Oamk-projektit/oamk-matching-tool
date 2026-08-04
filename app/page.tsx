'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { useTranslations } from '@/lib/i18n'

export default function Home() {
  const { t } = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-white px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#005EB8] rounded-lg" />
        </div>

        <div>
          <h1 className="text-5xl font-bold text-[#171717] mb-4">{t('home.title')}</h1>
          <p className="text-xl text-[#666666]">{t('home.subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              {t('home.ctaStudent')}
            </Button>
          </Link>
          <Link href="/teacher/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              {t('home.ctaTeacher')}
            </Button>
          </Link>
        </div>

        <div className="pt-8 border-t border-[#e0e0e0]">
          <p className="text-sm text-[#666666]">
            {t('home.hasAccount')}{' '}
            <Link href="/login" className="text-[#005EB8] font-semibold hover:text-[#004A94]">
              {t('home.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
