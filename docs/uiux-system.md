# UI/UX System

## Purpose

This project uses a single dashboard-oriented UI system optimized for dense engineering workflows.

## Core Principles

- Deterministic states first: idle, loading, success, empty, error.
- One primary action per local context.
- Stable terminology across tabs and tools.
- Pure calculations in `lib/`, focused rendering in `components/`.
- Accessibility is part of the baseline, not follow-up work.
- Keep solutions simple and local first: prefer KISS and avoid speculative abstractions.
- Add new capability by extension, not by rewriting stable flows.

## Design Tokens

- Global tokens live in `app/globals.css`.
- Core surfaces:
  - `calc-surface`
  - `dashboard-card`
  - `dashboard-card-accent`
  - `metric-tile`
- Primitive UI components live under `components/ui/`.

## Interaction Rules

- Buttons and tabs must expose a visible focus state.
- Navigation should remain URL-driven when it represents application state.
- Avoid free-form inputs when a constrained choice is known.
- Long-running actions must show progress or blocked state.

## Architecture Alignment

- Pages in `app/` compose the screen and pass state, but should not own engineering formulas.
- Calculator suites in `components/calculators/` render domain-specific workflows and local UI state.
- Formula and conversion logic belongs in `lib/` as framework-independent functions.
- Data passed between UI layers should stay simple and explicit.
- New calculator families should be added as isolated suites to preserve bounded contexts.

## Testability Rules

- Critical layout landmarks should expose stable selectors or accessible roles.
- Smoke tests should cover:
  - shell render
  - top-level navigation
  - core tab switching
  - materials fallback path

## Automation

- Local smoke runner: `npm run test:smoke`
- Headed smoke runner: `npm run test:smoke:headed`
- CI workflow: `.github/workflows/smoke.yml`
- Current smoke coverage lives in `tests/smoke/dashboard.spec.ts`

## Expansion Pattern

When adding a new calculator suite:

1. Put formulas in `lib/`.
2. Build the suite UI in `components/calculators/`.
3. Wire it into `CalculatorDashboard.tsx`.
4. Add stable selectors for new critical navigation points when needed.
5. Extend smoke coverage only for top-level user-critical flows.