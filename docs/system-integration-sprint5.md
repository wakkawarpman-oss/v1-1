# Sprint-5 System Integration Map

## Data Flow (Ecosystem)

1. Battery module publishes pack metrics into global integration state
- Source: components/calculators/power/BatteryBuilderContainer.tsx
- Published: `batteryCells`, `batteryCellWeightG`, `batteryCapacityMah`, `batteryVoltageV`, `flightTime80Min`

2. Propulsion module subscribes to battery metrics and recalculates thrust
- Source: components/calculators/propulsion/PropulsionCalcContainer.tsx
- Reactivity: battery `S-count` and pack voltage are pulled from integration state
- Published back: `maxThrustG`, `hoverCurrentA`, `flightTime80Min`, optional `motorWeightG`

3. Mission planner subscribes to integration metrics
- Sources:
  - components/calculators/mission/MissionCoreCards.tsx
  - components/calculators/mission/MissionSupportCards.tsx
- Reactivity:
  - battery capacity auto-fills endurance/route/loiter/remaining cards
  - hover current auto-fills endurance/tactical/remaining/loiter cards
  - PNR card auto-syncs total endurance from integrated 80% DoD estimate

4. Global Weight & Balance contract computes TWR and critical warning
- Source: lib/integration-contracts.ts
- Formula:
  - `TotalWeight = FrameWeight + (BatteryWeight * S) + (MotorWeight * MotorCount) + Payload`
  - Warning when `TotalWeight > MaxThrust * 0.8`

## Contracts and Boundaries

- Integration contract: `lib/integration-contracts.ts`
- Shared persisted hook: `hooks/useIntegrationState.ts`
- Integration layer imports pure libs only (no circular imports to UI modules).
- Fail-safe sanitization in integration contracts prevents NaN propagation.

## Deterministic Restore (F5)

- Shared integration state is persisted via `usePersistedState` key: `system.integration.v1`.
- Module-local state remains persisted as before.
- On refresh, ecosystem values restore and cards resync via effects.

## Performance Notes

- Propulsion passive views are memoized with `React.memo`:
  - MotorCard
  - PropellerCard
  - ThrustResultCard
- Container callbacks are stabilized via `useCallback`.
