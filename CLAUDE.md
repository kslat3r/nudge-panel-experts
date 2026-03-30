# Nudge Panel Experts

AI-powered landing page analysis tool. A panel of six AI expert personas analyse a user's landing page and deliver a diagnostic report via email.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Material UI)
- **Orchestration**: Mastra (`@mastra/core`) with OpenAI (`gpt-5.2`)
- **Database**: PostgreSQL + pgvector via Drizzle ORM
- **Queue**: BullMQ + Redis for async job processing
- **Scraping**: ScreenshotOne API (screenshots) + Cheerio (HTML extraction)
- **Email**: Resend
- **Hosting**: Fly.io

## Project Structure

```
src/
  app/
    page.tsx                              # Frontend: URL + email submission form
    api/
      v1/
        analyse/route.ts                  # POST — queues a new analysis job
        reports/[jobId]/route.ts          # GET — check job status / fetch report
      health/route.ts                     # GET — health check
  db/
    schema.ts                             # Drizzle schema (jobs, documents tables)
    migrate.ts                            # Runtime migration script
  lib/
    api/
      helpers/
        scrape-landing-page.ts            # Orchestrates HTML fetch + screenshot
        fetch-html.ts                     # Fetches raw HTML from a URL
        take-screenshot.ts                # ScreenshotOne API screenshot capture
        generate-report-html.ts           # HTML report template generation
        render-markdown.ts                # Markdown to HTML conversion
        send-report-email.ts              # Resend email delivery
        create-error.ts                   # Standardised API error response builder
      models/
        db.ts                             # Drizzle + pg Pool singleton
        redis.ts                          # IORedis singleton
        resend.ts                         # Resend client singleton
        queue.ts                          # BullMQ queue factory
      schemas/
        analyse.ts                        # Zod schema for POST /api/v1/analyse
  mastra/
    index.ts                              # Mastra instance with all 6 agents registered
    model.ts                              # OpenAI provider singleton
    agents/
      kahneman.ts                         # Cognitive psychologist agent
      ux-cro.ts                           # UX & CRO specialist agent
      copywriter.ts                       # Copywriter agent
      designer.ts                         # Visual designer agent
      freud.ts                            # Psychoanalyst agent
      sutherland.ts                       # Lateral thinker / behavioural strategist agent
  worker.ts                               # BullMQ worker — orchestrates the full analysis pipeline
```

## Expert Personas

Six Mastra agents, each with a distinct analytical lens:

1. **Daniel Kahneman** (`kahneman`) — Cognitive biases, decision architecture, System 1/2 thinking
2. **UX & CRO Specialist** (`ux-cro`) — Visual hierarchy, CTAs, conversion friction, usability
3. **Copywriter** (`copywriter`) — Headlines, value props, persuasion techniques, CTA copy
4. **Visual Designer** (`designer`) — Composition, colour theory, typography, layout
5. **Sigmund Freud** (`freud`) — Unconscious desires, archetypes, emotional undercurrent
6. **Rory Sutherland** (`sutherland`) — Lateral thinking, reframing, behavioural nudges

Each expert returns: Key Findings, Detailed Analysis, quantitative Metrics (1-10 scores), and a Priority Fix.

## How It Works

1. User submits a landing page URL + email on the frontend
2. `POST /api/v1/analyse` creates a job record in Postgres and queues it via BullMQ
3. The worker picks up the job:
   - Scrapes the landing page (ScreenshotOne API screenshot + Cheerio HTML parse)
   - Runs all 6 expert agents in parallel (each receives page content + screenshot)
   - Generates an executive summary by synthesising all expert outputs
   - Builds a styled HTML report
   - Emails the report to the user via Resend
   - Updates the job record with results

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

## Conventions

- Each expert agent is defined in its own file under `src/mastra/agents/` and registered in `src/mastra/index.ts`
- One function per file in `lib/` directories with default exports
- One `await` per `try/catch` block
- `@/` path alias for all imports (no relative imports)
- Zod validation at API boundaries (`src/lib/api/schemas/`)
- Explicit return types on all functions
- API routes versioned under `/api/v1/`
- Long-running analysis goes through BullMQ to avoid request timeouts
- The worker runs all experts in parallel via `Promise.all` for speed
- The report email template is in `src/lib/api/helpers/generate-report-html.ts` — inline styles for email client compatibility
- The `from` address in `src/lib/api/helpers/send-report-email.ts` must match a verified Resend domain
