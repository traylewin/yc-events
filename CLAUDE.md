# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

The application is scaffolded and functional. Auth uses InstantDB's built-in Google OAuth (no NextAuth).

## GitHub Actions

Two Claude-powered workflows are configured:

- **`claude.yml`**: Claude PR Assistant — responds to `@claude` mentions in issues, PR comments, and PR reviews.
- **`claude-code-review.yml`**: Automated code review on every PR using the `code-review` plugin.

Both require the `CLAUDE_CODE_OAUTH_TOKEN` repository secret.

## Preferred Tech Stack

Unless otherwise specified, use the following stack for new projects:

- **Framework**: Next.js (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: InstantDB
- **Vector DB**: Pinecone
- **AI**: Vercel AI SDK
- **Auth**: Google Login using InstantDB auth (when auth is needed)
- **Deployment**: Vercel
- **Cloud Provider**: GCP (when cloud infrastructure is needed)
- **Package Manager**: bun

For more complex production products that require a serious API layer, use **NestJS**.

## Commands

```bash
# Install dependencies
bun install

# Development server (Turbopack)
bun dev

# Build for production
bun run build

# Lint
bun run lint

# Type check
bun run typecheck

# Run tests
bun run test:run      # Unit tests (lib/) — 45 tests
bun run test:ux       # UX happy-path tests (app/) — 14 tests
bun run test:all      # All 59 tests
bun run test:e2e      # Playwright E2E click-through tests
bun run test:e2e:setup # One-time: log in to create auth state for E2E
```

## Environment Variables

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # from Google Cloud Console; must also be added in InstantDB's Google OAuth settings
NEXT_PUBLIC_INSTANTDB_APP_ID=   # from InstantDB dashboard
INSTANTDB_ADMIN_TOKEN=          # only needed for seed script
```

Auth is handled entirely client-side via InstantDB — no NextAuth or server-side sessions.
