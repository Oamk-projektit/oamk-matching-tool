'use client'

import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { useTranslations } from '@/lib/i18n'

interface RoleCard {
  title: string
  description: string
  cta: string
  href: string
  variant: 'primary' | 'outline'
}

export default function Home() {
  const { t } = useTranslations()

  const roleCards: RoleCard[] = [
    {
      title: t('home.studentTitle'),
      description: t('home.studentDescription'),
      cta: t('home.studentCta'),
      href: '/register',
      variant: 'primary',
    },
    {
      title: t('home.companyTitle'),
      description: t('home.companyDescription'),
      cta: t('home.companyCta'),
      href: '/register?role=company',
      variant: 'primary',
    },
    {
      title: t('home.teacherTitle'),
      description: t('home.teacherDescription'),
      cta: t('home.teacherCta'),
      href: '/teacher/login',
      variant: 'outline',
    },
  ]

  const steps = [
    { title: t('home.howItWorksStep1Title'), description: t('home.howItWorksStep1Description') },
    { title: t('home.howItWorksStep2Title'), description: t('home.howItWorksStep2Description') },
    { title: t('home.howItWorksStep3Title'), description: t('home.howItWorksStep3Description') },
  ]

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-16">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">{t('home.title')}</h1>
          <p className="text-lg text-foreground-secondary">{t('home.subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {roleCards.map((card) => (
            <Card key={card.title} className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm text-foreground-muted">{card.description}</p>
              <Link href={card.href} className="mt-6 block">
                <Button variant={card.variant} className="w-full justify-center">
                  {card.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            {t('home.howItWorksTitle')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center text-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-foreground-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center border-t border-border pt-8">
          <p className="text-sm text-foreground-muted">
            {t('home.hasAccount')}{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
              {t('home.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
