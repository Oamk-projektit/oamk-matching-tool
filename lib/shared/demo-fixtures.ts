/**
 * ============================================================================
 * SHARED — Tommi + Venla (issue #147 demo data)
 * ============================================================================
 *
 * Stable demo fixtures aligned with `supabase/seed.sql` UUIDs.
 * Venla can import these for UI demos / fallback mocks that match backend seed.
 * Do not put React components here.
 */

import type {
  MatchResult,
  Opportunity,
  Student,
} from '@/types/legacy'
import { DEFAULT_MATCHING_WEIGHTS } from '@/types/legacy'

/** Seed auth password for local demo users (see supabase/seed.sql). */
export const DEMO_PASSWORD = 'LocalDemoOnly!1'

export const DEMO_USERS = {
  teacher: {
    id: 'a0000000-0000-4000-8000-000000000001',
    email: 'teacher.demo@oamk.fi',
    role: 'teacher' as const,
  },
  admin: {
    id: 'a0000000-0000-4000-8000-000000000002',
    email: 'admin.demo@oamk.fi',
    role: 'admin' as const,
  },
  aino: {
    id: 'a0000000-0000-4000-8000-000000000011',
    email: 't3jato02@students.oamk.fi',
    role: 'student' as const,
  },
  mikko: {
    id: 'a0000000-0000-4000-8000-000000000012',
    email: 'mikko.korhonen@students.oamk.fi',
    role: 'student' as const,
  },
} as const

export const DEMO_STUDENTS: Student[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000011',
    user_id: DEMO_USERS.aino.id,
    name: 'Aino Virtanen',
    email: DEMO_USERS.aino.email,
    degree_program: 'Tietotekniikka',
    credits: 160,
    language: 'FI',
    availability: 'Full-time',
    completed_courses: [
      'Web-ohjelmointi',
      'Tietokannat',
      'Käyttöliittymäsuunnittelu',
      'Ohjelmistotuotanto',
    ],
    skills: ['React', 'TypeScript', 'SQL', 'Figma'],
    interests: ['Web development', 'UX'],
    project_preferences: ['project'],
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000012',
    user_id: DEMO_USERS.mikko.id,
    name: 'Mikko Korhonen',
    email: DEMO_USERS.mikko.email,
    degree_program: 'Tietotekniikka',
    credits: 90,
    language: 'FI',
    availability: 'Part-time',
    completed_courses: ['Web-ohjelmointi', 'Tietokannat'],
    skills: ['React', 'JavaScript'],
    interests: ['Frontend'],
    project_preferences: ['project', 'internship'],
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
]

export const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    teacher_id: DEMO_USERS.teacher.id,
    name: 'Campus portal renewal',
    description:
      'Rebuild the student-facing campus portal UI with accessibility focus.',
    type: 'project',
    required_courses: ['Web-ohjelmointi'],
    recommended_courses: ['Käyttöliittymäsuunnittelu'],
    minimum_credits: 60,
    required_language: 'FI',
    schedule: 'Flexible',
    duration: '3 months',
    required_skills: ['React', 'TypeScript'],
    student_slots: 2,
    weights: { ...DEFAULT_MATCHING_WEIGHTS },
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'c0000000-0000-4000-8000-000000000007',
    teacher_id: DEMO_USERS.teacher.id,
    name: 'Cloud ops internship',
    description:
      'Assist with AWS deployments and monitoring for teaching environments.',
    type: 'internship',
    required_courses: ['Pilvipalvelut'],
    recommended_courses: ['Tietoturva'],
    minimum_credits: 100,
    required_language: 'FI',
    schedule: 'Full-time',
    duration: '5 months',
    required_skills: ['Docker', 'AWS'],
    student_slots: 1,
    weights: {
      courses: 0.3,
      skills: 0.45,
      language: 0.05,
      schedule: 0.1,
      credits: 0.1,
    },
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
]

/** High / medium / low match examples for Aino (aligned with seed). */
export const DEMO_MATCHES: Omit<
  MatchResult,
  'id' | 'created_at' | 'updated_at'
>[] = [
  {
    student_id: 'b0000000-0000-4000-8000-000000000011',
    opportunity_id: 'c0000000-0000-4000-8000-000000000001',
    score: 88,
    matched_courses: ['Web-ohjelmointi'],
    missing_courses: [],
    matched_skills: ['React', 'TypeScript'],
    missing_skills: [],
    explanation:
      'Strong skill overlap and required course completed; language and schedule align.',
    recommendation:
      'Ready to start; review accessibility checklist before kickoff.',
  },
  {
    student_id: 'b0000000-0000-4000-8000-000000000011',
    opportunity_id: 'c0000000-0000-4000-8000-000000000003',
    score: 55,
    matched_courses: ['Tietokannat'],
    missing_courses: [],
    matched_skills: ['SQL'],
    missing_skills: ['Python'],
    explanation:
      'Credits and database course match, but Python skill is missing for the IoT stack.',
    recommendation:
      'Complete an introductory Python module before the project starts.',
  },
  {
    student_id: 'b0000000-0000-4000-8000-000000000011',
    opportunity_id: 'c0000000-0000-4000-8000-000000000007',
    score: 28,
    matched_courses: [],
    missing_courses: ['Pilvipalvelut'],
    matched_skills: [],
    missing_skills: ['Docker', 'AWS'],
    explanation: 'Limited overlap with cloud internship requirements.',
    recommendation:
      'Build Docker/AWS fundamentals or prefer web-oriented opportunities.',
  },
]
