# droneCalc 🇺🇦

**Free engineering calculator suite for RC aviation and fixed-wing UAVs.**
170+ tools covering aerodynamics, navigation, RF/radio, soldering, ballistics, and mission planning — no registration required.

Live: **[dronecalc.pp.ua](https://dronecalc.pp.ua)**

---

## Contents

- [Overview](#overview)
- [Calculator Suites](#calculator-suites)
- [Engineering Models](#engineering-models)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Security](#security)
- [Contributing](#contributing)

---

## Overview

droneCalc is a Next.js 15 web application built around a clean separation between **domain logic** (`lib/`) and **UI** (`components/`). All physics calculations are pure TypeScript functions with no external dependencies — independently testable and portable.

The project follows an **open-core** model: physics formulas and all calculators are open source; PDF export, saved projects, and API access are reserved for future Pro features.

---

## Calculator Suites

| Tab | Tools |
|-----|-------|
| **perfCalc** | Fixed-wing performance: stall speed, Carson speed, min-power speed, max ROC, T/W ratio, power curve, PDF engineering report |
| **Aeronautical** | Reynolds polars, lift/drag, wing loading, aspect ratio, Oswald factor, stall margin |
| **Navigation** | Wind correction angle, groundspeed, bearing, distance, coordinate transforms (WGS84 ↔ UTM) |
| **Radio Horizon** | Line-of-sight range, Fresnel zones, antenna gain, link margin, path loss |
| **Frequency** | Wavelength, VSWR, impedance matching, coax attenuation |
| **Avionics** | Power budgets, noise figure, receiver sensitivity, SNR |
| **Mission** | Coverage area, scan patterns, loiter time, waypoint battery consumption |
| **Environment** | ISA atmosphere, air density, temperature/pressure at altitude |
| **Geometry** | Mass moment of inertia, CG location, moment arms |
| **Engineering** | Oswald estimation, CD0 from geometry, stall margin, climb gradients |
| **Drone Tools** | TWR, hover efficiency, propeller RPM, disc loading, Ct/Cp |
| **Battery Pack** | Peukert capacity, voltage sag under load, C-rating, series/parallel configs |
| **Optics** | Focal length, horizontal/vertical FoV, gimbal tilt angle, GSD, footprint |
| **Ballistics** | Projectile drop, time of flight, penetration depth, impact velocity |
| **Soldering** | Iron tip temperature, thermal mass, pad size, solder joint cooling |
| **Materials** | Wire gauge, current capacity, resistance, voltage drop |

---

## Engineering Models

All four high-accuracy models are optional overlays on top of the baseline simplified model. Each activates only when the required parameters are provided.

### 1. Altmann Motor Model

Replaces static RPM/power inputs with a physics-derived motor simulation.

Requires: motor `Kv` (RPM/V), winding resistance `Rᵢ` (Ω), no-load current `I₀` (A).

```
Back-EMF:     V_emf = ω / Kv_rad         (ω in rad/s)
Shaft torque: Q = (V_batt − V_emf − I₀·Rᵢ) / Kv_rad
Motor current: I = (V_batt − V_emf) / Rᵢ
Shaft power:  P_shaft = Q · ω
```

Advance ratio `J = V / (n·D)` is used to interpolate dynamic thrust from static Ct/Cp, giving accurate thrust falloff at cruise speed.

### 2. Peukert + Voltage Sag

Corrects battery capacity and terminal voltage under load.

Requires: pack internal resistance `R_batt` (mΩ), Peukert exponent `k` (1.0 = ideal; 1.05–1.10 for LiPo).

```
Voltage sag:        V_eff = max(0.7·V_nom, V_nom − I·R_batt/1000)
Peukert capacity:   C_eff = C_rated · (I_1C / I_actual)^(k−1)
```

Typical effect: drawing 3× the 1C rate at k=1.08 reduces effective capacity by ~15–20% and sags voltage ~0.2–0.4 V on a small pack.

### 3. Reynolds-Corrected Polars

Corrects CD0 and CL_max for low Reynolds number regimes (Re < 300k), typical for aircraft with span < ~1.2 m flying below 80 km/h.

Based on Lissaman (1983) and Selig et al. UIUC data.

```
Chord:           c = S / b                     (wing area / span)
Viscosity:       μ = Sutherland's law (T-dependent)
Reynolds number: Re = ρ·V·c / μ

CD0 correction:   CD0_eff = CD0 · (300k/Re)^0.18          if Re < 300k
CL_max correction: CLmax_eff = CLmax · clamp(0.72 + 0.28·√(Re/300k), 0.72, 1.0)
```

Corrections are applied per-point on the power curve and at the stall speed calculation.

### 4. UIUC Propeller Database

33 propellers with measured static Ct/Cp coefficients from UIUC Applied Aerodynamics Group test data (APC, Graupner, Mejzlik, RFM brands).

When a prop is selected from the database, `ctStaticOverride` and `cpStaticOverride` are passed into `perfSummary`, replacing the empirical formula fallback:

```
T_static = Ct · ρ · n² · D⁴     (n in rev/s, D in m)
P_shaft  = Cp · ρ · n³ · D⁵
```

### Oswald Factor Estimation (Raymer)

The "Авто" button computes e₀ from aspect ratio using Raymer 2018 eq. 12.49:

```
e₀ = clamp(1.78 · (1 − 0.045 · AR^0.68) − 0.64,  0.50, 0.95)
```

---

## Architecture

```
app/                  ← Next.js App Router (thin composition layer)
  layout.tsx          ← metadata, fonts, PWA
  dashboard/page.tsx  ← single page, passes searchParams.tab

components/
  calculators/        ← one suite per domain (UI + user interaction)
  ui/                 ← shadcn/ui primitives (Button, Input, Card, ...)
  Header.tsx
  ErrorBoundary.tsx

lib/                  ← pure TypeScript domain logic — NO React imports
  aero.ts             ← core aerodynamics (634 lines)
  motor-db.ts         ← 81-motor database with token search
  prop-db.ts          ← 33-prop UIUC database
  ballistics.ts
  aero-navigation.ts
  ... (19 modules total)
  __tests__/          ← Vitest unit tests for every module

hooks/
  usePersistedState.ts  ← versioned localStorage (SSR-safe)
  useDashboardNav.ts    ← URL-synced tab state

public/
  sw.js               ← service worker (cache v2)
  manifest.json       ← PWA manifest
```

### Key design rules

- `lib/` contains **no React imports**. Functions are pure `(input) → output`.
- Each calculator suite owns one problem domain. Cross-domain coupling goes through `lib/`.
- State that should survive page reload uses `usePersistedState` (localStorage with schema version).
- Tab state is reflected in the URL (`?tab=perfcalc`) via `history.replaceState` — no Next.js router calls.
- PDF generation (`@react-pdf/renderer`) is isolated to a single `dynamic(..., {ssr: false})` wrapper to avoid SSR conflicts.

---

## Project Structure

```
dronettx/
├── app/
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── calculators/
│   │   ├── CalculatorDashboard.tsx
│   │   ├── PerfCalc.tsx
│   │   ├── PerfCalcReport.tsx          ← @react-pdf/renderer document
│   │   ├── PerfCalcDownloadButton.tsx  ← ssr:false wrapper
│   │   ├── PropulsionForm.tsx          ← motor + prop DB selectors
│   │   ├── AirframeForm.tsx
│   │   ├── EnvironmentForm.tsx
│   │   ├── PowerCurveChart.tsx         ← Recharts
│   │   ├── PerfResultsPanel.tsx
│   │   ├── PerfTestCases.tsx
│   │   ├── perfcalc-presets.ts
│   │   └── *Suite.tsx (16 domain suites)
│   ├── ui/                             ← 12 shadcn/ui components
│   ├── Header.tsx
│   ├── ErrorBoundary.tsx
│   ├── SplashScreen.tsx
│   └── SwRegister.tsx
├── lib/
│   ├── aero.ts                         ← PerfCalcInput, perfSummary, all physics fns
│   ├── motor-db.ts                     ← MOTORS[], searchMotors(), MotorSpec
│   ├── prop-db.ts                      ← PROPS[], PROP_BRANDS, PropSpec
│   ├── ballistics.ts
│   ├── aero-navigation.ts
│   ├── battery-pack.ts
│   ├── drone-tools.ts
│   ├── optics.ts
│   ├── radio-horizon.ts
│   ├── coordinate-systems.ts
│   ├── frequency-tools.ts
│   ├── aviation-engineering.ts
│   ├── avionics-electronics.ts
│   ├── aircraft-geometry.ts
│   ├── external-factors.ts
│   ├── mission-planning.ts
│   ├── soldering-tools.ts
│   └── __tests__/                      ← 15 test files, 480+ tests
├── hooks/
│   ├── usePersistedState.ts
│   └── useDashboardNav.ts
├── tests/smoke/
│   └── dashboard.spec.ts
├── .github/workflows/
│   ├── ci.yml                          ← typecheck → lint → test → build
│   └── smoke.yml                       ← Playwright on every push/PR
├── public/
│   ├── sw.js
│   └── manifest.json
├── next.config.js
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 18, shadcn/ui, Radix UI |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 2.15 |
| PDF | @react-pdf/renderer 4.3 |
| Icons | Lucide React |
| Unit tests | Vitest 4.1 + @vitest/coverage-v8 |
| E2E tests | Playwright 1.58 |
| Linting | ESLint 8 (next/core-web-vitals) |
| CI | GitHub Actions (Node 20) |
| Hosting | Vercel |

---

## Getting Started

**Requirements:** Node.js 20+, npm 10+

```bash
# Clone
git clone https://github.com/wakkawarpman-oss/calc2.git
cd calc2

# Install
npm ci

# Dev server (http://localhost:3000)
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint
```

### Environment

No environment variables are required for local development. The application has no backend, no database, and no external API calls at runtime.

---

## Testing

### Unit tests (Vitest)

```bash
npm test                          # run all tests
npm test -- --reporter=verbose    # verbose output
npm test -- --coverage            # with coverage report
```

Tests live in `lib/__tests__/` — one file per library module.
All physics functions are tested with representative inputs, boundary conditions, and monotonicity checks.

**Current count:** 480+ tests across 15 test files.

### Smoke tests (Playwright)

```bash
npm run test:smoke                # build then run headless
npm run test:smoke:headed         # with visible browser
```

Smoke tests cover:
- Dashboard shell renders (`data-testid="suite-dashboard"`)
- All 12 navigation tabs switch and show correct panels
- Top navigation (`top-nav-materials`) routes correctly

### CI pipeline

Every push and pull request to `main` runs:
1. `tsc --noEmit` — type check
2. `npm run lint` — ESLint
3. `npm test` — unit tests
4. `npm run build` — production build

---

## Security

HTTP response headers are set in `next.config.js` for all routes:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'`* |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation and 8 others all denied |
| `X-Permitted-Cross-Domain-Policies` | `none` |

*`unsafe-inline` for scripts is required by Next.js App Router hydration. `frame-ancestors: none` and `form-action: self` are applied to narrow the attack surface.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. All new physics functions must be in `lib/` (no React imports) with corresponding tests in `lib/__tests__/`
4. Run `npx tsc --noEmit && npm run lint && npm test` before pushing
5. Open a pull request against `main`

### Adding a new calculator

1. Add pure calculation functions to an existing or new `lib/*.ts` module
2. Add unit tests in `lib/__tests__/*.test.ts`
3. Create a `components/calculators/*Suite.tsx` component
4. Register the tab in `components/calculators/CalculatorDashboard.tsx`

---

## License

MIT — see [LICENSE](LICENSE) for details.

Physics formulas are engineering approximations. Validate results against real measurements before operational use.
