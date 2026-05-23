'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-white px-4">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#005EB8] rounded-lg" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-5xl font-bold text-[#171717] mb-4">OAMK Matching Tool</h1>
          <p className="text-xl text-[#666666]">
            Connect your skills with real-world projects. Find your perfect team at OAMK.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              I am a Student
            </Button>
          </Link>
          <Link href="/teacher/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              I am a Teacher
            </Button>
          </Link>
        </div>

        {/* Footer Text */}
        <div className="pt-8 border-t border-[#e0e0e0]">
          <p className="text-sm text-[#666666]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#005EB8] font-semibold hover:text-[#004A94]">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
