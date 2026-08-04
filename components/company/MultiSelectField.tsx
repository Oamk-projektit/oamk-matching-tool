'use client'

import React, { useId, useMemo, useState } from 'react'
import { Input, Tag } from '@/components/ui'

export interface MultiSelectOption {
  id: string
  label: string
  sublabel?: string
}

export interface MultiSelectFieldProps {
  label: string
  options: MultiSelectOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  searchLabel: string
  searchPlaceholder?: string
  noResultsLabel: string
  helperText?: string
  disabled?: boolean
}

/**
 * Searchable multi-select for catalog entities (courses, skills, interests).
 * Selected items render as removable `Tag` chips; the checklist below is
 * filtered by a search box so long catalogs stay usable.
 */
export function MultiSelectField({
  label,
  options,
  selectedIds,
  onChange,
  searchLabel,
  searchPlaceholder,
  noResultsLabel,
  helperText,
  disabled,
}: MultiSelectFieldProps) {
  const [search, setSearch] = useState('')
  const listId = useId()

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const optionsById = useMemo(() => {
    const map = new Map<string, MultiSelectOption>()
    for (const option of options) map.set(option.id, option)
    return map
  }, [options])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        option.sublabel?.toLowerCase().includes(q)
    )
  }, [options, search])

  function toggle(id: string) {
    if (disabled) return
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((existing) => existing !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id: string) {
    if (disabled) return
    onChange(selectedIds.filter((existing) => existing !== id))
  }

  return (
    <div className="w-full">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>

      {selectedIds.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const option = optionsById.get(id)
            if (!option) return null
            return (
              <Tag key={id} variant="primary">
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="ml-1.5 text-primary/70 hover:text-primary"
                    aria-label={`Remove ${option.label}`}
                  >
                    &times;
                  </button>
                )}
              </Tag>
            )
          })}
        </div>
      )}

      <Input
        label={searchLabel}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={searchPlaceholder}
        disabled={disabled}
        aria-controls={listId}
      />

      <div
        id={listId}
        className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border bg-surface p-2"
      >
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-sm text-foreground-muted">
            {noResultsLabel}
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((option) => (
              <li key={option.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(option.id)}
                    onChange={() => toggle(option.id)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">
                    {option.label}
                    {option.sublabel && (
                      <span className="ml-1 text-foreground-muted">
                        {option.sublabel}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {helperText && (
        <p className="mt-1.5 text-sm text-foreground-muted">{helperText}</p>
      )}
    </div>
  )
}
