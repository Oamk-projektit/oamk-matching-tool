'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  Tag,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import type { Match } from '@/types/domain'

interface MatchWithProject {
  match: Match
  projectTitle: string | null
}

export default function MatchesPage() {
  useStudentOnlyGuard()
  const { t } = useTranslations()
  const { studentId, loading: authLoading } = useAuth()

  const [items, setItems] = useState<MatchWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [runNotice, setRunNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const matches = await api.getMatchesForStudent(studentId)
      const withProjects = await Promise.all(
        matches.map(async (match) => {
          try {
            const project = await api.getProject(match.projectId)
            return { match, projectTitle: project.title }
          } catch {
            return { match, projectTitle: null }
          }
        })
      )
      setItems(withProjects)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('matches.errorMessage'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  useEffect(() => {
    if (authLoading) return
     
    void load()
  }, [authLoading, load])

  async function handleRunMatches() {
    if (!studentId) return
    setRunning(true)
    setRunError(null)
    setRunNotice(null)
    try {
      await api.runMatches(studentId)
      setRunNotice(t('matches.runSuccess'))
      await load()
    } catch (err) {
      setRunError(err instanceof ApiClientError ? err.message : t('matches.runError'))
    } finally {
      setRunning(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('matches.loadingMessage')} />
      </div>
    )
  }

  if (!studentId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title={t('matches.noProfile.title')}
          description={t('matches.noProfile.description')}
          action={
            <Link href="/profile/edit">
              <Button>{t('matches.noProfile.cta')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('matches.title')}</h1>
          <p className="text-foreground-muted">{t('matches.description')}</p>
        </div>
        <Button onClick={handleRunMatches} isLoading={running}>
          {running ? t('matches.running') : t('matches.runButton')}
        </Button>
      </div>

      {runError && (
        <Alert variant="error" className="mb-4">
          {runError}
        </Alert>
      )}
      {runNotice && (
        <Alert variant="success" className="mb-4">
          {runNotice}
        </Alert>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={t('matches.empty.title')}
          description={t('matches.empty.description')}
          action={
            <Button onClick={handleRunMatches} isLoading={running}>
              {t('matches.empty.cta')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map(({ match, projectTitle }) => (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{projectTitle ?? match.projectId}</CardTitle>
                  <Link href={`/projects/${match.projectId}`} className="text-sm font-semibold text-primary hover:underline">
                    {t('matches.viewProject')}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar value={match.totalScore} tone="match" label={t('matches.scoreLabel')} />

                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">{t('matches.explanationLabel')}</p>
                  <p className="text-sm text-foreground-secondary">{match.explanation}</p>
                </div>

                {(match.matchedSkills.length > 0 || match.missingRequiredSkills.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{t('matches.matchedSkills')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.matchedSkills.length === 0 && (
                          <span className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</span>
                        )}
                        {match.matchedSkills.map((skill) => (
                          <Tag key={skill} variant="primary">{skill}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{t('matches.missingSkills')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.missingRequiredSkills.length === 0 && (
                          <span className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</span>
                        )}
                        {match.missingRequiredSkills.map((skill) => (
                          <Tag key={skill} variant="muted">{skill}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(match.matchedCourses.length > 0 || match.missingRequiredCourses.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{t('matches.matchedCourses')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.matchedCourses.length === 0 && (
                          <span className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</span>
                        )}
                        {match.matchedCourses.map((course) => (
                          <Tag key={course} variant="primary">{course}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{t('matches.missingCourses')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.missingRequiredCourses.length === 0 && (
                          <span className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</span>
                        )}
                        {match.missingRequiredCourses.map((course) => (
                          <Tag key={course} variant="muted">{course}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
