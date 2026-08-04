'use client'

import React, { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  FormSection,
  Input,
  LoadingState,
  ProgressBar,
  Select,
  StatusBadge,
  Tag,
} from '@/components/ui'

const colorSwatches = [
  { name: 'Primary', className: 'bg-primary text-white', hex: '#005EB8' },
  { name: 'Primary hover', className: 'bg-primary-hover text-white', hex: '#004A94' },
  { name: 'Primary soft', className: 'bg-primary-soft text-primary', hex: '#EAF3FC' },
  { name: 'Background', className: 'bg-background text-foreground border border-border', hex: '#F7F9FC' },
  { name: 'Surface', className: 'bg-surface text-foreground border border-border', hex: '#FFFFFF' },
  { name: 'Border', className: 'bg-border text-foreground', hex: '#D8E0EA' },
  { name: 'Success', className: 'bg-success text-white', hex: '#15803D' },
  { name: 'Warning', className: 'bg-warning text-white', hex: '#B45309' },
  { name: 'Error', className: 'bg-error text-white', hex: '#B91C1C' },
  { name: 'Info', className: 'bg-info text-white', hex: '#0369A1' },
]

export default function StyleGuidePage() {
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const simulateSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1200)
  }

  const simulateDelete = () => {
    setIsDeleting(true)
    setTimeout(() => {
      setIsDeleting(false)
      setIsDialogOpen(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-foreground">Design System Guide</h1>
          <p className="text-lg text-foreground-muted">OAMK Matching Tool UI Components</p>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {colorSwatches.map((swatch) => (
                <div key={swatch.name} className="space-y-2">
                  <div className={`flex h-20 items-center justify-center rounded font-semibold ${swatch.className}`}>
                    {swatch.name}
                  </div>
                  <p className="text-sm text-foreground-muted">{swatch.hex}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Sizes</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Loading state</h3>
              <Button isLoading={isSaving} onClick={simulateSave}>
                {isSaving ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form fields */}
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <FormSection
              title="Basic information"
              description="This information helps companies understand who you are."
            >
              <Input
                label="Full name"
                required
                placeholder="e.g. Maija Meikäläinen"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
              />
              <Input
                label="Email"
                type="email"
                helperText="We only use this to contact you about applications."
                placeholder="name@students.oamk.fi"
              />
              <Input label="Phone number" error="Enter a valid phone number." placeholder="+358..." />
              <Select
                label="Preferred work mode"
                placeholder="Select an option"
                options={[
                  { value: 'onsite', label: 'On-site' },
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'remote', label: 'Remote' },
                ]}
              />
            </FormSection>
          </CardContent>
        </Card>

        {/* Tags & match */}
        <Card>
          <CardHeader>
            <CardTitle>Tags &amp; Matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Skill tags</h3>
              <div className="flex flex-wrap gap-2">
                <Tag variant="primary">React</Tag>
                <Tag>TypeScript</Tag>
                <Tag variant="muted">Supabase (missing)</Tag>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Match score</h3>
              <ProgressBar value={85} tone="match" label="Frontend Developer Project" />
              <ProgressBar value={55} tone="match" label="Backend API Project" />
              <ProgressBar value={20} tone="match" label="Data Analysis Project" />
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Application status</h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="submitted" />
                <StatusBadge status="under_review" />
                <StatusBadge status="shortlisted" />
                <StatusBadge status="selected" />
                <StatusBadge status="not_selected" />
                <StatusBadge status="withdrawn" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Project status</h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="draft" />
                <StatusBadge status="published" />
                <StatusBadge status="closed" />
                <StatusBadge status="archived" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Legacy Badge (backward compatible)</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="pending">Pending Review</Badge>
                <Badge variant="approved">Approved</Badge>
                <Badge variant="matched">Matched</Badge>
                <Badge variant="default">Default</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="success" title="Profile saved">
              Your changes have been saved.
            </Alert>
            <Alert variant="warning" title="Profile incomplete">
              Add your skills so companies can find you.
            </Alert>
            <Alert variant="error" title="Could not submit application">
              Something went wrong. Try again.
            </Alert>
            <Alert variant="info" title="Applications close soon">
              This project stops accepting applications in 3 days.
            </Alert>
          </CardContent>
        </Card>

        {/* Empty / Loading / Error states */}
        <Card>
          <CardHeader>
            <CardTitle>Empty, Loading &amp; Error States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <EmptyState
              title="No applications yet"
              description="Browse available projects and apply to ones that match your skills."
              action={<Button size="sm">Browse projects</Button>}
            />
            <LoadingState message="Loading projects..." />
            <ErrorState
              message="Projects could not be loaded. Try again."
              onRetry={() => undefined}
            />
          </CardContent>
        </Card>

        {/* Confirmation dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmation Dialog</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-foreground-muted">
              Destructive actions require confirmation before they run.
            </p>
            <Button variant="danger" onClick={() => setIsDialogOpen(true)}>
              Withdraw application
            </Button>
            <ConfirmationDialog
              isOpen={isDialogOpen}
              title="Withdraw application?"
              message="This cannot be undone. The company will no longer see your application."
              confirmLabel="Withdraw"
              cancelLabel="Keep application"
              variant="danger"
              isConfirming={isDeleting}
              onConfirm={simulateDelete}
              onCancel={() => setIsDialogOpen(false)}
            />
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
            <h2 className="text-2xl font-semibold text-foreground">Heading 2</h2>
            <h3 className="text-xl font-semibold text-foreground">Heading 3</h3>
            <p className="text-base text-foreground">
              Body text: This is a standard paragraph. It uses a comfortable line height for readability.
            </p>
            <p className="text-sm text-foreground-muted">Small text for captions and helper text</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
