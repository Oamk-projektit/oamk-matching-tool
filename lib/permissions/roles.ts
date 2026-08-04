import type { UserRole } from '@/types/domain'
import type { Profile } from '@/types/domain'

export type RoleBearer = Pick<Profile, 'role'> | { role: UserRole }

export function isStudent(profile: RoleBearer): boolean {
  return profile.role === 'student'
}

export function isCompany(profile: RoleBearer): boolean {
  return profile.role === 'company'
}

export function isTeacher(profile: RoleBearer): boolean {
  return profile.role === 'teacher'
}

export function isAdmin(profile: RoleBearer): boolean {
  return profile.role === 'admin'
}

export function isTeacherOrAdmin(profile: RoleBearer): boolean {
  return profile.role === 'teacher' || profile.role === 'admin'
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'teacher' || role === 'admin'
}

export function hasRole(profile: RoleBearer, roles: UserRole[]): boolean {
  return roles.includes(profile.role)
}
