/**
 * Generate types/database.ts from a live Postgres schema (Supabase Database shape).
 * Used when `supabase gen types` cannot run (e.g. Docker CLI lock).
 *
 * Usage:
 *   PGPASSWORD=postgres node scripts/gen-database-types.mjs
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outPath = resolve(root, 'types', 'database.ts')

const host = process.env.PGHOST || '127.0.0.1'
const port = process.env.PGPORT || '54322'
const user = process.env.PGUSER || 'postgres'
const db = process.env.PGDATABASE || 'postgres'

function psqlJson(sql) {
  const out = execFileSync(
    'psql',
    ['-h', host, '-p', port, '-U', user, '-d', db, '-At', '-c', sql],
    {
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    }
  ).trim()
  if (!out || out === '') return []
  return JSON.parse(out)
}

const cols = psqlJson(`
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
FROM (
  SELECT table_name, column_name, is_nullable, data_type, udt_name, column_default, ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
) t
`)

const fks = psqlJson(`
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
FROM (
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.column_name
) t
`)

/** @param {string} udt @param {string} dataType */
function tsType(udt, dataType) {
  switch (udt) {
    case 'uuid':
      return 'string'
    case 'text':
    case 'varchar':
    case 'citext':
    case 'name':
      return 'string'
    case 'bool':
      return 'boolean'
    case 'int2':
    case 'int4':
    case 'int8':
    case 'float4':
    case 'float8':
    case 'numeric':
      return 'number'
    case 'json':
    case 'jsonb':
      return 'Json'
    case 'timestamptz':
    case 'timestamp':
    case 'date':
    case 'time':
    case 'timetz':
      return 'string'
    case '_text':
      return 'string[]'
    case '_int4':
    case '_int8':
      return 'number[]'
    case '_uuid':
      return 'string[]'
    default:
      if (dataType === 'ARRAY') {
        if (udt.startsWith('_')) {
          const inner = tsType(udt.slice(1), 'USER-DEFINED')
          return `${inner}[]`
        }
        return 'string[]'
      }
      if (dataType === 'USER-DEFINED') return 'string'
      return 'string'
  }
}

function isGenerated(col) {
  const d = col.column_default || ''
  return d.includes('gen_random_uuid') || d.includes('now()')
}

function groupBy(rows, key) {
  /** @type {Record<string, any[]>} */
  const map = {}
  for (const row of rows) {
    ;(map[row[key]] ||= []).push(row)
  }
  return map
}

const tables = groupBy(cols, 'table_name')
const fksByTable = groupBy(fks, 'table_name')

const requiredTables = [
  'profiles',
  'students',
  'companies',
  'company_users',
  'courses',
  'skills',
  'interests',
  'student_courses',
  'student_skills',
  'student_interests',
  'projects',
  'project_required_courses',
  'project_recommended_courses',
  'project_required_skills',
  'project_recommended_skills',
  'project_interests',
  'project_weights',
  'applications',
  'matches',
  'selection_decisions',
  'notifications',
  'audit_events',
]

for (const name of requiredTables) {
  if (!tables[name]) {
    throw new Error(`Missing required table in live schema: ${name}`)
  }
}

const sortedTableNames = Object.keys(tables).sort()

let body = ''
for (const table of sortedTableNames) {
  const columns = tables[table]
  const relationships = fksByTable[table] || []

  body += `      ${table}: {\n`
  body += `        Row: {\n`
  for (const col of columns) {
    const optional = col.is_nullable === 'YES' ? ' | null' : ''
    body += `          ${col.column_name}: ${tsType(col.udt_name, col.data_type)}${optional}\n`
  }
  body += `        }\n`

  body += `        Insert: {\n`
  for (const col of columns) {
    const base = tsType(col.udt_name, col.data_type)
    const nullable = col.is_nullable === 'YES'
    const hasDefault = Boolean(col.column_default) || isGenerated(col)
    if (nullable || hasDefault || col.column_name === 'id') {
      body += `          ${col.column_name}?: ${base}${nullable ? ' | null' : ''}\n`
    } else {
      body += `          ${col.column_name}: ${base}\n`
    }
  }
  body += `        }\n`

  body += `        Update: {\n`
  for (const col of columns) {
    const base = tsType(col.udt_name, col.data_type)
    const nullable = col.is_nullable === 'YES'
    body += `          ${col.column_name}?: ${base}${nullable ? ' | null' : ''}\n`
  }
  body += `        }\n`

  body += `        Relationships: [\n`
  for (const fk of relationships) {
    body += `          {\n`
    body += `            foreignKeyName: "${fk.constraint_name}"\n`
    body += `            columns: ["${fk.column_name}"]\n`
    body += `            isOneToOne: false\n`
    body += `            referencedRelation: "${fk.foreign_table_name}"\n`
    body += `            referencedColumns: ["${fk.foreign_column_name}"]\n`
    body += `          },\n`
  }
  body += `        ]\n`
  body += `      }\n`
}

const header = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
`

const footer = `    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
`

const banner = `/**
 * This file is auto-generated from the local Supabase/Postgres schema.
 * Do not edit by hand. Regenerate with:
 *   supabase gen types typescript --local > types/database.ts
 * or (Docker CLI unavailable):
 *   node scripts/gen-database-types.mjs
 *
 * Generated: ${new Date().toISOString()}
 */

`

writeFileSync(outPath, banner + header + body + footer, 'utf8')
console.log(`Wrote ${outPath} (${sortedTableNames.length} tables)`)
