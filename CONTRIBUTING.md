# Contributing to paytrack-frontend

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/paytrack-frontend`
3. Install dependencies: `npm install`
4. Copy environment: `cp .env.example .env.local`
5. Start the backend (see [paytrack-backend](https://github.com/PayTrack/paytrack-backend))
6. Start the dev server: `npm run dev`

## Branching

- `main` — stable releases only
- `feat/feature-name` — new features
- `fix/issue-description` — bug fixes
- `chore/description` — maintenance

## Coding Standards

- **TypeScript strict mode** — all code must typecheck with `npm run typecheck`
- **Component structure** — pages in `src/pages/`, reusable UI in `src/components/ui/`
- **Data fetching** — always use TanStack Query hooks in `src/hooks/`; never fetch directly in components
- **Forms** — use React Hook Form + Zod for all user input
- **Styling** — Tailwind CSS utility classes; avoid inline styles
- **No hardcoded financial values** — all figures come from the backend API

## Before Submitting a PR

```bash
npm run typecheck    # Must pass with zero errors
npm run lint         # Must pass
npm run build        # Production build must succeed
npm run test         # All tests must pass
```

## UI Contributions

When adding or modifying UI:
- Match the existing design system (colours, spacing, typography)
- Add loading, error, and empty states for any data-dependent component
- Test at common viewport sizes (375px mobile, 1280px desktop)
- Verify keyboard navigation works for interactive elements
- Check colour contrast meets WCAG AA minimums

## Submitting a Pull Request

1. Create a feature branch from `main`
2. Make your changes
3. Run all checks (`typecheck`, `lint`, `build`, `test`)
4. Open a PR with a clear title and description
5. Link any related issues

A maintainer will review within a few days.
