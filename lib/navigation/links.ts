/**
 * Role-specific navigation links, shared by `Navbar` (global top bar) and
 * `AppShell` (dashboard sidebar/drawer) so both stay in sync.
 */
import type { UserRole } from '@/types/domain'

export interface NavLink {
  href: string
  /** i18n key resolved via `useTranslations().t(...)`. */
  labelKey: string
}

const STUDENT_LINKS: NavLink[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard' },
  { href: '/profile', labelKey: 'nav.profile' },
  { href: '/projects', labelKey: 'nav.projects' },
  { href: '/applications', labelKey: 'nav.applications' },
  { href: '/matches', labelKey: 'nav.matches' },
  { href: '/notifications', labelKey: 'nav.notifications' },
]

const COMPANY_LINKS: NavLink[] = [
  { href: '/company/dashboard', labelKey: 'nav.dashboard' },
  { href: '/company/profile', labelKey: 'nav.companyProfile' },
  { href: '/company/projects', labelKey: 'nav.projects' },
  { href: '/notifications', labelKey: 'nav.notifications' },
]

const TEACHER_LINKS: NavLink[] = [
  { href: '/teacher/dashboard', labelKey: 'nav.dashboard' },
  { href: '/teacher/projects', labelKey: 'nav.projects' },
  { href: '/teacher/students', labelKey: 'nav.students' },
  { href: '/teacher/audit', labelKey: 'nav.audit' },
  { href: '/notifications', labelKey: 'nav.notifications' },
]

// Admins oversee the same teacher-facing project/student/audit views, plus
// their own dashboard.
const ADMIN_LINKS: NavLink[] = [
  { href: '/admin/dashboard', labelKey: 'nav.dashboard' },
  { href: '/teacher/projects', labelKey: 'nav.projects' },
  { href: '/teacher/students', labelKey: 'nav.students' },
  { href: '/teacher/audit', labelKey: 'nav.audit' },
  { href: '/notifications', labelKey: 'nav.notifications' },
]

const LINKS_BY_ROLE: Record<UserRole, NavLink[]> = {
  student: STUDENT_LINKS,
  company: COMPANY_LINKS,
  teacher: TEACHER_LINKS,
  admin: ADMIN_LINKS,
}

/** Returns the nav links for a role, or an empty list when signed out. */
export function getNavLinks(role: UserRole | null | undefined): NavLink[] {
  if (!role) return []
  return LINKS_BY_ROLE[role]
}
