gh issue edit 54 --body "Build a view where the teacher can see all their added projects and edit or delete them.

How it works:
1. Fetch all projects from Supabase where teacher_id matches the logged-in teacher
2. Display projects as a list or table with name, description, required skills, and schedule
3. Each project has an Edit button (opens pre-filled form) and a Delete button
4. On edit, update the existing row in projects table and refresh project_skills
5. On delete, remove the project and related rows from project_skills table

Only visible to users with role='teacher' or role='admin'."

gh issue edit 55 --body "Create a Node.js/Express endpoint POST /student that receives student profile data and saves it to Supabase.

Request body:
{
  user_id: string,
  name: string,
  availability: string,
  skills: string[],
  interests: string[]
}

Steps:
1. Insert into students table
2. Insert each skill into skills table
3. Insert each interest into interests table
4. Return the created student object or an error message

Use the Supabase service client on the backend. Handle duplicate profiles by updating instead of inserting."

gh issue edit 56 --body "Create a Node.js/Express endpoint POST /project that receives project data and saves it to Supabase.

Request body:
{
  teacher_id: string,
  name: string,
  description: string,
  required_skills: string[],
  schedule: string
}

Steps:
1. Insert into projects table
2. Insert each required skill into project_skills table
3. Return the created project object or an error message

Only authenticated teachers should be able to call this endpoint. Validate that required fields are not empty."

gh issue edit 57 --body "Create a Node.js/Express endpoint GET /matches/:studentId that returns ranked match results for a student.

Steps:
1. Fetch the student profile (skills, interests, availability) from Supabase
2. Fetch all projects and their required skills from Supabase
3. Run the match-score algorithm for each student-project pair
4. Sort results by score descending
5. Return top 3 matches as JSON

Response format:
[
  {
    project_id: string,
    project_name: string,
    score: number,
    matched_skills: string[],
    missing_skills: string[],
    explanation: string
  }
]"

gh issue edit 58 --body "Implement the core matching logic in Node.js. For each student-project pair, calculate a score between 0-100%.

Scoring breakdown:
- Skill match: 60% weight — (matched skills / total required skills) * 60
- Interest match: 25% weight — check if any student interests appear in project description
- Availability: 15% weight — simple check if student availability fits project schedule

Example: student has 3 of 5 required skills = 36 points. 1 interest match = 25 points. Availability ok = 15 points. Total = 76%.

Document the scoring formula clearly in a comment in the code. The algorithm should be in a separate file (e.g. matchAlgorithm.js) so it can be improved later."

gh issue edit 59 --body "Using the match-score algorithm from #58, sort all projects by score and return the top 3 best matches for a given student.

Each result should include:
- project_id and project_name
- score as a percentage (e.g. 76%)
- matched_skills: which skills the student has that the project requires
- missing_skills: which required skills the student is missing
- explanation: a short human-readable string (see #64)

Save the top 3 results to the matches table in Supabase so they can be retrieved later without re-running the algorithm."

gh issue edit 60 --body "Deploy the app so it is accessible via a public URL.

Backend (Node.js/Express):
1. Push backend code to GitHub
2. Create a new Web Service on Render.com (free tier works)
3. Connect the GitHub repo
4. Set environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
5. Deploy and copy the public URL

Frontend (React):
1. Push frontend code to GitHub
2. Create a new project on Vercel.com
3. Connect the GitHub repo
4. Set environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
5. Deploy and copy the public URL

Test the full flow: register as student, add a project as teacher, run matching, view results."

gh issue edit 61 --body "Allow a logged-in student to update their existing profile.

How it works:
1. Fetch current profile data from Supabase on page load
2. Pre-fill the profile form with existing values
3. Student edits fields and submits
4. On submit, update the existing row in students table (not insert a new one)
5. Delete old skill and interest rows, insert new ones
6. Show a success message after saving

Use the same form component as profile creation (#51) but in edit mode."

gh issue edit 62 --body "Build a React page that fetches all projects from Supabase and displays them as a list or cards.

Each project card shows:
- Project name
- Description
- Required skills (as tags)
- Schedule/deadline

Visible to all logged-in users (students and teachers). Add a 'Find my matches' button for students that calls GET /matches/:studentId and redirects to the match results page."

gh issue edit 63 --body "Ensure match results are sorted from highest to lowest score both in the API response and in the UI.

In the API: sort the results array by score before returning.
In the UI: display results in order with a rank indicator (e.g. #1, #2, #3) and a percentage bar showing the score visually.

If two projects have the same score, sort alphabetically by project name as a tiebreaker."

gh issue edit 64 --body "For each match result, generate a short human-readable explanation using a template string built from the match data. No external AI API needed.

Example output:
'You match 4 out of 5 required skills. Your interest in machine learning aligns with this project. Your availability fits the project schedule.'

Build the explanation in matchAlgorithm.js based on:
- How many skills matched
- Whether any interests matched
- Whether availability matched

The explanation string is included in the API response and displayed in the match results card."

gh issue edit 65 --body "In the match results view, display for each project:
- Match score as a percentage (e.g. 82%)
- Skill overlap as a fraction (e.g. 3/5 skills matched)
- List of matched skills in green
- List of missing skills in red or gray

Fetch this data from the API response which already includes matched_skills and missing_skills arrays. Use color coding to make it easy to scan."

gh issue edit 66 --body "Polish the student profile form and project form.

Requirements:
- Input validation: show error messages for empty required fields
- Loading state: show a spinner or disabled button while submitting
- Success state: show a confirmation message after saving
- Skills and interests: use tag-style input (type a skill, press Enter to add, click to remove)
- Works on both desktop and mobile

Use React controlled components and useState for form state management."

gh issue edit 67 --body "Build the main match results page in React.

Display the top 3 matching projects as cards. Each card shows:
- Rank (#1, #2, #3)
- Project name
- Match score % with a visual progress bar
- Skill overlap (e.g. 3/5 matched skills)
- Matched skills in green, missing skills in gray
- Text explanation from the algorithm
- A button to view full project details

Fetch data from GET /matches/:studentId on page load. Show a loading spinner while fetching. Show an empty state message if no matches are found."

gh issue edit 68 --body "Write the final project report. Structure:

1. Introduction — what the system does and why it was built
2. Problem description — why manual student-project matching is inefficient
3. Algorithm — explain the scoring formula (skill match 60%, interest match 25%, availability 15%), include an example calculation
4. Implementation — describe the tech stack (Supabase, Node.js, React), architecture, and key design decisions
5. Results — screenshots of the working app, example match results
6. Discussion — what worked well, what could be improved, what you would do differently

Length: approximately 10-15 pages. Include code snippets where relevant."

gh issue edit 69 --body "Add a bar chart to the match results view showing scores of the top 3 matches side by side.

How to implement:
1. Install Recharts: npm install recharts
2. Use BarChart component from Recharts
3. X axis: project names
4. Y axis: match score 0-100%
5. Each bar shows the score percentage
6. Add a tooltip showing exact score on hover

Place the chart above or below the match result cards on the results page."

gh issue edit 70 --body "Add filtering and search to the project listing view.

Features:
- Search bar: filter projects by name or description (client-side, no extra API call)
- Skill filter: dropdown or tag selector to filter projects by required skill
- Clear filters button

Implementation: store all projects in React state on page load, filter the displayed list locally using JavaScript array filter(). No need to re-fetch from Supabase on each filter change."

gh issue edit 71 --body "Improve the basic match-score algorithm from #58.

Ideas to explore:
- Weight skills more heavily if they are rare (TF-IDF style)
- Partial skill matching: 'React' matches 'React Native' partially
- Penalize heavily if availability does not match at all
- Add a bonus if the student has more skills than required

Compare results between the basic and improved algorithm using the same test data. Document the difference in match scores and explain which approach is more fair and why."

gh issue edit 47 --body "Create a new project at supabase.com. Copy the project URL and anon key into your codebase as environment variables (.env file). Install Supabase client libraries:

npm install @supabase/supabase-js

Add a supabase.js config file to both the Node.js backend and React frontend that initializes the Supabase client. Verify the connection works by fetching a test query."

gh issue edit 48 --body "Create the following tables in Supabase using the SQL editor:

students: id, user_id (ref auth.users), name, email, availability, created_at
skills: id, student_id (ref students), skill_name
interests: id, student_id (ref students), interest_name
projects: id, teacher_id (ref auth.users), name, description, schedule, created_at
project_skills: id, project_id (ref projects), skill_name
matches: id, student_id, project_id, score, created_at
roles: id, user_id (ref auth.users), role (admin/teacher/student)

Enable Row Level Security (RLS) on all tables. Students can only read/write their own data. Teachers can read all students and write their own projects."

gh issue edit 49 --body "Build a registration and login page for students using Supabase Auth.

Registration: email + password form, calls supabase.auth.signUp(). After sign-up, insert a row into the roles table with role='student' and into the students table with basic profile info. Redirect to profile creation page.

Login: email + password form, calls supabase.auth.signInWithPassword(). After login, check role from roles table and redirect to student dashboard."

gh issue edit 50 --body "Implement login for teachers using Supabase Auth (email + password). Teachers do not self-register — accounts are created by the admin inside the app. After login, teacher is redirected to the project management view. Use a roles table in Supabase to check the user role on login. Roles: admin, teacher, student."

gh issue edit 72 --body "Build an admin-only view where the admin can add and remove teacher accounts.

How it works:
1. Admin logs in normally with email + password
2. App checks roles table — if role is 'admin', show the admin panel
3. Admin fills in teacher name and email in a form
4. App calls Supabase Admin API (service_role key, backend only) to create the user
5. App inserts a row into roles table with role='teacher'
6. Supabase automatically sends a password reset email to the new teacher
7. Teacher clicks the link, sets their password, and can log in

Note: the service_role key must only be used in the Node.js backend, never in the React frontend. The first admin account is created manually in the Supabase dashboard. When handing the app over to the school, update the admin role in the roles table."

gh issue edit 51 --body "Build a form where a logged-in student can enter their profile information.

Fields:
- Full name
- Skills (add multiple, e.g. React, Python, UI design)
- Interests (add multiple, e.g. machine learning, mobile apps)
- Availability (e.g. 10h/week, full-time, specific dates)

Use tag-style input for skills and interests so students can add multiple values. Validate that at least one skill is entered before submitting. On submit, call the POST /student API endpoint."

gh issue edit 52 --body "On profile form submit, save the data to Supabase:

1. Insert a row into the students table (name, user_id, availability)
2. Insert one row per skill into the skills table (student_id, skill_name)
3. Insert one row per interest into the interests table (student_id, interest_name)

Handle errors: if the student already has a profile, update instead of insert. Show a success message after saving. This logic lives in the Node.js backend (POST /student endpoint)."

gh issue edit 53 --body "Build a form visible only to teachers for adding a new project.

Fields:
- Project name
- Description
- Required skills (add multiple, tag-style input)
- Schedule / deadline

Validate that all fields are filled before submitting. On submit, call the POST /project API endpoint which saves to the projects and project_skills tables in Supabase. Show a success message and redirect to the project list view."
