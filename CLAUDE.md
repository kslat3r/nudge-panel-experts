# Nudge Panel Experts

AI-powered landing page analysis tool. A panel of six AI expert personas analyse a user's landing page and deliver a diagnostic report via email.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Orchestration**: Mastra (`@mastra/core`) with Anthropic Claude (`claude-sonnet-4-20250514`)
- **Database**: PostgreSQL + pgvector via Drizzle ORM
- **Queue**: BullMQ + Redis for async job processing
- **Scraping**: Puppeteer (screenshots) + Cheerio (HTML extraction)
- **Observability**: Langfuse tracing
- **Email**: Resend
- **Hosting**: Heroku (web dyno + worker dyno)

## Project Structure

```
src/
  app/
    page.tsx                    # Frontend: URL + email submission form
    api/
      analyse/route.ts          # POST — queues a new analysis job
      report/[jobId]/route.ts   # GET — check job status / fetch report
  db/
    schema.ts                   # Drizzle schema (jobs, documents tables)
    index.ts                    # Database connection
  lib/
    scraper.ts                  # Puppeteer screenshot + Cheerio HTML extraction
    report.ts                   # HTML report template generation
    email.ts                    # Resend email delivery
    langfuse.ts                 # Langfuse singleton + trace helper
    queue.ts                    # BullMQ queue factory
    redis.ts                    # IORedis singleton
  mastra/
    index.ts                    # Mastra instance with all 6 agents registered
    agents/
      experts.ts                # 6 expert persona agent definitions
    tools/
    workflows/
  worker.ts                     # BullMQ worker — orchestrates the full analysis pipeline
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
2. `POST /api/analyse` creates a job record in Postgres and queues it via BullMQ
3. The worker picks up the job:
   - Scrapes the landing page (Puppeteer screenshot + Cheerio HTML parse)
   - Runs all 6 expert agents in parallel (each receives page content + screenshot)
   - Generates an executive summary by synthesising all expert outputs
   - Builds a styled HTML report
   - Emails the report to the user via Resend
   - Updates the job record with results
4. Every agent call is traced in Langfuse for observability

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run worker` — Start BullMQ worker
- `npm run db:push` — Push schema to database
- `npm run db:generate` — Generate Drizzle migrations
- `npm run db:migrate` — Run Drizzle migrations
- `npm run db:studio` — Open Drizzle Studio

## Environment Variables

Copy `.env.example` to `.env`. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `ANTHROPIC_API_KEY` — For Claude LLM calls
- `RESEND_API_KEY` — For email delivery
- `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` — For observability (optional)

## Conventions

- Expert agents are defined in `src/mastra/agents/experts.ts` and registered in `src/mastra/index.ts`
- Long-running analysis goes through BullMQ to avoid Heroku's 30-second request timeout
- The worker runs all experts in parallel via `Promise.all` for speed
- Use `createTrace()` from `src/lib/langfuse.ts` to instrument agent calls
- The report email template is in `src/lib/report.ts` — inline styles for email client compatibility
- The `from` address in `src/lib/email.ts` must match a verified Resend domain
