# DESIGN_SYSTEM.md

## OAMK Matching Tool — Design System

This document defines the visual design system and component library for the OAMK Matching Tool.

### Color Palette

#### Core Colors
- **Primary Blue**: `#005EB8` — Main brand color, used for primary actions and links
- **Primary Hover**: `#004A94` — Darker blue for hover states
- **Light Gray**: `#f5f5f5` — Background and light elements
- **Medium Gray**: `#e0e0e0` — Borders and dividers
- **Text Dark**: `#171717` — Primary text color
- **Text Medium**: `#666666` — Secondary text color

#### Status Colors
- **Success**: `#22c55e` — Approved, matched, or completed states
- **Error**: `#ef4444` — Errors, warnings, or rejected states
- **Warning**: `#f59e0b` — Pending or in-progress states

### Typography

- **Font Family**: System stack (San Francisco, Segoe UI, Roboto, Helvetica Neue, Arial)
- **Heading 1**: 36px, 700 weight, dark text
- **Heading 2**: 28px, 600 weight, dark text
- **Heading 3**: 24px, 600 weight, dark text
- **Body**: 16px, 400 weight, dark text
- **Small**: 14px, 400 weight, medium gray text

### Components

#### Button
- **Variants**: Primary, Secondary, Outline
- **Sizes**: Small (12px font), Medium (16px), Large (18px)
- **States**: Default, Hover, Active, Disabled
- **Padding**: Responsive (3px-6px vertical, 12px-24px horizontal)

#### Input
- **Border**: 1px solid Medium Gray
- **Focus**: Ring color Primary Blue, border removed
- **Error State**: Red border, error message below
- **Helper Text**: Small gray text below input

#### Card
- **Border**: 1px solid Medium Gray
- **Padding**: 24px (6 units in Tailwind)
- **Shadow**: Subtle shadow on hover
- **Radius**: 8px

#### Badge
- **Variants**: Default, Pending, Approved, Matched
- **Size**: Small, compact design
- **Radius**: Full (pill shape)

#### Navbar
- **Background**: White with bottom border
- **Height**: 64px (16 units in Tailwind)
- **Logo Size**: 32x32px
- **Mobile**: Hamburger menu at 768px breakpoint

### Spacing & Layout

- **Max Width**: 1280px (max-w-7xl)
- **Padding**: 16px mobile, 32px desktop
- **Gap**: 16px default, 24px for section gaps
- **Breakpoints**: 
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Design Principles

1. **Minimalist**: Clean, uncluttered interface
2. **Professional**: Suitable for educational institution
3. **Accessible**: WCAG AA compliant, sufficient contrast, readable fonts
4. **Responsive**: Mobile-first approach
5. **Consistent**: Reusable components, predictable patterns

### Component Library Location

Components are located in `components/ui/`:
- `Button.tsx` — Primary action button
- `Card.tsx` — Content containers
- `Input.tsx` — Form inputs
- `Badge.tsx` — Status indicators
- `Navbar.tsx` — Navigation header

View the live design system at `/style-guide`.

### Tailwind Configuration

The design system is implemented using Tailwind CSS with custom color variables defined in `app/globals.css` for easy updates and consistency.
