# DESIGN.md

## Design direction

**OAMK Matching Tool** should feel like a calm, professional and trustworthy education platform.

The UI should be:

- Minimalist
- Clear
- Fast to understand
- Accessible
- Suitable for students, companies and teachers
- Professional enough for OAMK use
- Simple enough for a course project MVP

Avoid trendy or noisy visuals. The app should feel reliable, not decorative.

---

## Product personality

The design should communicate:

- Trust
- Structure
- Clarity
- Practical progress
- Cooperation between students and companies

The app is not a social media product. It is a practical matching and project coordination tool.

---

## Target users

### Students

Students need to quickly understand:

- What projects are available
- Which projects match their skills
- What they have applied to
- What they should complete in their profile

### Companies

Companies need to quickly understand:

- How to post a project
- Which students have applied
- Which students look relevant
- What information is missing from their company/project profile

### Teachers/Admins

Teachers need to quickly understand:

- How many students are active
- How many companies and projects exist
- Which projects need attention
- What the current project progress looks like

Teacher views should be especially clear, because they may be used for project review and demonstration.

---

## Visual style

Use a clean light interface by default.

Recommended style:

- White and soft gray backgrounds
- Strong readable text
- OAMK-inspired blue as the primary color
- Subtle borders instead of heavy shadows
- Rounded but not overly soft corners
- Clear spacing
- Calm status colors

Avoid:

- Heavy gradients
- Excessive glassmorphism
- Too many accent colors
- Large decorative illustrations in core workflows
- Dark, gaming-style UI
- Tiny text
- Crowded dashboards

---

## Color palette

### Core colors

```txt
Primary blue:      #005EB8
Primary hover:     #004A94
Primary soft:      #EAF3FC

Background:        #F7F9FC
Surface:           #FFFFFF
Surface muted:     #F1F5F9
Border:            #D8E0EA
Border soft:       #E5EAF0

Text primary:      #111827
Text secondary:    #4B5563
Text muted:        #6B7280
Text disabled:     #9CA3AF
```

### Role accent colors

Use these sparingly. The whole UI should not change color by role, but small badges, icons or dashboard highlights can use role accents.

```txt
Student accent:    #2563EB
Company accent:    #0F766E
Teacher accent:    #7C3AED
Admin accent:      #334155
```

### Status colors

```txt
Success:           #15803D
Success soft:      #DCFCE7

Warning:           #B45309
Warning soft:      #FEF3C7

Error:             #B91C1C
Error soft:        #FEE2E2

Info:              #0369A1
Info soft:         #E0F2FE
```

### Matching score colors

Use clear labels in addition to color.

```txt
High match:        #15803D
Medium match:      #B45309
Low match:         #6B7280
```

Example labels:

```txt
High match
Potential match
Low match
```

---

## Typography

Use a clean sans-serif font stack.

Recommended:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type scale:

```txt
Page title:        28-32px / 700
Section title:     20-24px / 600
Card title:        16-18px / 600
Body text:         14-16px / 400
Small text:        12-13px / 400
Button text:       14-15px / 600
```

Rules:

- Do not use very thin font weights.
- Keep line length readable.
- Use headings to structure pages.
- Use secondary text for explanations, not for critical information.

---

## Layout

### App shell

Recommended desktop layout:

```txt
Top bar
Sidebar navigation
Main content area
```

For mobile:

```txt
Top bar
Collapsible navigation
Single-column content
```

### Page width

Use controlled widths:

```txt
Forms:             max-width 640-760px
Dashboards:        max-width 1180-1280px
Tables:            full content width with horizontal handling if needed
```

### Spacing

Use consistent spacing:

```txt
Page padding:      24-32px desktop, 16px mobile
Section gap:       24px
Card padding:      20-24px
Form field gap:    16px
Button gap:        8-12px
```

---

## Navigation

Navigation must be role-specific.

### Student navigation

```txt
Dashboard
My profile
Projects
Applications
Settings
```

### Company navigation

```txt
Dashboard
Company profile
Projects
Applicants
Settings
```

### Teacher/Admin navigation

```txt
Dashboard
Students
Companies
Projects
Matches
Approvals
Settings
```

Do not show irrelevant navigation items to users.

---

## Dashboard design

Each dashboard should start with a clear summary.

### Student dashboard

Recommended cards:

```txt
Profile completion
Recommended projects
Active applications
Newest projects
```

Primary CTA:

```txt
Complete profile
```

or

```txt
Browse projects
```

### Company dashboard

Recommended cards:

```txt
Active projects
New applicants
Profile status
Recommended students
```

Primary CTA:

```txt
Post a project
```

### Teacher/Admin dashboard

Recommended cards:

```txt
Students
Companies
Projects
Applications
Pending approvals
Recent activity
```

Primary CTA:

```txt
Review pending items
```

---

## Components

### Buttons

Use a small set of button styles.

```txt
Primary button:    main action
Secondary button:  alternative action
Ghost button:      low-emphasis action
Danger button:     destructive action
```

Rules:

- One primary action per section.
- Do not use multiple competing primary buttons in the same card.
- Destructive actions require confirmation.

---

### Cards

Cards should be simple and readable.

Use cards for:

- Project summaries
- Student summaries
- Company summaries
- Dashboard metrics
- Match explanations

Card structure:

```txt
Title
Short description
Key metadata
Status / match badge
Main action
```

Avoid cards with too much information. Link to detail pages when needed.

---

### Tables

Use tables for teacher/admin views and lists that need comparison.

Good table columns:

```txt
Name
Role / Type
Status
Created
Owner
Actions
```

Rules:

- Keep actions consistent.
- Use badges for status.
- Make empty states clear.
- Avoid too many columns on mobile.

---

### Forms

Forms must be clear and calm.

Each form section should have:

```txt
Section title
Short explanation
Fields
Save / continue action
```

Input rules:

- Always use labels.
- Use placeholders only as examples, not as labels.
- Mark required fields.
- Show validation messages near the field.
- Show save/loading state.

---

### Badges

Use badges for role, status and match score.

Examples:

```txt
Student
Company
Teacher
Draft
Published
Pending review
Approved
High match
Potential match
```

Badges should be readable and not too bright.

---

## Matching UI

Matching must be explainable.

A match card should show:

```txt
Match score
Short reason
Matched skills
Missing skills if relevant
Recommended action
```

Example:

```txt
85% match
Good fit for this project
Matched: React, TypeScript, UI design
Missing: Supabase experience
```

Do not show only a percentage without explanation.

---

## Empty states

Empty states are important for MVP.

Examples:

### No projects yet

```txt
No projects yet
Create the first company project so students can apply.
```

### No applications yet

```txt
No applications yet
Browse available projects and apply to ones that match your skills.
```

### No matches yet

```txt
No matches yet
Matches will appear after students complete their profiles and companies publish projects.
```

Each empty state should tell the user what to do next.

---

## Loading and error states

### Loading

Use simple loading states:

- Skeleton cards for dashboards
- Spinner only for short actions
- Disabled button with loading text for form submission

Example:

```txt
Saving...
Loading projects...
```

### Error

Use plain language.

Bad:

```txt
RPC failed with status 500
```

Good:

```txt
Projects could not be loaded. Try again.
```

---

## Responsive design

The app must work on laptop screens and mobile.

Rules:

- Use single-column layouts on mobile.
- Tables should become cards or scroll horizontally when needed.
- Navigation should collapse on small screens.
- Buttons should be large enough to tap.
- Avoid fixed-width elements that break mobile layout.

---

## Accessibility rules

- Use semantic HTML.
- Maintain good color contrast.
- All form fields need labels.
- Interactive elements need visible focus states.
- Do not communicate status by color only.
- Use clear button text.
- Avoid tiny click targets.

---

## Tone of UI text

Use clear and neutral language.

Preferred language style:

- Short
- Practical
- Professional
- Easy to understand

Examples:

```txt
Create project
Save profile
Apply to project
Review applicants
Approve company
View match details
```

Avoid:

```txt
Let’s supercharge your career journey!
Amazing opportunities await!
Unlock your future now!
```

The tool is for education and professional matching, not marketing hype.

---

## Suggested page structure

### Landing / start page

Purpose: explain the tool quickly.

Sections:

```txt
Hero: Find student projects and company matches at OAMK
Three role cards: Student, Company, Teacher
How it works
Login / register CTA
```

### Student profile page

Sections:

```txt
Basic information
Skills
Interests
Availability
Preferred project types
Save button
```

### Company project form

Sections:

```txt
Project title
Company
Description
Required skills
Nice-to-have skills
Location / remote
Duration
Contact / next steps
Publish button
```

### Teacher dashboard

Sections:

```txt
Overview metrics
Recent projects
Recent applications
Pending approvals
Activity list
```

---

## Design checklist

Before considering a page done, check:

- Is the main action obvious?
- Is the page readable within five seconds?
- Are roles separated clearly?
- Are empty states handled?
- Are loading and error states handled?
- Does it work on mobile?
- Does it follow the color palette?
- Does it avoid unnecessary visual noise?

---

## Final design rule

When in doubt, choose the simpler design.

The app should help OAMK students, companies and teachers complete their task with minimum friction.

