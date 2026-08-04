'use client'

/**
 * Teachers do not create projects in the MVP — companies own that flow via
 * `/company/*`. This route now redirects to the read-only project oversight
 * page, which surfaces a banner explaining why.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoadingState } from '@/components/ui'
import { useTranslations } from '@/lib/i18n'

const REDIRECT_TARGET = '/teacher/projects?notice=companies-own-projects'

export default function AddProjectPage() {
  const { t } = useTranslations()
  const router = useRouter()

  useEffect(() => {
    router.replace(REDIRECT_TARGET)
  }, [router])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <LoadingState message={t('teacher.redirectNotice')} />
      <Link href={REDIRECT_TARGET} className="text-sm text-primary hover:underline">
        {t('teacher.redirectManualLink')}
      </Link>
    </div>
  )
}
