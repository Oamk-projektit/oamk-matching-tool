-- Local/dev seed data for OAMK Matching Tool
-- Requires auth schema (Supabase). Safe for `supabase db reset` only — do not run in production.
--
-- Fixed UUIDs keep demos and tests stable.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Auth users (local Supabase)
-- Password for all: Passw0rd!
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'teacher.demo@oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"teacher"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'admin.demo@oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000011',
    'authenticated',
    'authenticated',
    'aino.virtanen@students.oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000012',
    'authenticated',
    'authenticated',
    'mikko.korhonen@students.oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000013',
    'authenticated',
    'authenticated',
    'sara.nieminen@students.oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000014',
    'authenticated',
    'authenticated',
    'alex.smith@students.oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000015',
    'authenticated',
    'authenticated',
    'emilia.laitinen@students.oamk.fi',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- identities (required for email login in newer Supabase)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000012',
  'a0000000-0000-4000-8000-000000000013',
  'a0000000-0000-4000-8000-000000000014',
  'a0000000-0000-4000-8000-000000000015'
)
ON CONFLICT DO NOTHING;

-- Ensure roles (trigger may already insert student; upsert correct roles)
INSERT INTO public.profiles (user_id, role)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'teacher'),
  ('a0000000-0000-4000-8000-000000000002', 'admin'),
  ('a0000000-0000-4000-8000-000000000011', 'student'),
  ('a0000000-0000-4000-8000-000000000012', 'student'),
  ('a0000000-0000-4000-8000-000000000013', 'student'),
  ('a0000000-0000-4000-8000-000000000014', 'student'),
  ('a0000000-0000-4000-8000-000000000015', 'student')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
INSERT INTO public.students (
  id, user_id, name, email, degree_program, credits, language, availability
) VALUES
  (
    'b0000000-0000-4000-8000-000000000011',
    'a0000000-0000-4000-8000-000000000011',
    'Aino Virtanen',
    'aino.virtanen@students.oamk.fi',
    'Tietotekniikka',
    160,
    'FI',
    'Full-time'
  ),
  (
    'b0000000-0000-4000-8000-000000000012',
    'a0000000-0000-4000-8000-000000000012',
    'Mikko Korhonen',
    'mikko.korhonen@students.oamk.fi',
    'Tietotekniikka',
    90,
    'FI',
    'Part-time'
  ),
  (
    'b0000000-0000-4000-8000-000000000013',
    'a0000000-0000-4000-8000-000000000013',
    'Sara Nieminen',
    'sara.nieminen@students.oamk.fi',
    'Tieto- ja viestintätekniikka',
    45,
    'FI',
    'Flexible'
  ),
  (
    'b0000000-0000-4000-8000-000000000014',
    'a0000000-0000-4000-8000-000000000014',
    'Alex Smith',
    'alex.smith@students.oamk.fi',
    'Information Technology',
    110,
    'EN',
    'Full-time'
  ),
  (
    'b0000000-0000-4000-8000-000000000015',
    'a0000000-0000-4000-8000-000000000015',
    'Emilia Laitinen',
    'emilia.laitinen@students.oamk.fi',
    'Tietotekniikka',
    130,
    'FI',
    'Full-time'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.student_courses (student_id, course_name) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'Web-ohjelmointi'),
  ('b0000000-0000-4000-8000-000000000011', 'Tietokannat'),
  ('b0000000-0000-4000-8000-000000000011', 'Käyttöliittymäsuunnittelu'),
  ('b0000000-0000-4000-8000-000000000011', 'Ohjelmistotuotanto'),
  ('b0000000-0000-4000-8000-000000000012', 'Web-ohjelmointi'),
  ('b0000000-0000-4000-8000-000000000012', 'Tietokannat'),
  ('b0000000-0000-4000-8000-000000000013', 'Johdatus ohjelmointiin'),
  ('b0000000-0000-4000-8000-000000000014', 'Web Development'),
  ('b0000000-0000-4000-8000-000000000014', 'Databases'),
  ('b0000000-0000-4000-8000-000000000015', 'Web-ohjelmointi'),
  ('b0000000-0000-4000-8000-000000000015', 'Pilvipalvelut'),
  ('b0000000-0000-4000-8000-000000000015', 'Tietoturva')
ON CONFLICT DO NOTHING;

INSERT INTO public.student_skills (student_id, skill_name) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'React'),
  ('b0000000-0000-4000-8000-000000000011', 'TypeScript'),
  ('b0000000-0000-4000-8000-000000000011', 'SQL'),
  ('b0000000-0000-4000-8000-000000000011', 'Figma'),
  ('b0000000-0000-4000-8000-000000000012', 'React'),
  ('b0000000-0000-4000-8000-000000000012', 'JavaScript'),
  ('b0000000-0000-4000-8000-000000000013', 'Python'),
  ('b0000000-0000-4000-8000-000000000014', 'React'),
  ('b0000000-0000-4000-8000-000000000014', 'TypeScript'),
  ('b0000000-0000-4000-8000-000000000014', 'Node.js'),
  ('b0000000-0000-4000-8000-000000000015', 'Python'),
  ('b0000000-0000-4000-8000-000000000015', 'Docker'),
  ('b0000000-0000-4000-8000-000000000015', 'AWS')
ON CONFLICT DO NOTHING;

INSERT INTO public.student_interests (student_id, interest_name) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'Web development'),
  ('b0000000-0000-4000-8000-000000000011', 'UX'),
  ('b0000000-0000-4000-8000-000000000012', 'Frontend'),
  ('b0000000-0000-4000-8000-000000000013', 'Data'),
  ('b0000000-0000-4000-8000-000000000014', 'Full-stack'),
  ('b0000000-0000-4000-8000-000000000015', 'Cloud'),
  ('b0000000-0000-4000-8000-000000000015', 'Security')
ON CONFLICT DO NOTHING;

INSERT INTO public.student_project_preferences (student_id, preference) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'project'),
  ('b0000000-0000-4000-8000-000000000012', 'project'),
  ('b0000000-0000-4000-8000-000000000012', 'internship'),
  ('b0000000-0000-4000-8000-000000000013', 'internship'),
  ('b0000000-0000-4000-8000-000000000014', 'project'),
  ('b0000000-0000-4000-8000-000000000015', 'project'),
  ('b0000000-0000-4000-8000-000000000015', 'internship')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Opportunities (5 projects + 3 internships)
-- ---------------------------------------------------------------------------
INSERT INTO public.opportunities (
  id, teacher_id, name, description, type,
  minimum_credits, required_language, schedule, duration, student_slots
) VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Campus portal renewal',
    'Rebuild the student-facing campus portal UI with accessibility focus.',
    'project',
    60,
    'FI',
    'Flexible',
    '3 months',
    2
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Library search redesign',
    'Improve search UX and ranking for the campus library catalogue.',
    'project',
    40,
    'FI',
    'Part-time',
    '2 months',
    1
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'IoT lab dashboard',
    'Build a dashboard for IoT sensor data used in teaching labs.',
    'project',
    80,
    'FI',
    'Full-time',
    '4 months',
    3
  ),
  (
    'c0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'Mobile timetable app',
    'React Native prototype for personalised student timetables.',
    'project',
    50,
    'EN',
    'Flexible',
    '3 months',
    2
  ),
  (
    'c0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'Accessibility audit toolkit',
    'Create tooling and checklists for WCAG audits of OAMK sites.',
    'project',
    30,
    'FI',
    'Part-time',
    '2 months',
    1
  ),
  (
    'c0000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000001',
    'Web team internship',
    'Internship with the internal web team maintaining oamk.fi components.',
    'internship',
    90,
    'FI',
    'Full-time',
    '5 months',
    1
  ),
  (
    'c0000000-0000-4000-8000-000000000007',
    'a0000000-0000-4000-8000-000000000001',
    'Cloud ops internship',
    'Assist with AWS deployments and monitoring for teaching environments.',
    'internship',
    100,
    'FI',
    'Full-time',
    '5 months',
    1
  ),
  (
    'c0000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000001',
    'International IT internship',
    'English-language internship supporting exchange student IT onboarding.',
    'internship',
    60,
    'EN',
    'Flexible',
    '3 months',
    2
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.opportunity_required_courses (opportunity_id, course_name) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Web-ohjelmointi'),
  ('c0000000-0000-4000-8000-000000000002', 'Käyttöliittymäsuunnittelu'),
  ('c0000000-0000-4000-8000-000000000003', 'Tietokannat'),
  ('c0000000-0000-4000-8000-000000000004', 'Web Development'),
  ('c0000000-0000-4000-8000-000000000006', 'Web-ohjelmointi'),
  ('c0000000-0000-4000-8000-000000000006', 'Tietokannat'),
  ('c0000000-0000-4000-8000-000000000007', 'Pilvipalvelut'),
  ('c0000000-0000-4000-8000-000000000008', 'Web Development')
ON CONFLICT DO NOTHING;

INSERT INTO public.opportunity_recommended_courses (opportunity_id, course_name) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Käyttöliittymäsuunnittelu'),
  ('c0000000-0000-4000-8000-000000000003', 'Ohjelmistotuotanto'),
  ('c0000000-0000-4000-8000-000000000007', 'Tietoturva')
ON CONFLICT DO NOTHING;

INSERT INTO public.opportunity_required_skills (opportunity_id, skill_name) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'React'),
  ('c0000000-0000-4000-8000-000000000001', 'TypeScript'),
  ('c0000000-0000-4000-8000-000000000002', 'Figma'),
  ('c0000000-0000-4000-8000-000000000003', 'SQL'),
  ('c0000000-0000-4000-8000-000000000003', 'Python'),
  ('c0000000-0000-4000-8000-000000000004', 'React'),
  ('c0000000-0000-4000-8000-000000000004', 'TypeScript'),
  ('c0000000-0000-4000-8000-000000000006', 'React'),
  ('c0000000-0000-4000-8000-000000000007', 'Docker'),
  ('c0000000-0000-4000-8000-000000000007', 'AWS'),
  ('c0000000-0000-4000-8000-000000000008', 'Node.js')
ON CONFLICT DO NOTHING;

INSERT INTO public.opportunity_weights (
  opportunity_id,
  weight_courses,
  weight_skills,
  weight_language,
  weight_schedule,
  weight_credits
) VALUES
  ('c0000000-0000-4000-8000-000000000001', 0.300, 0.400, 0.100, 0.100, 0.100),
  ('c0000000-0000-4000-8000-000000000002', 0.250, 0.350, 0.100, 0.100, 0.200),
  ('c0000000-0000-4000-8000-000000000003', 0.300, 0.400, 0.100, 0.100, 0.100),
  ('c0000000-0000-4000-8000-000000000004', 0.200, 0.500, 0.150, 0.050, 0.100),
  ('c0000000-0000-4000-8000-000000000005', 0.200, 0.300, 0.100, 0.200, 0.200),
  ('c0000000-0000-4000-8000-000000000006', 0.350, 0.350, 0.100, 0.100, 0.100),
  ('c0000000-0000-4000-8000-000000000007', 0.300, 0.450, 0.050, 0.100, 0.100),
  ('c0000000-0000-4000-8000-000000000008', 0.250, 0.350, 0.250, 0.050, 0.100)
ON CONFLICT (opportunity_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
INSERT INTO public.applications (id, student_id, opportunity_id, status, message) VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000011',
    'c0000000-0000-4000-8000-000000000001',
    'pending',
    'I have strong React/TypeScript experience.'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000012',
    'c0000000-0000-4000-8000-000000000001',
    'pending',
    'Interested in campus UI work.'
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000015',
    'c0000000-0000-4000-8000-000000000007',
    'pending',
    'Cloud and security focus.'
  ),
  (
    'd0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000014',
    'c0000000-0000-4000-8000-000000000008',
    'pending',
    'Prefer English-language placement.'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sample matches (good / medium / weak) for Aino vs three opportunities
-- ---------------------------------------------------------------------------
INSERT INTO public.matches (
  id,
  student_id,
  opportunity_id,
  score,
  matched_courses,
  missing_courses,
  matched_skills,
  missing_skills,
  explanation,
  recommendation
) VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000011',
    'c0000000-0000-4000-8000-000000000001',
    88,
    ARRAY['Web-ohjelmointi'],
    ARRAY[]::text[],
    ARRAY['React', 'TypeScript'],
    ARRAY[]::text[],
    'Strong skill overlap and required course completed; language and schedule align.',
    'Ready to start; review accessibility checklist before kickoff.'
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000011',
    'c0000000-0000-4000-8000-000000000003',
    55,
    ARRAY['Tietokannat'],
    ARRAY[]::text[],
    ARRAY['SQL'],
    ARRAY['Python'],
    'Credits and database course match, but Python skill is missing for the IoT stack.',
    'Complete an introductory Python module before the project starts.'
  ),
  (
    'e0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000011',
    'c0000000-0000-4000-8000-000000000007',
    28,
    ARRAY[]::text[],
    ARRAY['Pilvipalvelut'],
    ARRAY[]::text[],
    ARRAY['Docker', 'AWS'],
    'Limited overlap with cloud internship requirements.',
    'Build Docker/AWS fundamentals or prefer web-oriented opportunities.'
  )
ON CONFLICT DO NOTHING;
