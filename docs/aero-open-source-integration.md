# Open-Source Aerodynamics Integration

This note captures how the provided external aerodynamics tools should be used in the current `dronettx` architecture.

## Decision

Do not try to embed heavy Python or C++ aerodynamics packages directly into the current browser-only calculator suites.

Use them through a separate compute boundary.

## Recommended Split

- Keep quick estimation tools inside the current Next.js app.
- Run heavier analysis tools behind a Python API or offline engineering workflow.

## Good Candidates By Mode

### Direct fit for backend-assisted integration

- NeuralFoil
- AeroSandbox
- OpenAeroStruct
- Aviary

These are better suited for a Python microservice or job runner that returns JSON to the web app.

### Better as offline desktop or engineering workstation tools

- flow5
- XFLR5
- SU2
- ADflow
- DAFoam
- AeroPython

These are valuable reference or analysis tools, but they should not be presented as native in-browser calculators unless a dedicated backend or export/import workflow is added.

## Practical Architecture For This Repo

1. Keep fast closed-form engineering calculators in `lib/` and `components/calculators/`.
2. If airfoil or CFD analysis is needed, create a backend adapter layer.
3. Expose only stable request/response DTOs to the Next.js frontend.
4. Keep the dashboard UI independent of any one solver implementation.

## Minimal API Shape

Example request:

```json
{
  "coordinates": [[0, 0], [0.5, 0.08], [1, 0]],
  "alpha": 4,
  "re": 250000,
  "mach": 0.08
}
```

Example response:

```json
{
  "cl": 0.62,
  "cd": 0.031,
  "cm": -0.08,
  "alphaStall": 13.5,
  "solver": "NeuralFoil"
}
```

## Why This Matters

This keeps the current application aligned with the project architecture:

- UI remains responsive.
- Formula tools stay local and testable.
- Solver complexity stays outside the dashboard shell.
- External solver replacement does not force a UI rewrite.
