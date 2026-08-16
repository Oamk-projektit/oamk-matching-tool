-- Canonical Oamk education identifiers. Display names are localized in the app.
-- Legacy free-text columns remain temporarily for API compatibility.

ALTER TABLE public.students
  ADD COLUMN education_field_code text,
  ADD COLUMN degree_programme_code text,
  ADD COLUMN specialization_code text;

ALTER TABLE public.students
  ADD CONSTRAINT students_education_field_code_valid CHECK (
    education_field_code IS NULL OR education_field_code IN (
      'information_technology', 'engineering', 'business', 'culture',
      'natural_resources', 'social_services_and_health_care'
    )
  ),
  ADD CONSTRAINT students_degree_programme_code_valid CHECK (
    degree_programme_code IS NULL OR degree_programme_code IN (
      'information_and_communication_technology',
      'business_information_systems',
      'information_technology_beng',
      'energy_and_environmental_engineering',
      'energy_and_environmental_engineering_beng',
      'mechanical_engineering',
      'mechanical_engineering_beng',
      'electrical_and_automation_engineering',
      'building_services_engineering',
      'civil_engineering',
      'construction_architecture',
      'construction_site_management'
    )
  ),
  ADD CONSTRAINT students_specialization_code_valid CHECK (
    specialization_code IS NULL OR specialization_code IN (
      'software_development',
      'device_oriented_software_development',
      'ai_solutions_in_business'
    )
  );

-- Exact known-value migration only; no wildcard or substring replacements.
UPDATE public.students
SET
  education_field_code = 'information_technology',
  degree_programme_code = 'information_and_communication_technology',
  degree_programme = 'Tietotekniikan tutkinto-ohjelma',
  department = 'Informaatioteknologia',
  specialization_code = CASE
    WHEN degree_programme = 'Software Engineering' THEN 'software_development'
    ELSE specialization_code
  END
WHERE degree_programme IN (
  'Software Engineering',
  'Tietotekniikka',
  'Tieto- ja viestintätekniikka'
);

UPDATE public.students
SET
  education_field_code = 'information_technology',
  degree_programme_code = 'business_information_systems',
  degree_programme = 'Tietojenkäsittelyn tutkinto-ohjelma',
  department = 'Informaatioteknologia'
WHERE degree_programme = 'Business Information Technology';

UPDATE public.students
SET
  education_field_code = 'information_technology',
  degree_programme_code = 'information_technology_beng',
  degree_programme = 'Bachelor of Engineering, Information Technology',
  department = 'Informaatioteknologia'
WHERE degree_programme = 'Information Technology';

UPDATE public.students
SET department = 'Informaatioteknologia'
WHERE department = 'ICT';

UPDATE public.projects
SET department = 'Informaatioteknologia'
WHERE department = 'ICT';

UPDATE public.courses
SET department = 'Informaatioteknologia'
WHERE department = 'ICT';

COMMENT ON COLUMN public.students.education_field_code IS
  'Stable Oamk field-of-education identifier; localize through the canonical education catalog.';
COMMENT ON COLUMN public.students.degree_programme_code IS
  'Stable Oamk degree-programme identifier; localize through the canonical education catalog.';
COMMENT ON COLUMN public.students.specialization_code IS
  'Stable Oamk specialization/orientation identifier; localize through the canonical education catalog.';