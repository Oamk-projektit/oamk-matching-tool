# Database Schema

This document describes the database schema for the OAMK Matching Tool built in Supabase.

## Tables

### `profiles`
User role and authentication metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | uuid | FOREIGN KEY (auth.users.id) | Supabase Auth user |
| role | text | NOT NULL, DEFAULT 'student' | User role: admin, teacher, or student |
| created_at | timestamp | NOT NULL, DEFAULT now() | Account creation time |

### `students`
Student profile information and availability.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | uuid | FOREIGN KEY (auth.users.id) | Supabase Auth user |
| name | text | NOT NULL | Student name |
| email | text | NOT NULL | Student email |
| availability | text | | Availability description (e.g., "Full-time", "Part-time") |
| created_at | timestamp | NOT NULL, DEFAULT now() | Profile creation time |

### `skills`
Skills associated with students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| student_id | uuid | FOREIGN KEY (students.id) ON DELETE CASCADE | Reference to student |
| skill_name | text | NOT NULL | Name of the skill (e.g., "React", "Python") |
| created_at | timestamp | NOT NULL, DEFAULT now() | Skill creation time |

### `interests`
Interests/preferences for students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| student_id | uuid | FOREIGN KEY (students.id) ON DELETE CASCADE | Reference to student |
| interest_name | text | NOT NULL | Interest description |
| created_at | timestamp | NOT NULL, DEFAULT now() | Interest creation time |

### `projects`
Projects created by teachers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| teacher_id | uuid | FOREIGN KEY (auth.users.id) | Teacher creating the project |
| name | text | NOT NULL | Project name |
| description | text | | Project description |
| schedule | text | | Project schedule/timeline |
| created_at | timestamp | NOT NULL, DEFAULT now() | Project creation time |

### `project_skills`
Skills required for projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| project_id | uuid | FOREIGN KEY (projects.id) ON DELETE CASCADE | Reference to project |
| skill_name | text | NOT NULL | Required skill name |
| created_at | timestamp | NOT NULL, DEFAULT now() | Skill creation time |

### `matches`
Student-project matches and compatibility scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| student_id | uuid | FOREIGN KEY (students.id) ON DELETE CASCADE | Reference to student |
| project_id | uuid | FOREIGN KEY (projects.id) ON DELETE CASCADE | Reference to project |
| score | float | | Match compatibility score (0-1) |
| created_at | timestamp | NOT NULL, DEFAULT now() | Match creation time |

### `roles`
Legacy role definitions (if needed for role-based features).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | uuid | FOREIGN KEY (auth.users.id) | Supabase Auth user |
| role | text | NOT NULL | Role value (admin, teacher, student) |

## Row Level Security (RLS) Policies

All tables have RLS enabled. Here are the core policies:

### `students` table
- **Students**: Can read/write only their own row
- **Teachers**: Can read all student data
- **Admins**: Full access

### `skills` and `interests` tables
- **Students**: Can read/write only their own related data
- **Teachers**: Can read all

### `projects` table
- **Teachers**: Can create and edit their own projects, read all
- **Students**: Can read all projects
- **Admins**: Full access

### `matches` table
- **Students**: Can read their own matches
- **Teachers**: Can read matches for their projects
- **Admins**: Full access

## Setting Up the Schema

### SQL Setup Script

Run this in Supabase SQL Editor to create all tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'student' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  availability text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create skills table
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create interests table
CREATE TABLE interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  interest_name text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  schedule text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create project_skills table
CREATE TABLE project_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  score float,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create roles table (legacy, optional)
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
```

## Next Steps

1. Run the SQL script above in Supabase dashboard
2. Add RLS policies for each table
3. Add indexes on frequently queried columns (e.g., `student_id`, `project_id`, `teacher_id`)
4. Set up database backups
