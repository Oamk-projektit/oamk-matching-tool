'use client'

import React, { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from '@/components/ui'

export default function StyleGuidePage() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-[#171717] mb-2">Design System Guide</h1>
          <p className="text-lg text-[#666666]">OAMK Matching Tool UI Components</p>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-[#005EB8] rounded flex items-center justify-center text-white font-semibold">
                  Primary Blue
                </div>
                <p className="text-sm text-[#666666]">#005EB8</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-[#004A94] rounded flex items-center justify-center text-white font-semibold">
                  Primary Hover
                </div>
                <p className="text-sm text-[#666666]">#004A94</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-[#f5f5f5] rounded border-2 border-[#e0e0e0] flex items-center justify-center font-semibold">
                  Light Gray
                </div>
                <p className="text-sm text-[#666666]">#f5f5f5</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-[#e0e0e0] rounded flex items-center justify-center text-[#171717] font-semibold">
                  Medium Gray
                </div>
                <p className="text-sm text-[#666666]">#e0e0e0</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-[#22c55e] rounded flex items-center justify-center text-white font-semibold">
                  Success
                </div>
                <p className="text-sm text-[#666666]">#22c55e</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-[#ef4444] rounded flex items-center justify-center text-white font-semibold">
                  Error
                </div>
                <p className="text-sm text-[#666666]">#ef4444</p>
              </div>
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
              <h3 className="text-sm font-semibold text-[#171717] mb-3">Primary</h3>
              <div className="flex gap-2">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#171717] mb-3">Secondary</h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  Small
                </Button>
                <Button variant="secondary" size="md">
                  Medium
                </Button>
                <Button variant="secondary" size="lg">
                  Large
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#171717] mb-3">Outline</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Small
                </Button>
                <Button variant="outline" size="md">
                  Medium
                </Button>
                <Button variant="outline" size="lg">
                  Large
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Standard Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Input with Helper Text"
              placeholder="Enter text..."
              helperText="This is a helper text"
            />
            <Input
              label="Input with Error"
              placeholder="Enter text..."
              error="This field is required"
            />
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="pending">Pending Review</Badge>
              <Badge variant="approved">Approved</Badge>
              <Badge variant="matched">Matched</Badge>
              <Badge variant="default">Default</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#666666] mb-4">
              Cards are used to display grouped information. They have a light border and subtle shadow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nested Card 1</CardTitle>
                </CardHeader>
                <CardContent>Content goes here</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nested Card 2</CardTitle>
                </CardHeader>
                <CardContent>Content goes here</CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold">Heading 1</h1>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Heading 2</h2>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Heading 3</h3>
            </div>
            <div>
              <p className="text-base text-[#171717]">
                Body text: This is a standard paragraph. It uses a comfortable line height for readability.
              </p>
            </div>
            <div>
              <p className="text-sm text-[#666666]">Small text for captions and helper text</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
