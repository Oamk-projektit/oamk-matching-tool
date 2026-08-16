# Matching Algorithm

Canonical implementation: `lib/matching/calculate-match.ts` (+ `lib/matching/constants.ts`, `lib/matching/normalize.ts`, `lib/matching/explain-match.ts`). Types: `types/domain.ts` (`ProjectWeights`, `ScoreBreakdown`), `lib/matching/types.ts`.

The engine is a **deterministic, rule-based scoring function** — not machine learning, and not a random or LLM-based ranking. It never selects a student; it only scores and explains.

---

## 1. Formula

For each of the 8 criteria `c` with an integer weight `w_c` (weights sum to 100) and a ratio `r_c ∈ [0, 1]`:

```
contribution_c = round(w_c * r_c)     // Math.round, half-up
totalScore     = clamp(0, 100, Σ contribution_c)
```

- `contribution` is computed per-criterion in `contribution()` and clamps the ratio to `[0, 1]` before rounding, so malformed ratios can never push a criterion outside its own weight.
- `totalScore` is the sum of all 8 `scoreBreakdown` contributions, then clamped to `[0, 100]` again in `clampScore()` as a final safety net.
- **Same inputs always produce the same `totalScore`, `scoreBreakdown`, and `explanation`.** There is no randomness and no dependency on wall-clock state other than the `calculatedAt` timestamp, which callers may inject for tests.

## 2. Weights (must sum to 100)

`ProjectWeights` is an integer percentage per criterion, validated by `assertValidWeights()` before every calculation (throws `InvalidMatchingWeightsError` / `400 VALIDATION_ERROR` if any weight is non-integer, negative, or the sum ≠ 100).

`DEFAULT_PROJECT_WEIGHTS` (used when a project has no custom weights):

| Criterion | Weight |
|-----------|--------|
| `studyCredits` | 10 |
| `requiredCourses` | 20 |
| `recommendedCourses` | 10 |
| `skills` | 25 |
| `language` | 10 |
| `availability` | 10 |
| `interests` | 10 |
| `degreeProgramme` | 5 |
| **Total** | **100** |

A project may define its own weights (`project_weights` table / `POST /api/projects` `weights` field) as long as they are non-negative integers summing to 100.

## 3. Criteria — how each ratio is computed

| Criterion | Function | Ratio logic |
|-----------|----------|-------------|
| `studyCredits` | `creditsScore` | No minimum → `1`. Student meets/exceeds minimum → `1`. Below minimum → `studentCredits / minimum`, floored at `CREDITS_FLOOR_RATIO` (`0`) so a near-miss isn't silently rounded to a hard zero by unrelated logic. |
| `requiredCourses` | `ratioScore` on `splitRequired` | `matchedRequired / totalRequired`. Empty required-course list → `1` (never penalizes for a project with no course requirements). |
| `recommendedCourses` | same as above | Same logic; empty recommended list → `1`. |
| `skills` | `skillsRatio` | Blends required and recommended skill overlap: `0.8 × requiredRatio + 0.2 × recommendedRatio` (`SKILLS_REQUIRED_BLEND` / `SKILLS_RECOMMENDED_BLEND`). If only one list is non-empty, that list's ratio is used alone. Both empty → `1`. |
| `language` | `languageScore` | `1` if the student's working languages include the project's `requiredLanguage`, else `0`. **Never divides — binary match.** |
| `availability` | `availabilityScore` | Compares `[studentAvailabilityStart, studentAvailabilityEnd]` to `[projectStart, projectEnd]`. Missing dates on either side → neutral `0.5` (`AVAILABILITY_UNKNOWN_RATIO`). Full overlap → `1`. Partial overlap → `overlapDays / projectDurationDays`. No overlap → `0`. |
| `interests` | `interestsScore` (via `splitRequired`) | `matchedInterests / projectInterests.length`. Empty project interest list → `1`. |
| `degreeProgramme` | `degreeProgrammeScore` | Compares the student's canonical education field/programme (with legacy text fallback) against the project's field stored in the legacy `department` column. Empty project field → `1`. Exact normalized match → `1`, else `0`. |

Every ratio function is written to **never divide by zero**: an empty "required" list on the project side always yields a full score for that criterion instead of `NaN` or a crash (`ratioScore(matched, required)` returns `1` when `required <= 0`).

## 4. Language comes from skill/language aliases, not UI `preferredLanguage`

`languageScore()` compares the student's structured **working languages** (`MatchStudentInput.languages`, derived from `LANGUAGE_SKILL_ALIASES` in `lib/matching/constants.ts` — e.g. the skill labels `"fi"`, `"finnish"`, `"suomi"` all normalize to `fi`, and `"en"`, `"english"`, `"englanti"` normalize to `en`) against the project's `requiredLanguage`.

`profiles.preferredLanguage` (the UI locale a user reads the app in, `fi`/`en`) is **never** consulted here — it only controls which language the match `explanation` text is written in (`locale` parameter of `calculateMatch`). Mixing these two would silently penalize a student who prefers a Finnish UI but professionally works in English, so the engine deliberately keeps them separate.

An optional `minimumLanguageLevel` (CEFR `a1`–`c2`, ordered via `CEFR_LEVEL_ORDER`) may be set on a project; in the MVP, students have no per-language CEFR field, so presence of the language already satisfies the floor — the ordering is reserved for a future release without changing the API shape.

## 5. Ranking and Top 3 privacy

- `POST /api/matches/run` (or the project-scoped `POST /api/projects/:id/matches`) computes and persists one current `Match` row per `(student, project)` pair (unique constraint).
- `GET /api/projects/:id/applicants` sorts applicants by `match.totalScore` descending.
- `GET /api/projects/:id/top-candidates` returns the top *N* (default 3, max 10) ranked candidates for a project — **visible only to the owning company, teachers, and admins.** A student calling this endpoint always receives `403 FORBIDDEN`, regardless of whether they applied.
- `GET /api/matches/me` returns **only the caller's own** match rows — never another student's score, rank, or breakdown. This is enforced both in the route handler and by the `matches_select_own_or_project_staff` RLS policy (see `docs/SECURITY.md`).
- The algorithm **never auto-selects**. Ranking is informational; `SelectionDecision.algorithmRank` (see `docs/SCHEMA.md`) records the 1-based rank *at decision time* purely for audit/explainability — the company can select any applicant regardless of rank.

## 6. Deterministic, with a frozen weights snapshot

- `calculateMatch(student, project, weights, locale, calculatedAt)` is a pure function: no I/O, no randomness. Given identical `student`/`project`/`weights` inputs it always returns the same `totalScore`, `scoreBreakdown`, `matchedRequirements`/`missingRequirements`, and `explanation` (for a given `locale`).
- Every persisted `Match` row stores `weights_snapshot` — the exact `ProjectWeights` used for that calculation. If a company later edits a project's weights, **historical match rows are not rewritten**; only a fresh `matches/run` call uses the new weights.
- `SelectionDecision` rows additionally freeze `match_snapshot`, `weights_snapshot`, and `algorithm_rank` at the moment of the decision (see `docs/SCHEMA.md` → selection snapshot columns), so a later rematch or a project weight change never changes what a past selection is shown to have been based on.
- Unit tests for the formula live in `lib/matching/calculate-match.test.ts` and `lib/matching/engine.test.ts`; `lib/matching/flows.test.ts` covers ranking behaviour for the seeded demo data.
