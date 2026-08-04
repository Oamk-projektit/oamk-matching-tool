'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { Alert, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTranslations } from '@/lib/i18n'

function CompanyProfileContent() {
  const { t } = useTranslations()
  const { profile, companyId } = useAuth()

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">
          {t('company.profile.title')}
        </h1>
        <p className="mt-1 mb-6 text-foreground-muted">
          {t('company.profile.description')}
        </p>

        <Card>
          <CardHeader>
            <CardTitle>{t('company.profile.accountSectionTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">
                {t('company.profile.displayNameLabel')}
              </p>
              <p className="text-base text-foreground">
                {profile?.displayName ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">
                {t('company.profile.emailLabel')}
              </p>
              <p className="text-base text-foreground">{profile?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">
                {t('company.profile.companyIdLabel')}
              </p>
              <p className="font-mono text-sm text-foreground">
                {companyId ?? t('company.profile.noCompanyLinked')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-secondary">
                {t('company.profile.languageLabel')}
              </p>
              <p className="text-base text-foreground">
                {profile?.preferredLanguage === 'fi'
                  ? t('company.projectForm.languageFi')
                  : t('company.projectForm.languageEn')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert variant="info" className="mt-4">
          {t('company.profile.readOnlyNote')}
        </Alert>
      </div>
    </div>
  )
}

export default function CompanyProfilePage() {
  return (
    <RoleGuard allowedRoles={['company']}>
      <CompanyProfileContent />
    </RoleGuard>
  )
}
