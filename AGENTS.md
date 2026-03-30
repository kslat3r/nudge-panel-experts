# AGENTS.md

Universal coding conventions, patterns, and rules for all projects. This is the single source of truth — agents must follow these instructions exactly. Do not deviate, even if you think you have a better idea.

---

## Table of Contents

1. [Sacred Rules](#sacred-rules)
2. [Project Setup](#project-setup)
3. [File & Code Organisation](#file--code-organisation)
4. [TypeScript](#typescript)
5. [Error Handling](#error-handling)
6. [UI & Styling](#ui--styling)
7. [Database & ORM](#database--orm)
8. [API Design](#api-design)
9. [Testing](#testing)
10. [Auth & Security](#auth--security)
11. [DevOps & Deployment](#devops--deployment)
12. [Documentation](#documentation)
13. [Agent Behaviour](#agent-behaviour)

---

## Sacred Rules

These rules are absolute. Never break them, never deviate, never "improve" upon them.

1. **One function per file** in all `lib/` directories. No exceptions.
2. **One `await` per `try/catch` block.** Every awaited call gets its own block.
3. **Default exports** for all helpers, middleware, and components.
4. **Directory-based component structure.** Every component gets its own directory.
5. **No barrel imports.** Never create index files that re-export from other files.

---

## Project Setup

### Framework

Always use **Next.js** with the **App Router** for all new projects. API routes and frontend live together in a single Next.js application.

```
my-project/
├── app/                    # Next.js App Router
│   ├── api/v1/             # API Route Handlers
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # React components
├── lib/                    # Business logic
│   ├── api/                # Server-side code
│   │   ├── helpers/        # One function per file
│   │   ├── middleware/      # Request middleware
│   │   ├── models/         # Singletons (db, logger, etc.)
│   │   └── schemas/        # Zod validation schemas
│   ├── client/             # Client-side code
│   │   ├── helpers/        # Client utilities
│   │   ├── models/         # Client singletons
│   │   └── services/       # Typed API client wrappers
│   └── common/             # Shared between client/server
├── prisma/                 # Database schema(s)
├── tests/                  # Integration/e2e tests
├── scripts/                # CLI tools, cron jobs
├── docs/                   # Documentation
├── public/                 # Static assets
├── Dockerfile              # Multi-stage Docker build
├── fly.toml                # Fly.io production config
├── fly.staging.toml        # Fly.io staging config
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts
└── package.json
```

### Package Manager

Always use **pnpm**.

```bash
pnpm install
pnpm add <package>
pnpm run <script>
```

### Path Aliases

Always configure and use the `@/` path alias. Never use relative imports.

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

```typescript
// Correct
import createUser from '@/lib/api/helpers/create-user';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import Logo from '@/components/Logo';

// Wrong — never do this
import createUser from '../../../lib/api/helpers/create-user';
import { useWorkflow } from '../../contexts/WorkflowContext';
```

---

## File & Code Organisation

### One Function Per File

Every helper function in `lib/` gets its own file with a default export. The file name matches the function name in kebab-case.

```typescript
// lib/api/helpers/create-user.ts
import { PrismaClient } from '.prisma/tenant-client';

async function createUser(db: PrismaClient, email: string, name: string): Promise<User> {
  const user = await db.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });

  return user;
}

export default createUser;
```

```typescript
// lib/api/helpers/get-workflows.ts
import { PrismaClient } from '@prisma/client';

async function getWorkflows(db: PrismaClient): Promise<Workflow[]> {
  const workflows = await db.workflow.findMany();

  return workflows;
}

export default getWorkflows;
```

Never put multiple functions in the same file. Never create utility grab-bags.

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files & directories | kebab-case | `create-workflow.ts`, `lib/api/helpers/` |
| Functions | camelCase | `createWorkflow()`, `handleApiError()` |
| Components | PascalCase directory, `index.tsx` inside | `components/Chat/index.tsx` |
| Interfaces & types | PascalCase | `WorkflowContextType`, `ChatProps` |
| Constants | UPPER_SNAKE_CASE | `STATUS`, `PERMISSIONS`, `ROLE` |
| Type suffixes | `Props`, `Type`, `Request`, `Response`, `Input` | `ChatProps`, `CreditsPostInput` |

### Component Directory Structure

Every component gets its own directory. No exceptions, even for small components.

```
components/
├── Chat/
│   ├── index.tsx          # Component (default export, 'use client' if interactive)
│   ├── types.ts           # Props interface + owned types
│   ├── config.ts          # Static data (optional)
│   ├── helpers.ts         # Pure utilities (optional)
│   └── index.test.tsx     # Unit tests (optional)
├── Alert/
│   ├── index.tsx
│   └── types.ts
├── Logo/
│   └── index.tsx
└── EmptyState/
    ├── index.tsx
    └── types.ts
```

Never nest component directories redundantly:

```
// Wrong
components/Chat/Chat/index.tsx

// Correct
components/Chat/index.tsx
```

### Component File Example

```typescript
// components/Chat/types.ts
import { SxProps, Theme } from '@mui/material';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  phase: 'describe' | 'iterate' | 'system';
  createdAt: string;
}

export interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  loading?: boolean;
  streamingContent?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}
```

```typescript
// components/Chat/index.tsx
'use client';

import { Box, Typography } from '@mui/material';
import { ChatProps } from './types';

function Chat({ messages, onSendMessage, loading, streamingContent, disabled, sx }: ChatProps): React.ReactElement {
  return (
    <Box
      sx={[
        { display: 'flex', flexDirection: 'column', height: '100%' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* component body */}
    </Box>
  );
}

export default Chat;
```

### Constants

Constants live in `model/` or `models/` files. Use `as const` for type safety.

```typescript
// lib/api/models/workflow.ts
export const STATUS = {
  DESCRIBING: 'describing',
  GENERATING: 'generating',
  VALIDATING: 'validating',
  DEPLOYING: 'deploying',
  LIVE: 'live',
  ITERATING: 'iterating',
  FAILED: 'failed',
  PAUSED: 'paused',
  EXPIRED: 'expired',
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];

export const BLOCKED_WORKFLOW_STATUSES: Status[] = [
  STATUS.GENERATING,
  STATUS.VALIDATING,
  STATUS.DEPLOYING,
];
```

### Singletons

Database clients, loggers, and other singletons live in `lib/api/models/`.

```typescript
// lib/api/models/db.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export default db;
```

```typescript
// lib/api/models/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export default logger;
```

### No Barrel Imports

Never create `index.ts` files that re-export from other files. Always import directly from the source file.

```typescript
// Wrong — barrel import
// lib/api/helpers/index.ts
export { default as createUser } from './create-user';
export { default as getWorkflows } from './get-workflows';

// Wrong — importing from barrel
import { createUser, getWorkflows } from '@/lib/api/helpers';

// Correct — direct imports
import createUser from '@/lib/api/helpers/create-user';
import getWorkflows from '@/lib/api/helpers/get-workflows';
```

---

## TypeScript

### Strict Mode

Always enable `strict: true`. Non-negotiable.

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      { "name": "next" }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Explicit Return Types

Every function must have an explicit return type annotation. No exceptions.

```typescript
// Correct
async function createUser(db: PrismaClient, email: string): Promise<User> {
  const user = await db.user.create({ data: { email } });

  return user;
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function Chat({ messages }: ChatProps): React.ReactElement {
  return <Box>{/* ... */}</Box>;
}

// Wrong — missing return types
async function createUser(db: PrismaClient, email: string) {
  return await db.user.create({ data: { email } });
}

function formatDate(date: Date) {
  return date.toISOString();
}
```

### Type Location

Types always live next to their consumers. Never create a shared root-level `types/` directory.

```
// Component types
components/Chat/types.ts

// API response types
lib/client/services/workflows/types.ts

// Validation input types (inferred from Zod)
lib/api/schemas/credits.ts

// Context types
lib/contexts/WorkflowContext/types.ts
```

### Zod for Validation

Always use **Zod** for runtime validation at API boundaries. No other validation libraries.

```typescript
// lib/api/schemas/credits.ts
import { z } from 'zod';

export const creditsPostSchema = z.object({
  credits: z.number().int().min(1, { message: 'Credits must be at least 1' }),
});

export type CreditsPostInput = z.infer<typeof creditsPostSchema>;
```

```typescript
// In a Route Handler
import { creditsPostSchema } from '@/lib/api/schemas/credits';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CreditsPostInput;

  try {
    body = creditsPostSchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json(createError('Invalid request body', error), { status: 400 });
  }

  // Use validated body...
}
```

### ESLint Configuration

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'dist/**'] },
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
```

---

## Error Handling

### One Await Per Try/Catch

Every `await` call must be wrapped in its own `try/catch` block. This ensures granular error messages and allows each failure to be handled independently (retry, fallback, log-and-continue).

Hoist variable declarations above the `try/catch` so they're accessible after the block.

```typescript
// Correct — each await in its own try/catch
async function processWorkflow(db: PrismaClient, id: string): Promise<void> {
  let workflow: Workflow;

  try {
    workflow = await db.workflow.findUniqueOrThrow({ where: { id } });
  } catch (error) {
    throw createError('Workflow not found', error);
  }

  let log: Log;

  try {
    log = await db.log.create({
      data: { workflowId: workflow.id, source: 'generation', level: 'info', message: 'Started' },
    });
  } catch (error) {
    logger.error('Failed to create log', { error });
    // Continue without log — non-critical
  }

  try {
    await deployWorkflow(workflow);
  } catch (error) {
    throw createError('Deployment failed', error);
  }
}

// Wrong — multiple awaits in one try/catch
async function processWorkflow(db: PrismaClient, id: string): Promise<void> {
  try {
    const workflow = await db.workflow.findUniqueOrThrow({ where: { id } });
    const log = await db.log.create({ data: { ... } });
    await deployWorkflow(workflow);
  } catch (error) {
    // Which operation failed? Can't tell. Can't handle each differently.
    throw createError('Something failed', error);
  }
}
```

### Error Response Format

All API errors must use this format:

```typescript
{ error: string; code?: string; details?: unknown }
```

Use a `createError` helper function:

```typescript
// lib/api/helpers/create-error.ts
import { ZodError } from 'zod';

function createError(
  message: string,
  exception?: unknown
): { error: string; code?: string; details?: unknown } {
  if (exception instanceof ZodError) {
    return {
      error: message,
      code: 'VALIDATION_ERROR',
      details: exception.issues,
    };
  }

  if (exception instanceof Error) {
    return { error: message, details: exception.message };
  }

  return { error: message };
}

export default createError;
```

### Route Handler Error Handling

In Next.js Route Handlers, each middleware call gets its own `try/catch` returning a `NextResponse`:

```typescript
// app/api/v1/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import requireTenant from '@/lib/api/middleware/require-tenant';
import requireAuth from '@/lib/api/middleware/require-auth';
import createError from '@/lib/api/helpers/create-error';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  let db: PrismaClient;
  let auth0OrgId: string | null;

  try {
    ({ db, auth0OrgId } = await requireTenant());
  } catch (error) {
    return NextResponse.json(createError('Tenant resolution failed', error), { status: 500 });
  }

  let user: User;

  try {
    user = await requireAuth(db, auth0OrgId);
  } catch (error) {
    return NextResponse.json(createError('Unauthorized', error), { status: 401 });
  }

  return NextResponse.json({ user });
}
```

---

## UI & Styling

### Material-UI

Always use **Material-UI (MUI)** as the UI framework. No Tailwind, no CSS modules, no styled-components.

### sx Prop

Always use the `sx` prop for styling. No other styling methods.

```typescript
// Correct
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: 3,
    backgroundColor: 'background.paper',
    borderRadius: 1,
  }}
>
  <Typography variant="h6" sx={{ color: 'text.primary' }}>
    Title
  </Typography>
</Box>

// Wrong — styled-components
const StyledBox = styled(Box)({ display: 'flex' });

// Wrong — CSS modules
import styles from './Chat.module.css';
<Box className={styles.container} />
```

### sx Prop Merging

When a component accepts an `sx` prop, merge it using the array pattern:

```typescript
function Card({ children, sx }: CardProps): React.ReactElement {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          padding: 2,
          borderRadius: 1,
          backgroundColor: 'background.paper',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
```

### Client Components

All interactive components must use the `'use client'` directive:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Box, Button, TextField } from '@mui/material';

function PromptInput({ onSubmit, disabled, sx }: PromptInputProps): React.ReactElement {
  const [value, setValue] = useState<string>('');

  const handleSubmit = useCallback((): void => {
    onSubmit(value);
    setValue('');
  }, [value, onSubmit]);

  return (
    <Box sx={[{ display: 'flex', gap: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <TextField value={value} onChange={(e) => setValue(e.target.value)} disabled={disabled} fullWidth />
      <Button onClick={handleSubmit} disabled={disabled || !value.trim()}>Send</Button>
    </Box>
  );
}

export default PromptInput;
```

### React Context

Use React Context for global state. Each context gets its own directory with a provider and a custom hook with enforcement.

```typescript
// lib/contexts/WorkflowContext/types.ts
export interface WorkflowContextType {
  workflow: Workflow | null;
  messages: Message[];
  loading: boolean;
  refreshWorkflow: () => Promise<void>;
  addMessage: (content: string) => Promise<void>;
}
```

```typescript
// lib/contexts/WorkflowContext/index.tsx
'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, ReactElement } from 'react';
import { WorkflowContextType } from './types';

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

function WorkflowProvider({ id, children }: { id: string; children: ReactNode }): ReactElement {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshWorkflow = useCallback(async (): Promise<void> => {
    // fetch and set workflow
  }, [id]);

  const addMessage = useCallback(async (content: string): Promise<void> => {
    // post message and update state
  }, [id]);

  const value = useMemo((): WorkflowContextType => ({
    workflow,
    messages,
    loading,
    refreshWorkflow,
    addMessage,
  }), [workflow, messages, loading, refreshWorkflow, addMessage]);

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

export default WorkflowProvider;

export function useWorkflow(): WorkflowContextType {
  const context = useContext(WorkflowContext);

  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }

  return context;
}
```

### Client API Services

Typed fetch wrappers live in `lib/client/services/`. Each service directory has an `index.ts` (functions) and `types.ts` (interfaces).

```typescript
// lib/client/services/workflows/types.ts
export interface Workflow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface ListWorkflowsResponse {
  workflows: Workflow[];
  total: number;
}
```

```typescript
// lib/client/services/workflows/index.ts
import getHeaders from '@/lib/client/helpers/get-headers';
import handleApiError from '@/lib/client/helpers/handle-api-error';
import { ListWorkflowsResponse, Workflow } from './types';

const API_URL = '/api/v1';

async function getWorkflows(status?: string): Promise<ListWorkflowsResponse> {
  const params = new URLSearchParams();

  if (status) {
    params.set('status', status);
  }

  const url = `${API_URL}/workflows${params.toString() ? `?${params}` : ''}`;

  let response: Response;

  try {
    response = await fetch(url, { headers: getHeaders() });
  } catch (error) {
    throw new Error('Failed to fetch workflows');
  }

  if (!response.ok) {
    handleApiError(response);
    throw new Error('Failed to fetch workflows');
  }

  return response.json();
}

export default getWorkflows;
```

---

## Database & ORM

### Prisma

Use **Prisma** as the default ORM. **Drizzle** is acceptable for simpler projects.

### Schema Conventions

- **camelCase** in Prisma models, **snake_case** in the database via `@@map` / `@map`
- **UUID** primary keys always — never auto-increment
- **Soft deletes** on all models — `deleted` boolean + `deletedAt` timestamp
- **Timestamps** on all models — `createdAt` and `updatedAt`
- **Cascade deletes** on child relations where appropriate

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Workflow {
  id          String    @id @default(uuid()) @db.Uuid
  name        String?
  description String?
  status      String    @default("describing")
  deleted     Boolean   @default(false)
  deletedAt   DateTime? @map("deleted_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  messages Message[]
  logs     Log[]

  @@map("workflows")
}

model Message {
  id         String   @id @default(uuid()) @db.Uuid
  workflowId String   @map("workflow_id") @db.Uuid
  role       String   @db.VarChar(50)
  content    String   @db.Text
  phase      String   @db.VarChar(50)
  deleted    Boolean  @default(false)
  deletedAt  DateTime? @map("deleted_at")
  createdAt  DateTime @default(now()) @map("created_at")

  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@map("messages")
}
```

### Database Client Singleton

```typescript
// lib/api/models/db.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export default db;
```

### Database-First Parameter

All helper functions that interact with the database accept `db: PrismaClient` as their first parameter:

```typescript
// Correct
async function createUser(db: PrismaClient, email: string, name: string): Promise<User> {
  // ...
}

// Wrong — accessing a global singleton inside the function
async function createUser(email: string, name: string): Promise<User> {
  const user = await db.user.create({ ... }); // Where did db come from?
}
```

---

## API Design

### Versioned REST

All APIs use versioned REST paths. Always `REST`, always versioned.

```
GET    /api/v1/workflows
POST   /api/v1/workflows
GET    /api/v1/workflows/:id
PUT    /api/v1/workflows/:id
DELETE /api/v1/workflows/:id
GET    /api/v1/workflows/:id/messages
POST   /api/v1/workflows/:id/messages
```

Never use GraphQL or tRPC.

### Response Format

```typescript
// Success — resource(s) at top level
{ workflow: Workflow }
{ workflows: Workflow[]; total: number }

// Error — always this shape
{ error: string; code?: string; details?: unknown }
```

### Pagination

Always use limit/offset pagination:

```
GET /api/v1/workflows?limit=50&offset=0
```

```typescript
// Response
{
  workflows: Workflow[];
  total: number;
}
```

### Real-Time

Use **Server-Sent Events (SSE)** for all real-time communication. Never use WebSockets.

```typescript
// Server — Next.js Route Handler
export async function GET(req: NextRequest): Promise<Response> {
  const stream = new ReadableStream({
    start(controller: ReadableStreamDefaultController): void {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown): void {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      // Subscribe to events and call send()
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Next.js Route Handler Pattern

```typescript
// app/api/v1/workflows/route.ts
import { NextRequest, NextResponse } from 'next/server';
import createError from '@/lib/api/helpers/create-error';
import getWorkflows from '@/lib/api/helpers/get-workflows';
import createWorkflow from '@/lib/api/helpers/create-workflow';
import { workflowPostSchema } from '@/lib/api/schemas/workflow';
import db from '@/lib/api/models/db';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  let workflows: Workflow[];

  try {
    workflows = await getWorkflows(db);
  } catch (error) {
    return NextResponse.json(createError('Failed to list workflows', error), { status: 500 });
  }

  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: WorkflowPostInput;

  try {
    body = workflowPostSchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json(createError('Invalid request body', error), { status: 400 });
  }

  let workflow: Workflow;

  try {
    workflow = await createWorkflow(db, body.name);
  } catch (error) {
    return NextResponse.json(createError('Failed to create workflow', error), { status: 500 });
  }

  return NextResponse.json({ workflow }, { status: 201 });
}
```

### Middleware

Each middleware function is independent. No middleware calls another middleware. Route Handlers call each middleware independently.

```typescript
// lib/api/middleware/require-auth.ts
import { PrismaClient } from '@prisma/client';

async function requireAuth(db: PrismaClient, auth0OrgId: string | null): Promise<User> {
  // Validate session, load user
  // Throw ApiError if unauthorized
}

export default requireAuth;
```

```typescript
// In a Route Handler — call middleware independently
let db: PrismaClient;
let auth0OrgId: string | null;

try {
  ({ db, auth0OrgId } = await requireTenant());
} catch (error) {
  return NextResponse.json(createError('Tenant error', error), { status: 500 });
}

let user: User;

try {
  user = await requireAuth(db, auth0OrgId);
} catch (error) {
  return NextResponse.json(createError('Unauthorized', error), { status: 401 });
}
```

---

## Testing

### Framework

Always use **Vitest**. Never Jest.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

### Test Location

- **Unit tests:** Co-located next to source files (`index.test.tsx`, `create-user.test.ts`)
- **Integration/e2e tests:** Separate `tests/` directory at the project root

```
components/Chat/index.test.tsx          # Unit test — co-located
lib/api/helpers/create-user.test.ts     # Unit test — co-located
tests/__tests__/workflows.test.ts       # Integration test — separate directory
tests/helpers.ts                         # Test factories & utilities
tests/setup.ts                           # Vitest setup
```

### Coverage

Tests must be comprehensive: happy paths, edge cases, and error cases. Aim for **80%+ coverage**.

### Mocking

Mock the database by default. Use a real database only for critical integration tests.

```typescript
// tests/helpers.ts
import { vi } from 'vitest';

vi.mock('@/lib/api/models/db', () => ({
  default: {
    workflow: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Top-level mocks (after imports)
vi.mock('@/lib/api/helpers/create-user', () => ({ default: vi.fn() }));

describe('Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do the expected thing', async () => {
    // Arrange
    const mockData = { id: '123', name: 'Test' };

    // Act
    const result = await someFunction(mockData);

    // Assert
    expect(result).toHaveProperty('id', '123');
  });

  it('should handle errors', async () => {
    // Arrange
    vi.mocked(dependency).mockRejectedValueOnce(new Error('fail'));

    // Act & Assert
    await expect(someFunction()).rejects.toThrow('fail');
  });
});
```

### Test Helpers

Provide factory functions for creating test data:

```typescript
// tests/helpers.ts
import { vi } from 'vitest';

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    deleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestWorkflow(overrides?: Partial<Workflow>): Workflow {
  return {
    id: 'test-workflow-id',
    name: 'Test Workflow',
    status: 'describing',
    deleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

---

## Auth & Security

### Auth Provider

Auth provider is project-dependent. Agents should ask which provider to use. Common options: Auth0, Clerk, NextAuth.

### Middleware Chain

The complexity of the auth middleware chain depends on the project. For simple apps, a single auth middleware is fine. For multi-tenant apps, use a layered chain:

```typescript
// Simple app
let user: User;

try {
  user = await requireAuth(db);
} catch (error) {
  return NextResponse.json(createError('Unauthorized', error), { status: 401 });
}

// Multi-tenant app
try {
  ({ db, auth0OrgId } = await requireTenant());
} catch (error) {
  return NextResponse.json(createError('Tenant error', error), { status: 500 });
}

try {
  user = await requireAuth(db, auth0OrgId);
} catch (error) {
  return NextResponse.json(createError('Unauthorized', error), { status: 401 });
}

try {
  organisation = await requireOrganisation(db, organisationId);
} catch (error) {
  return NextResponse.json(createError('Organisation not found', error), { status: 404 });
}

try {
  await requirePermission(db, user.id, organisation.id, PERMISSIONS.READ);
} catch (error) {
  return NextResponse.json(createError('Forbidden', error), { status: 403 });
}
```

---

## DevOps & Deployment

### Hosting

Always deploy to **Fly.io**.

### Docker

Always containerise with multi-stage Docker builds.

```dockerfile
# Stage 1: Dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm run build

# Stage 3: Production
FROM node:22-slim AS production
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Next.js Config

Always use standalone output for Docker deployments:

```typescript
// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
```

### Branch Strategy

Two long-lived branches: `staging` and `main`.

- **staging** — development and testing
- **main** — production

Merge staging → main for production releases.

### Environment Variables

Use `.env` files locally. Document all required variables in `.env.example`.

```bash
# .env.example
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
```

---

## Documentation

### Required Documentation

Every project must include:

1. **README.md** — Setup instructions, prerequisites, development guide
2. **docs/ARCHITECTURE.md** — System architecture, data flow, key decisions
3. **docs/API_SPEC.md** — REST API documentation with endpoints, request/response examples

### No Project-Level CLAUDE.md

This AGENTS.md is the single source of truth. Do not create per-project CLAUDE.md files.

---

## Agent Behaviour

### Common Mistakes to Avoid

These are the most frequent errors agents make. Do not make them.

1. **Ignoring existing patterns.** Read the codebase first. Match what's already there.
2. **Over-engineering.** Do not add abstractions, utilities, configurability, or features that weren't asked for.
3. **Putting things in the wrong place.** Follow the directory structure exactly.
4. **Breaking the one-function-per-file rule.** Every function gets its own file.
5. **Breaking the one-await-per-try-catch rule.** Every await gets its own block.
6. **Using relative imports.** Always use `@/`.
7. **Creating barrel imports.** Never re-export.
8. **Missing return type annotations.** Every function needs one.
9. **Using styled-components, CSS modules, or Tailwind.** Always use `sx` prop.
10. **Adding comments, docstrings, or type annotations to code you didn't change.** Only modify what was asked.

### Code Style

- Verbose and explicit. Readability over brevity, always.
- Self-documenting through clear naming. Minimal comments.
- Single-line function calls — keep even wide calls on one line rather than wrapping.
- No redundant nesting in directory structures.

### What NOT to Do

- Do not create helper utilities for one-time operations
- Do not add error handling for scenarios that can't happen
- Do not add feature flags or backwards-compatibility shims
- Do not refactor surrounding code when fixing a bug
- Do not add docstrings or comments to code you didn't write
- Do not rename unused variables with `_` prefix — delete them
- Do not create `// removed` comments — just delete the code
