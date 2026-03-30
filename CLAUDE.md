# Nudge Panel Experts

AI-powered landing page analysis tool. A panel of six AI expert personas analyse a user's landing page and deliver a diagnostic report via a web page, with a teaser email linking to it.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Material UI)
- **Orchestration**: Mastra (`@mastra/core`) with OpenAI (`gpt-5.2`)
- **Database**: PostgreSQL + pgvector via Drizzle ORM
- **Queue**: BullMQ + Redis for async job processing
- **Scraping**: ScreenshotOne API (screenshots) + Cheerio (HTML extraction)
- **Charts**: Recharts (horizontal bar chart for score comparisons)
- **Email**: Resend (teaser email with link to web report)
- **Hosting**: Fly.io

## Project Structure

```
src/
  app/
    page.tsx                                    # Frontend: URL + email submission form
    report/[jobId]/page.tsx                     # Web report page (server component)
    api/
      v1/
        analyse/route.ts                        # POST — queues a new analysis job
        reports/[jobId]/route.ts                # GET — check job status / fetch report + analyses
      health/route.ts                           # GET — health check
  components/
    ReportHeader/                               # Report title, URL, date
    ReportScreenshot/                           # Viewport screenshot + full-page expand dialog
    ScoreChart/                                 # Recharts horizontal bar chart (scores vs benchmarks)
    TopIssues/                                  # Top 3 issues ranked list
    ExpertCard/                                 # Single expert: quote + expandable full analysis
    ExpertPanel/                                # Renders all 6 ExpertCards
    AiDisclaimer/                               # "AI is powerful but imperfect" narrative
    ReportCta/                                  # "Book your FREE Human Nudge Sprint" mailto CTA
    ReportFooter/                               # Branding footer
  db/
    schema.ts                                   # Drizzle schema (jobs, expert_analyses, documents)
    migrate.ts                                  # Runtime migration script
  lib/
    api/
      helpers/
        create-error.ts                         # Standardised API error response builder
        create-job.ts                           # Insert new job record
        get-job-by-id.ts                        # Fetch job + expert analyses via left join
      models/
        benchmarks.ts                           # Hardcoded benchmark scores for chart comparison
        db.ts                                   # Drizzle + pg Pool singleton
        redis.ts                                # IORedis singleton
        resend.ts                               # Resend client singleton
        queue.ts                                # BullMQ queue factory
      schemas/
        analyse.ts                              # Zod schema for POST /api/v1/analyse
    common/
      helpers/
        compute-aggregated-scores.ts            # Average expert scores on the fly
        update-job-status.ts                    # Update job status in DB
    worker/
      helpers/
        scrape-landing-page.ts                  # Orchestrates HTML fetch + screenshot
        fetch-html.ts                           # Fetches raw HTML from a URL
        take-screenshot.ts                      # ScreenshotOne API screenshot capture
        build-page-context.ts                   # Formats scraped data into LLM prompt
        run-expert-analyses.ts                  # Runs all 6 experts in parallel, parses responses
        parse-expert-response.ts                # Parses ---KEY QUOTE---, ---FULL ANALYSIS---, ---SCORES---
        store-expert-analyses.ts                # Inserts expert_analyses rows into DB
        generate-summary-and-issues.ts          # Synthesises executive summary + top 3 issues
        update-job-completed.ts                 # Updates job with screenshots, issues, summary
        mark-job-failed.ts                      # Marks job as failed with error message
        send-teaser-email.ts                    # Sends teaser email with link to web report
  mastra/
    index.ts                                    # Mastra instance with all 6 agents registered
    model.ts                                    # OpenAI provider singleton
    agents/
      tench.ts                                  # Professor Alistair Tench — Cognitive Psychologist
      clearwater.ts                             # Margot Clearwater — UX & CRO Specialist
      galloway.ts                               # Jack Galloway — Copywriter
      moreau.ts                                 # Celeste Moreau — Visual Designer
      lark.ts                                   # Dr. Vivienne Lark — Depth Psychologist
      crinklebottom.ts                          # Henry Crinklebottom — Behavioural Strategist
  worker.ts                                     # BullMQ worker — orchestrates the full analysis pipeline
```

## Expert Personas

Six Mastra agents, each with a distinct analytical lens:

1. **Professor Alistair Tench** (`tench`) — Cognitive biases, decision architecture, System 1/2 thinking
2. **Margot Clearwater** (`clearwater`) — Visual hierarchy, CTAs, conversion friction, usability
3. **Jack Galloway** (`galloway`) — Headlines, value props, persuasion techniques, CTA copy
4. **Celeste Moreau** (`moreau`) — Composition, colour theory, typography, layout
5. **Dr. Vivienne Lark** (`lark`) — Unconscious desires, archetypes, emotional undercurrent
6. **Henry Crinklebottom** (`crinklebottom`) — Lateral thinking, reframing, behavioural nudges

Each expert scores 5 standardised metrics (Friction, Emotional Engagement, Persuasiveness, Clarity, Trust), provides a key quote in their voice, and a full detailed analysis.

## How It Works

1. User submits a landing page URL + email on the frontend
2. `POST /api/v1/analyse` creates a job record in Postgres and queues it via BullMQ
3. The worker picks up the job:
   - Scrapes the landing page (viewport + full-page screenshots, Cheerio HTML parse)
   - Runs all 6 expert agents in parallel (each receives page content + screenshot)
   - Parses structured scores, key quotes, and full analyses from each expert
   - Stores expert analyses as individual rows in `expert_analyses` table
   - Generates an executive summary and top 3 issues by synthesising all expert outputs
   - Updates job record with screenshots, top issues, and executive summary
   - Sends a teaser email with a link to the web report
4. User clicks the link to view the report at `/report/{jobId}`
5. Report page fetches job + expert analyses in a single query, computes aggregated scores on the fly

## Commands

- `pnpm run dev` — Start Next.js dev server
- `pnpm run build` — Production build
- `pnpm start` — Start production server
- `pnpm run lint` — Run ESLint
- `pnpm run worker` — Start BullMQ worker
- `pnpm run db:push` — Push schema to database
- `pnpm run db:generate` — Generate Drizzle migrations
- `pnpm run db:migrate` — Run Drizzle migrations
- `pnpm run db:studio` — Open Drizzle Studio

## Environment Variables

Copy `.env.example` to `.env`. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `OPENAI_API_KEY` — For OpenAI LLM calls
- `RESEND_API_KEY` — For email delivery
- `SCREENSHOTONE_ACCESS_KEY` — For ScreenshotOne API
- `SCREENSHOTONE_SECRET_KEY` — For ScreenshotOne API
- `BASE_URL` — Public URL of the app (used for report links in emails)
- `CTA_EMAIL` — Email for the "Book a Nudge Sprint" CTA (default: ppgtfagan@gmail.com)

## Conventions

- Each expert agent is defined in its own file under `src/mastra/agents/` and registered in `src/mastra/index.ts`
- One function per file in `lib/` directories with default exports
- One `await` per `try/catch` block
- `@/` path alias for all imports (no relative imports)
- Zod validation at API boundaries (`src/lib/api/schemas/`)
- Explicit return types on all functions
- API routes versioned under `/api/v1/`
- Directory-based component structure under `src/components/`
- MUI `sx` prop for all styling (no Tailwind, CSS modules, styled-components)
- Worker helpers in `src/lib/worker/helpers/`, API helpers in `src/lib/api/helpers/`, shared helpers in `src/lib/common/helpers/`
- Long-running analysis goes through BullMQ to avoid request timeouts
- The worker runs all experts in parallel via `Promise.all` for speed
- Aggregated scores are computed on the fly from `expert_analyses` rows (not stored)
- The `from` address in teaser emails must match a verified Resend domain
