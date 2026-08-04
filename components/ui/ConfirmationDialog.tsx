'use client'

import React, { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

export interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  /** Disables actions and shows a spinner on the confirm button while the action runs. */
  isConfirming?: boolean
  /** Use 'danger' for destructive actions (DESIGN.md: destructive actions require confirmation). */
  variant?: 'default' | 'danger'
}

/**
 * Modal confirmation dialog built on the native <dialog> element, which provides
 * focus trapping and an inert background for free. Escape closes it; clicking the
 * backdrop closes it; both routes call `onCancel` so the parent stays in control.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
  variant = 'default',
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // The native "cancel" event fires on Escape; prevent the default close so the
    // parent-controlled `isOpen` prop stays the single source of truth.
    const handleCancel = (event: Event) => {
      event.preventDefault()
      onCancel()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onCancel])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
      onClick={(event) => {
        // A click that lands on the <dialog> element itself (not its content) is
        // effectively a backdrop click, since the ::backdrop pseudo-element isn't in the DOM.
        if (event.target === dialogRef.current) {
          onCancel()
        }
      }}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-sm text-foreground-secondary">
          {message}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
