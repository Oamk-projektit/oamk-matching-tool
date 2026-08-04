-- Local/dev seed for OAMK Matching Tool (projects model).
-- Used by `supabase db reset` only — do not run against production.
--
-- All emails/names are fictional. Local auth password for every demo user:
--   LocalDemoOnly!1
-- (Not a production secret; required only so Auth.users rows can sign in locally.)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Auth users
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
    'authenticated', 'authenticated',
    'teacher.demo@oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"teacher","display_name":"Demo Teacher","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated',
    'admin.demo@oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","display_name":"Demo Admin","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated',
    'contact@nordicsoft.example',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"company","display_name":"Nordic Soft Oy","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000004',
    'authenticated', 'authenticated',
    'hr@polarbyte.example',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"company","display_name":"Polar Byte Ab","preferred_language":"en"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000011',
    'authenticated', 'authenticated',
    'aino.virtanen@students.oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student","display_name":"Aino Virtanen","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000012',
    'authenticated', 'authenticated',
    'mikko.korhonen@students.oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student","display_name":"Mikko Korhonen","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000013',
    'authenticated', 'authenticated',
    'sara.nieminen@students.oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student","display_name":"Sara Nieminen","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000014',
    'authenticated', 'authenticated',
    'alex.smith@students.oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student","display_name":"Alex Smith","preferred_language":"en"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000015',
    'authenticated', 'authenticated',
    'emilia.laitinen@students.oamk.fi',
    crypt('LocalDemoOnly!1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"student","display_name":"Emilia Laitinen","preferred_language":"fi"}',
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  u.id, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', u.id::text, now(), now(), now()
FROM auth.users u
WHERE u.id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000012',
  'a0000000-0000-4000-8000-000000000013',
  'a0000000-0000-4000-8000-000000000014',
  'a0000000-0000-4000-8000-000000000015'
)
ON CONFLICT DO NOTHING;

-- Ensure profile roles/names (trigger may have inserted defaults)
INSERT INTO public.profiles (id, role, display_name, email, preferred_language)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'teacher', 'Demo Teacher', 'teacher.demo@oamk.fi', 'fi'),
  ('a0000000-0000-4000-8000-000000000002', 'admin', 'Demo Admin', 'admin.demo@oamk.fi', 'fi'),
  ('a0000000-0000-4000-8000-000000000003', 'company', 'Nordic Soft Oy', 'contact@nordicsoft.example', 'fi'),
  ('a0000000-0000-4000-8000-000000000004', 'company', 'Polar Byte Ab', 'hr@polarbyte.example', 'en'),
  ('a0000000-0000-4000-8000-000000000011', 'student', 'Aino Virtanen', 'aino.virtanen@students.oamk.fi', 'fi'),
  ('a0000000-0000-4000-8000-000000000012', 'student', 'Mikko Korhonen', 'mikko.korhonen@students.oamk.fi', 'fi'),
  ('a0000000-0000-4000-8000-000000000013', 'student', 'Sara Nieminen', 'sara.nieminen@students.oamk.fi', 'fi'),
  ('a0000000-0000-4000-8000-000000000014', 'student', 'Alex Smith', 'alex.smith@students.oamk.fi', 'en'),
  ('a0000000-0000-4000-8000-000000000015', 'student', 'Emilia Laitinen', 'emilia.laitinen@students.oamk.fi', 'fi')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  preferred_language = EXCLUDED.preferred_language;

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
INSERT INTO public.companies (id, name, business_id, description, website) VALUES
  (
    'f0000000-0000-4000-8000-000000000001',
    'Nordic Soft Oy',
    '1234567-8',
    'Fictional Oulu software house focused on campus and municipal digital services.',
    'https://nordicsoft.example'
  ),
  (
    'f0000000-0000-4000-8000-000000000002',
    'Polar Byte Ab',
    '2345678-9',
    'Fictional bilingual product company building cloud tooling for education.',
    'https://polarbyte.example'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.company_users (company_id, profile_id, company_role) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'owner'),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'owner')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Catalogs
-- ---------------------------------------------------------------------------
INSERT INTO public.courses (id, code, name_fi, name_en, credits, department) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'TT00AA11', 'Web-ohjelmointi', 'Web Development', 5, 'ICT'),
  ('c1000000-0000-4000-8000-000000000002', 'TT00AA12', 'Tietokannat', 'Databases', 5, 'ICT'),
  ('c1000000-0000-4000-8000-000000000003', 'TT00AA13', 'Käyttöliittymäsuunnittelu', 'UI Design', 5, 'ICT'),
  ('c1000000-0000-4000-8000-000000000004', 'TT00AA14', 'Ohjelmistotuotanto', 'Software Engineering', 5, 'ICT'),
  ('c1000000-0000-4000-8000-000000000005', 'TT00AA15', 'Pilvipalvelut', 'Cloud Services', 5, 'ICT'),
  ('c1000000-0000-4000-8000-000000000006', 'TT00AA16', 'Tietoturva', 'Information Security', 5, 'ICT'),
  ('c1000000-0000-4000-8000-000000000007', 'TT00AA17', 'Johdatus ohjelmointiin', 'Introduction to Programming', 5, 'ICT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skills (id, name_fi, name_en, normalized_name) VALUES
  ('k1000000-0000-4000-8000-000000000001', 'React', 'React', 'react'),
  ('k1000000-0000-4000-8000-000000000002', 'TypeScript', 'TypeScript', 'typescript'),
  ('k1000000-0000-4000-8000-000000000003', 'SQL', 'SQL', 'sql'),
  ('k1000000-0000-4000-8000-000000000004', 'Figma', 'Figma', 'figma'),
  ('k1000000-0000-4000-8000-000000000005', 'JavaScript', 'JavaScript', 'javascript'),
  ('k1000000-0000-4000-8000-000000000006', 'Python', 'Python', 'python'),
  ('k1000000-0000-4000-8000-000000000007', 'Node.js', 'Node.js', 'nodejs'),
  ('k1000000-0000-4000-8000-000000000008', 'Docker', 'Docker', 'docker'),
  ('k1000000-0000-4000-8000-000000000009', 'AWS', 'AWS', 'aws')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.interests (id, name_fi, name_en, normalized_name) VALUES
  ('i1000000-0000-4000-8000-000000000001', 'Web-kehitys', 'Web development', 'web-development'),
  ('i1000000-0000-4000-8000-000000000002', 'Käyttökokemus', 'UX', 'ux'),
  ('i1000000-0000-4000-8000-000000000003', 'Frontend', 'Frontend', 'frontend'),
  ('i1000000-0000-4000-8000-000000000004', 'Data', 'Data', 'data'),
  ('i1000000-0000-4000-8000-000000000005', 'Full-stack', 'Full-stack', 'full-stack'),
  ('i1000000-0000-4000-8000-000000000006', 'Pilvi', 'Cloud', 'cloud'),
  ('i1000000-0000-4000-8000-000000000007', 'Tietoturva', 'Security', 'security')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Students (5)
-- ---------------------------------------------------------------------------
INSERT INTO public.students (
  id, profile_id, degree_programme, department, study_credits,
  availability_start, availability_end, preferred_project_types
) VALUES
  (
    'b0000000-0000-4000-8000-000000000011',
    'a0000000-0000-4000-8000-000000000011',
    'Tietotekniikka', 'ICT', 160,
    '2026-09-01', '2026-12-15',
    ARRAY['company_project']
  ),
  (
    'b0000000-0000-4000-8000-000000000012',
    'a0000000-0000-4000-8000-000000000012',
    'Tietotekniikka', 'ICT', 90,
    '2026-09-01', '2027-01-31',
    ARRAY['company_project', 'internship']
  ),
  (
    'b0000000-0000-4000-8000-000000000013',
    'a0000000-0000-4000-8000-000000000013',
    'Tieto- ja viestintätekniikka', 'ICT', 45,
    '2026-10-01', '2027-03-01',
    ARRAY['internship']
  ),
  (
    'b0000000-0000-4000-8000-000000000014',
    'a0000000-0000-4000-8000-000000000014',
    'Information Technology', 'ICT', 110,
    '2026-09-01', '2026-12-15',
    ARRAY['company_project']
  ),
  (
    'b0000000-0000-4000-8000-000000000015',
    'a0000000-0000-4000-8000-000000000015',
    'Tietotekniikka', 'ICT', 130,
    '2026-09-01', '2027-02-28',
    ARRAY['company_project', 'internship']
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.student_courses (student_id, course_id) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000013', 'c1000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000014', 'c1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000014', 'c1000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000015', 'c1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000015', 'c1000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000015', 'c1000000-0000-4000-8000-000000000006')
ON CONFLICT DO NOTHING;

INSERT INTO public.student_skills (student_id, skill_id) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'k1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000011', 'k1000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000011', 'k1000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000011', 'k1000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000012', 'k1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000012', 'k1000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000013', 'k1000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000014', 'k1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000014', 'k1000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000014', 'k1000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000015', 'k1000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000015', 'k1000000-0000-4000-8000-000000000008'),
  ('b0000000-0000-4000-8000-000000000015', 'k1000000-0000-4000-8000-000000000009')
ON CONFLICT DO NOTHING;

INSERT INTO public.student_interests (student_id, interest_id) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'i1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000011', 'i1000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000012', 'i1000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000013', 'i1000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000014', 'i1000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000015', 'i1000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000015', 'i1000000-0000-4000-8000-000000000007')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Projects (5 company projects + 2 internships)
-- ---------------------------------------------------------------------------
INSERT INTO public.projects (
  id, company_id, title, description, project_type, status, positions,
  application_start, application_deadline, project_start, project_end,
  work_mode, location, remote_allowed, minimum_study_credits,
  required_language, department
) VALUES
  (
    'p0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'Campus portal renewal',
    'Rebuild the student-facing campus portal UI with accessibility focus.',
    'company_project', 'published', 2,
    '2026-08-01', '2026-09-15', '2026-10-01', '2026-12-15',
    'hybrid', 'Oulu', true, 60, 'fi', 'ICT'
  ),
  (
    'p0000000-0000-4000-8000-000000000002',
    'f0000000-0000-4000-8000-000000000001',
    'Library search redesign',
    'Improve search UX and ranking for the campus library catalogue.',
    'company_project', 'published', 1,
    '2026-08-01', '2026-09-30', '2026-10-15', '2026-12-15',
    'hybrid', 'Oulu', true, 40, 'fi', 'ICT'
  ),
  (
    'p0000000-0000-4000-8000-000000000003',
    'f0000000-0000-4000-8000-000000000001',
    'IoT lab dashboard',
    'Build a dashboard for IoT sensor data used in teaching labs.',
    'company_project', 'published', 3,
    '2026-08-01', '2026-10-01', '2026-10-15', '2027-02-01',
    'onsite', 'Oulu', false, 80, 'fi', 'ICT'
  ),
  (
    'p0000000-0000-4000-8000-000000000004',
    'f0000000-0000-4000-8000-000000000002',
    'Mobile timetable app',
    'React Native prototype for personalised student timetables.',
    'company_project', 'published', 2,
    '2026-08-01', '2026-09-20', '2026-10-01', '2026-12-31',
    'remote', 'Remote', true, 50, 'en', 'ICT'
  ),
  (
    'p0000000-0000-4000-8000-000000000005',
    'f0000000-0000-4000-8000-000000000002',
    'Accessibility audit toolkit',
    'Create tooling and checklists for WCAG audits of education sites.',
    'company_project', 'draft', 1,
    NULL, NULL, NULL, NULL,
    'hybrid', 'Oulu', true, 30, 'fi', 'ICT'
  ),
  (
    'p0000000-0000-4000-8000-000000000006',
    'f0000000-0000-4000-8000-000000000001',
    'Web team internship',
    'Internship with the internal web team maintaining campus components.',
    'internship', 'published', 1,
    '2026-08-01', '2026-09-10', '2026-10-01', '2027-03-01',
    'onsite', 'Oulu', false, 90, 'fi', 'ICT'
  ),
  (
    'p0000000-0000-4000-8000-000000000007',
    'f0000000-0000-4000-8000-000000000002',
    'Cloud ops internship',
    'Assist with AWS deployments and monitoring for teaching environments.',
    'internship', 'published', 1,
    '2026-08-01', '2026-09-25', '2026-10-01', '2027-03-01',
    'hybrid', 'Oulu', true, 100, 'fi', 'ICT'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_required_courses (project_id, course_id) VALUES
  ('p0000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000003'),
  ('p0000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000002'),
  ('p0000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000002'),
  ('p0000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000005')
ON CONFLICT DO NOTHING;

INSERT INTO public.project_recommended_courses (project_id, course_id) VALUES
  ('p0000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003'),
  ('p0000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000004'),
  ('p0000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000006')
ON CONFLICT DO NOTHING;

INSERT INTO public.project_required_skills (project_id, skill_id) VALUES
  ('p0000000-0000-4000-8000-000000000001', 'k1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000001', 'k1000000-0000-4000-8000-000000000002'),
  ('p0000000-0000-4000-8000-000000000002', 'k1000000-0000-4000-8000-000000000004'),
  ('p0000000-0000-4000-8000-000000000003', 'k1000000-0000-4000-8000-000000000003'),
  ('p0000000-0000-4000-8000-000000000003', 'k1000000-0000-4000-8000-000000000006'),
  ('p0000000-0000-4000-8000-000000000004', 'k1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000004', 'k1000000-0000-4000-8000-000000000002'),
  ('p0000000-0000-4000-8000-000000000006', 'k1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000007', 'k1000000-0000-4000-8000-000000000008'),
  ('p0000000-0000-4000-8000-000000000007', 'k1000000-0000-4000-8000-000000000009')
ON CONFLICT DO NOTHING;

INSERT INTO public.project_recommended_skills (project_id, skill_id) VALUES
  ('p0000000-0000-4000-8000-000000000001', 'k1000000-0000-4000-8000-000000000004'),
  ('p0000000-0000-4000-8000-000000000004', 'k1000000-0000-4000-8000-000000000007')
ON CONFLICT DO NOTHING;

INSERT INTO public.project_interests (project_id, interest_id) VALUES
  ('p0000000-0000-4000-8000-000000000001', 'i1000000-0000-4000-8000-000000000001'),
  ('p0000000-0000-4000-8000-000000000001', 'i1000000-0000-4000-8000-000000000002'),
  ('p0000000-0000-4000-8000-000000000007', 'i1000000-0000-4000-8000-000000000006')
ON CONFLICT DO NOTHING;

INSERT INTO public.project_weights (
  project_id,
  study_credits, required_courses, recommended_courses, skills,
  language, availability, interests, degree_programme
) VALUES
  ('p0000000-0000-4000-8000-000000000001', 10, 20, 10, 25, 10, 10, 10, 5),
  ('p0000000-0000-4000-8000-000000000002', 15, 25, 5, 20, 10, 10, 10, 5),
  ('p0000000-0000-4000-8000-000000000003', 10, 20, 10, 25, 10, 10, 10, 5),
  ('p0000000-0000-4000-8000-000000000004', 10, 15, 10, 30, 15, 5, 10, 5),
  ('p0000000-0000-4000-8000-000000000005', 10, 20, 10, 25, 10, 10, 10, 5),
  ('p0000000-0000-4000-8000-000000000006', 15, 25, 5, 25, 10, 10, 5, 5),
  ('p0000000-0000-4000-8000-000000000007', 10, 20, 10, 30, 5, 10, 10, 5)
ON CONFLICT (project_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Applications + matches + one selection
-- ---------------------------------------------------------------------------
INSERT INTO public.applications (id, project_id, student_id, status, message) VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'p0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000011',
    'submitted',
    'Strong React/TypeScript background.'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'p0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000012',
    'shortlisted',
    'Interested in campus UI work.'
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'p0000000-0000-4000-8000-000000000007',
    'b0000000-0000-4000-8000-000000000015',
    'submitted',
    'Cloud and security focus.'
  ),
  (
    'd0000000-0000-4000-8000-000000000004',
    'p0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000014',
    'submitted',
    'Prefer English-language placement.'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.matches (
  id, project_id, student_id, total_score, score_breakdown,
  matched_courses, missing_required_courses, matched_skills, missing_required_skills,
  explanation, weights_snapshot
) VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'p0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000011',
    88,
    '{"studyCredits":10,"requiredCourses":20,"recommendedCourses":8,"skills":25,"language":10,"availability":10,"interests":10,"degreeProgramme":5}'::jsonb,
    ARRAY['Web-ohjelmointi'],
    ARRAY[]::text[],
    ARRAY['React', 'TypeScript'],
    ARRAY[]::text[],
    'Strong skill overlap and required course completed; language and schedule align.',
    '{"studyCredits":10,"requiredCourses":20,"recommendedCourses":10,"skills":25,"language":10,"availability":10,"interests":10,"degreeProgramme":5}'::jsonb
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'p0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000012',
    62,
    '{"studyCredits":8,"requiredCourses":20,"recommendedCourses":0,"skills":15,"language":10,"availability":5,"interests":5,"degreeProgramme":5}'::jsonb,
    ARRAY['Web-ohjelmointi'],
    ARRAY[]::text[],
    ARRAY['React'],
    ARRAY['TypeScript'],
    'Solid web base; TypeScript skill still missing for the portal stack.',
    '{"studyCredits":10,"requiredCourses":20,"recommendedCourses":10,"skills":25,"language":10,"availability":10,"interests":10,"degreeProgramme":5}'::jsonb
  ),
  (
    'e0000000-0000-4000-8000-000000000003',
    'p0000000-0000-4000-8000-000000000007',
    'b0000000-0000-4000-8000-000000000015',
    74,
    '{"studyCredits":10,"requiredCourses":20,"recommendedCourses":10,"skills":20,"language":5,"availability":10,"interests":10,"degreeProgramme":5}'::jsonb,
    ARRAY['Pilvipalvelut'],
    ARRAY[]::text[],
    ARRAY['Docker', 'AWS'],
    ARRAY[]::text[],
    'Cloud internship requirements largely met.',
    '{"studyCredits":10,"requiredCourses":20,"recommendedCourses":10,"skills":30,"language":5,"availability":10,"interests":10,"degreeProgramme":5}'::jsonb
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.selection_decisions (
  id, project_id, student_id, application_id, decision, decided_by, reason
) VALUES
  (
    's1000000-0000-4000-8000-000000000001',
    'p0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000011',
    'd0000000-0000-4000-8000-000000000001',
    'selected',
    'a0000000-0000-4000-8000-000000000003',
    'Best overall match for accessibility-focused portal work.'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (profile_id, type, language, title, body) VALUES
  (
    'a0000000-0000-4000-8000-000000000011',
    'selection_decided',
    'fi',
    'Valinta vahvistettu',
    'Sinut valittiin projektiin Campus portal renewal.'
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'application_received',
    'fi',
    'Uusi hakemus',
    'Opiskelija haki projektiin Campus portal renewal.'
  );
