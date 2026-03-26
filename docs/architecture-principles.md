# Architecture Principles

This document applies the architecture guidance from the attached research material to the current `dronettx` codebase.

## What We Are Optimizing For

- Low-friction extension of calculator families.
- Stable UI behavior under ongoing feature growth.
- Testable engineering logic outside React rendering.
- Clear boundaries between page composition, suite rendering, and formula logic.

## Practical Translation For This Repo

### 1. Clean Boundaries

- `app/` is the composition layer.
- `components/` is the presentation and interaction layer.
- `lib/` is the engineering/domain logic layer.

This follows the dependency direction recommended by clean architecture: UI depends on domain helpers, but domain helpers must not depend on React, Next.js, or browser APIs.

### 2. Single Responsibility

- Each calculator suite should own one coherent problem space.
- Shared primitives belong in `components/calculators/CalculatorToolPrimitives.tsx`.
- Shared formulas belong in dedicated `lib/*.ts` modules.

Avoid mixing:

- route handling with formulas
- rendering with unit conversion logic
- dashboard shell concerns with suite-specific calculations

### 3. Open For Extension, Closed For Churn

When adding new capability:

1. Add or extend a pure module in `lib/`.
2. Build a focused suite component in `components/calculators/`.
3. Register the suite in `CalculatorDashboard.tsx`.
4. Add smoke coverage only for top-level navigation or critical paths.

This keeps expansion additive and avoids rewiring stable areas of the app.

### 4. Bounded Contexts For Calculator Domains

The current dashboard already maps well to domain-oriented contexts:

- performance
- propulsion
- center of gravity
- aero/navigation
- aviation engineering
- avionics/electronics
- geometry
- environment
- radio horizon
- coordinates
- frequency tools

Each of these should continue evolving as an isolated suite with its own formulas and labels.

### 5. KISS And YAGNI

- Prefer direct, readable formulas over abstraction layers that save little duplication.
- Add shared helpers only after the duplication is proven and meaningful.
- Do not introduce service layers, stores, or generic engines unless they remove real complexity.

### 6. DRY Without Hiding Meaning

Repetition should be removed when the repeated logic is truly the same.

Do not over-deduplicate:

- domain labels
- result wording
- field semantics

If two calculators look similar but carry different engineering meaning, keep that meaning explicit.

### 7. Testability Rules

- Pure domain logic should be independently testable from the UI.
- Critical navigation flows should be covered by Playwright smoke tests.
- Stable selectors may be added for shell-level flows, but avoid polluting leaf-level components unnecessarily.

### 8. State Discipline

- URL state should represent navigational state such as active dashboard tabs.
- Local component state should represent transient interaction only.
- Avoid hidden cross-component coupling.

## Current Architectural Pattern

The project is best treated as a modular application, not as a microservice problem.

That means:

- keep the Next.js app as the single delivery surface
- grow by modular suites
- isolate formulas and conversions in pure modules
- use documentation and tests to prevent structural drift

## Review Checklist For New Work

Before merging a new calculator or dashboard feature, verify:

1. Formula logic lives in `lib/` when it is reusable or non-trivial.
2. UI components do not embed unnecessary routing or infrastructure concerns.
3. Labels and terminology match existing dashboard language.
4. The feature fits an existing bounded context or clearly defines a new one.
5. The change adds minimal surface area outside its own module.
6. A smoke test is added only when the flow is user-critical.