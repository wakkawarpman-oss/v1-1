export function syncPnrFromFlightTime<T extends { totalEnduranceMin: number }>(
  prev: T,
  flightTime80Min: number,
): T {
  if (flightTime80Min <= 0) return prev
  if (Math.abs(prev.totalEnduranceMin - flightTime80Min) < 0.2) return prev
  return { ...prev, totalEnduranceMin: flightTime80Min }
}

export function syncBatteryAndHover<T extends { batteryMah: number; hoverCurrentA: number }>(
  prev: T,
  batteryCapacityMah: number,
  hoverCurrentA: number,
): T {
  if (
    prev.batteryMah === batteryCapacityMah &&
    Math.abs(prev.hoverCurrentA - hoverCurrentA) < 0.05
  ) {
    return prev
  }

  return {
    ...prev,
    batteryMah: batteryCapacityMah,
    hoverCurrentA,
  }
}

export function syncBatteryAndAvgCurrent<T extends { batteryMah: number; avgCurrentA: number }>(
  prev: T,
  batteryCapacityMah: number,
  avgCurrentA: number,
): T {
  if (
    prev.batteryMah === batteryCapacityMah &&
    Math.abs(prev.avgCurrentA - avgCurrentA) < 0.05
  ) {
    return prev
  }

  return {
    ...prev,
    batteryMah: batteryCapacityMah,
    avgCurrentA,
  }
}

export function syncBatteryOnly<T extends { batteryMah: number }>(
  prev: T,
  batteryCapacityMah: number,
): T {
  if (prev.batteryMah === batteryCapacityMah) return prev
  return {
    ...prev,
    batteryMah: batteryCapacityMah,
  }
}

export function syncTotalAndCurrent<T extends { totalMah: number; avgCurrentA: number }>(
  prev: T,
  batteryCapacityMah: number,
  hoverCurrentA: number,
): T {
  if (
    prev.totalMah === batteryCapacityMah &&
    Math.abs(prev.avgCurrentA - hoverCurrentA) < 0.05
  ) {
    return prev
  }

  return {
    ...prev,
    totalMah: batteryCapacityMah,
    avgCurrentA: hoverCurrentA,
  }
}
