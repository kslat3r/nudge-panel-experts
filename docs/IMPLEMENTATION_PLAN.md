# Implementation Plan: Report Redesign & Codebase Compliance

Customer feedback driven redesign of the Nudge Panel report experience, plus codebase alignment to AGENTS.md coding standards.

---

## Phase 0: AGENTS.md Compliance Audit & Fixes ✅ COMPLETE

Bring the existing codebase into alignment with AGENTS.md before building new features.

### 0.1 — Sacred Rule: One Function Per File in `lib/`

**Current violations:**

- `src/lib/scraper.ts` — contains `scrapeLandingPage`, `fetchHtml`, `takeScreenshot` (3 functions)
- `src/lib/report.ts` — contains `renderMarkdown`, `generateReportHtml` (2 functions), plus interface definitions
- `src/lib/email.ts` — contains `getResend`, `sendReportEmail` (2 functions)
- `src/lib/queue.ts` — contains `getConnectionOptions`, `getQueue` (2 functions)
- `src/lib/redis.ts` — contains `getRedis` (1 function — OK, but uses named export instead of default)

**Fix:** Split each into single-function files under `src/lib/api/helpers/` with default exports. Private helper functions (e.g., `fetchHtml`, `takeScreenshot`) that are only called by their parent must also be abstracted into separate files. Singletons (Redis, Resend) move to `src/lib/api/models/`.

### 0.2 — Sacred Rule: One `await` Per `try/catch`

**Current violations:**

- `src/worker.ts` — `handleNudgePanelAnalysis` wraps the entire pipeline in a single `try/catch` with ~8 awaits
- `src/app/api/analyse/route.ts` — outer `try/catch` wraps multiple awaits (json parse, db insert, queue add)
- `src/app/api/report/[jobId]/route.ts` — outer `try/catch` wraps params await + db query

**Fix:** Refactor each to wrap every `await` in its own `try/catch` block with specific error handling per the AGENTS.md pattern.

### 0.3 — Sacred Rule: Default Exports

**Current violations:**

- `src/lib/scraper.ts` — named export `scrapeLandingPage`
- `src/lib/report.ts` — named exports `generateReportHtml`, interfaces
- `src/lib/email.ts` — named export `sendReportEmail`
- `src/lib/queue.ts` — named export `getQueue`
- `src/lib/redis.ts` — named export `getRedis`
- `src/mastra/agents/experts.ts` — named exports for all agents + `experts` array
- `src/mastra/index.ts` — named exports for `mastra`
- `src/mastra/model.ts` — named export `openai`
- `src/db/index.ts` — named exports `db`, `schema` (this is effectively a barrel)
- `src/db/schema.ts` — named exports `jobs`, `documents`

**Fix:** Convert all `lib/` helpers to default exports. Mastra/DB modules are framework-specific singletons — move DB to `src/lib/api/models/db.ts` pattern with default export. Schema files and agent registration files get a pass as they're config, not helpers.

### 0.4 — Sacred Rule: No Barrel Imports

**Current violation:**

- `src/db/index.ts` — re-exports `schema` from `./schema` alongside `db`

**Fix:** Import `db` and `schema` directly from their source files.

### 0.5 — Directory Structure Alignment

**Current:** Files are under `src/lib/` flat. AGENTS.md expects `lib/api/helpers/`, `lib/api/models/`, `lib/api/schemas/`.

**Fix:** Restructure to:
```
src/
  lib/
    api/
      helpers/
        scrape-landing-page.ts
        fetch-html.ts
        take-screenshot.ts
        generate-report-html.ts
        send-report-email.ts
      models/
        db.ts
        redis.ts
        resend.ts
        queue.ts
      schemas/
        analyse.ts          # Zod schema for POST /api/analyse
  ...
```

### 0.6 — Missing Zod Validation at API Boundaries

**Current:** `src/app/api/analyse/route.ts` validates manually (`if (!url || !email)`).

**Fix:** Add Zod schema in `src/lib/api/schemas/analyse.ts` and use `schema.parse()` in the route handler.

### 0.7 — Missing Explicit Return Types

**Current violations:** Most functions lack explicit return type annotations.

**Fix:** Add return types to all functions across the codebase.

### 0.8 — API Versioning

**Current:** Routes are at `/api/analyse` and `/api/report/[jobId]`. AGENTS.md requires `/api/v1/` prefix.

**Fix:** Move to `/api/v1/analyse` and `/api/v1/reports/[jobId]`. Update frontend fetch calls.

### 0.9 — Package Manager

**Current:** Already using pnpm (good). `package.json` scripts use `npm run` in CLAUDE.md docs but actual scripts are fine.

**No code change needed**, but update CLAUDE.md script docs to reference `pnpm`.

### 0.10 — Add GitHub Actions Code Review Workflow

**Fix:** Copy the Claude Code Review GitHub Action from `~/Projects/kslat3r/agentbloom/.github/workflows/claude-code-review.yml` into this repo at `.github/workflows/claude-code-review.yml` and implement on Github Actions with the PAT token.

---

## Phase 1: Database & Schema Changes ✅ COMPLETE

### 1.1 — Extend Jobs Table for Report Data

Add columns to the `jobs` table for report-level data:

```
screenshotViewport     text        — above-the-fold screenshot (base64)
screenshotFull         text        — full-page screenshot (base64, nullable)
topIssues              jsonb       — top 3 issues (extracted by summary agent)
executiveSummary       text        — synthesised executive summary
```

**Note:** Aggregated scores are NOT stored — they are computed on the fly by averaging the 5 score columns across all linked `expert_analyses` records for a given job. A helper function `computeAggregatedScores` in `src/lib/api/helpers/compute-aggregated-scores.ts` takes an array of expert analysis records and returns `{ friction, emotionalEngagement, persuasiveness, clarity, trust }` as averages.

### 1.1b — New `expert_analyses` Table

Create a new `expert_analyses` table with a foreign key to `jobs`. Each job has 6 expert analysis records (one per expert).

```
id                   uuid PK
jobId                uuid FK → jobs.id (cascade delete)
expertName           varchar(100)   — e.g. "Henry Crinklebottom"
expertArchetype      varchar(100)   — e.g. "Behavioural Strategist"
friction             integer        — score 1-10
emotionalEngagement  integer        — score 1-10
persuasiveness       integer        — score 1-10
clarity              integer        — score 1-10
trust                integer        — score 1-10
keyQuote             text           — short quote in their tone of voice
fullAnalysis         text           — full detailed analysis (markdown)
createdAt            timestamp
```

### 1.2 — Add Soft Deletes to Jobs Table

AGENTS.md requires `deleted` boolean + `deletedAt` timestamp on all models. Add these to both `jobs` and `documents` tables.

### 1.3 — Add Benchmark Scores Table (or Config)

Store hardcoded benchmark scores as a config constant in `src/lib/api/models/benchmarks.ts`:

```typescript
const BENCHMARK_SCORES = {
  friction: 5.2,
  emotionalEngagement: 4.8,
  persuasiveness: 5.0,
  clarity: 5.5,
  trust: 5.1,
} as const;
```

These will be displayed on the chart alongside the analysed site's scores.

---

## Phase 2: Expert Agent Overhaul ✅ COMPLETE

### 2.1 — Rename Expert Personas to Fictional Characters

Replace real names with fictional characters. Keep identical personality archetypes and analytical lenses.

| Current Name | New Name | Archetype |
|---|---|---|
| Daniel Kahneman | Professor Alistair Tench | Cognitive psychologist / behavioural economist |
| UX & CRO Specialist | Margot Clearwater | UX & conversion rate optimisation specialist |
| Copywriter | Jack Galloway | World-class copywriter |
| Visual Designer | Celeste Moreau | Visual & graphic designer |
| Sigmund Freud | Dr. Vivienne Lark | Depth psychologist / psychoanalyst |
| Rory Sutherland | Henry Crinklebottom | Lateral thinker / behavioural strategist |

### 2.2 — Standardise Scoring Metrics Across All Experts

Currently each expert scores different metrics. Change ALL experts to score the same 5 dimensions:

1. **Friction** (1-10, where 10 = frictionless)
2. **Emotional Engagement** (1-10)
3. **Persuasiveness** (1-10)
4. **Clarity** (1-10)
5. **Trust** (1-10)

Update each expert's prompt to include:

```
Score the following metrics (1-10 each):
- Friction: How frictionless is the user journey?
- Emotional Engagement: How emotionally compelling is the experience?
- Persuasiveness: How persuasive is the overall proposition?
- Clarity: How clear is the messaging and navigation?
- Trust: How trustworthy does the page feel?

Return scores as JSON: { "friction": N, "emotionalEngagement": N, "persuasiveness": N, "clarity": N, "trust": N }
```

### 2.3 — Add Two-Tier Output to Expert Prompts

Each expert now produces TWO outputs:

1. **Full analysis** (existing format — Key Findings, Detailed Analysis, Metrics, Priority Fix) — stored in DB, shown behind "expand" toggle
2. **Key quote** (NEW — 1-3 sentences in their distinct tone of voice, focusing on the single most important issue they found) — shown prominently on the short report

Update prompts to request both. The key quote should read like something that persona would actually say, in their voice.

### 2.4 — Shift Focus to Issues Over Solutions

Update all expert prompts to emphasise diagnosis over prescription:
- "Focus on identifying what's wrong and why, not on proposing fixes"
- "Your role is to diagnose, not prescribe"

---

## Phase 3: Worker Pipeline Changes ✅ COMPLETE

### 3.1 — Capture Both Screenshot Types

Update the scraper to capture:
- **Above-the-fold** screenshot (current behaviour, `fullPage: false`)
- **Full-page** screenshot (new, `fullPage: true`)

Store both in the job record.

### 3.2 — Parse Structured Scores from Expert Responses

After each expert returns their analysis, parse the JSON scores block and key quote from their response. Store each as an `expert_analyses` row. Aggregated scores are computed on the fly at read time (not stored).

### 3.3 — Generate Top 3 Issues via Summary Agent

Update the executive summary generation step to also extract the **top 3 issues** as structured data:

```json
[
  { "title": "Headline fails to communicate value", "category": "clarity", "severity": 9, "description": "..." },
  { "title": "No social proof above the fold", "category": "trust", "severity": 8, "description": "..." },
  { "title": "CTA buried below three scrolls of text", "category": "friction", "severity": 8, "description": "..." }
]
```

### 3.4 — Store All Structured Data

Save to the `jobs` record:
- `screenshotViewport` (above-fold)
- `screenshotFull` (full page)
- `topIssues` (top 3)
- `executiveSummary`

Save to `expert_analyses` (one row per expert, linked by `jobId`):
- `expertName`, `expertArchetype`
- `friction`, `emotionalEngagement`, `persuasiveness`, `clarity`, `trust`
- `keyQuote`
- `fullAnalysis`

Aggregated scores are NOT stored — use `computeAggregatedScores()` at read time.

### 3.5 — Update Email to Teaser + Link

Replace the full HTML report email with a short teaser email:
- Subject: "Your Nudge Panel Report is Ready"
- Body: Brief hook (1-2 sentences about what was found) + prominent CTA button linking to the web report page
- Link format: `{BASE_URL}/report/{jobId}`

---

## Phase 4: Web Report Page ✅ COMPLETE

### 4.1 — Create Report Page Route

New Next.js page at `src/app/report/[jobId]/page.tsx` (server component that fetches job data and renders the report).

### 4.2 — Report Page Layout & Sections

The report page should have these sections, top to bottom:

1. **Header**: "Nudge Panel Report" + URL being analysed + date
2. **Screenshot**: Above-the-fold screenshot of the analysed site (click to expand full-page)
3. **Score Chart**: Horizontal bar chart — 5 bars (Friction, Emotional Engagement, Persuasiveness, Clarity, Trust) with the site's averaged scores vs hardcoded benchmark scores. Use a client-side charting library (e.g., recharts or chart.js).
4. **Top 3 Issues**: Flat ranked list of the 3 most critical issues. Each shows: rank number, title, category tag (e.g., "Friction", "Trust"), and a short description. These are the hero of the report.
5. **Expert Panel**: 6 expert cards, each showing:
   - Expert name + archetype (e.g., "Henry Crinklebottom — Behavioural Strategist")
   - Key quote in their tone (prominent, styled as a blockquote)
   - "Read full analysis" expand/collapse toggle revealing the detailed analysis
6. **AI Disclaimer Narrative**: Short section with copy like: "This report was generated by AI. AI analysis is powerful but imperfect — it spots patterns humans miss, but lacks the nuance of a real conversation. For the full picture, talk to a human."
7. **CTA Section**: Prominent call-to-action: "Book Your FREE 30-Minute Human Nudge Sprint" — mailto link to `ppgtfagan@gmail.com`
8. **Footer**: Branding

### 4.3 — Component Structure

Following AGENTS.md directory-based component structure:

```
src/
  components/
    ReportHeader/
      index.tsx
      types.ts
    ReportScreenshot/
      index.tsx
      types.ts
    ScoreChart/
      index.tsx
      types.ts
    TopIssues/
      index.tsx
      types.ts
    ExpertCard/
      index.tsx
      types.ts
    ExpertPanel/
      index.tsx
      types.ts
    AiDisclaimer/
      index.tsx
    ReportCta/
      index.tsx
      types.ts
    ReportFooter/
      index.tsx
```

### 4.4 — Charting Library

Add `recharts` as a dependency for the horizontal bar chart. It's React-native, lightweight, and works well with MUI.

### 4.5 — Responsive Design

Report page must be mobile-friendly. Use MUI's responsive `sx` props and breakpoints.

---

## Phase 5: Frontend Updates ✅ COMPLETE

### 5.1 — Update Submission Confirmation

After form submission, update the confirmation message:
- "Our panel of experts is analysing your page. You'll receive an email with a link to your report at **{email}** when it's ready."

### 5.2 — Update API Endpoint References

Update frontend fetch calls to use `/api/v1/analyse` (matching the versioned API from Phase 0).

---

## Phase 6: Environment & Config ✅ COMPLETE

### 6.1 — New Environment Variables

Add to `.env.example`:
- `BASE_URL` — the public URL of the app (e.g., `https://nudgepanel.com`), used for report links in emails
- `CTA_EMAIL` — email for the CTA mailto link (default: `ppgtfagan@gmail.com`)

### 6.2 — Update CLAUDE.md

Update project documentation to reflect:
- New directory structure
- New report page route
- New environment variables
- Changed expert names
- Two-tier report architecture

---

## Implementation Order

```
Phase 0  →  Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5  →  Phase 6
(compliance)  (schema)   (agents)    (worker)    (web report)  (frontend)  (config)
```

Each phase is independently deployable, though Phase 4 depends on Phases 1-3 for data.

---

## Out of Scope (Future Work)

- Real benchmark data collection pipeline (running ~100 sites) — currently using hardcoded estimates
- A/B testing the report format
- User accounts / report history
- Analytics on report views
