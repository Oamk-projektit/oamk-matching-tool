'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import { useTranslations } from '@/lib/i18n'

export default function TeacherLoginPage() {
  const { t } = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm
        title={t('teacher.loginTitle')}
        description={t('teacher.loginDescription')}
        helperText={t('teacher.loginHelp')}
        hideRegisterLink
      />
    </div>
  )
}
