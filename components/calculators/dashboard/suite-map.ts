'use client'

import dynamic from 'next/dynamic'
import type React from 'react'

type SuiteLoader = () => Promise<unknown>

export const SUITE_COMPONENT_LOADERS: Record<string, SuiteLoader> = {
  mission: () => import('@/components/calculators/MissionPlanningSuite'),
  fieldops: () => import('@/components/calculators/FieldOpsSuite'),
  dronedb: () => import('@/components/calculators/DroneDatabase'),
  perfcalc: () => import('@/components/calculators/PerfCalc'),
  propcalc: () => import('@/components/calculators/BasicCalcs'),
  xcoptercalc: () => import('@/components/calculators/BasicCalcs'),
  cgcalc: () => import('@/components/calculators/BasicCalcs'),
  aeronav: () => import('@/components/calculators/AeroNavigationSuite'),
  engineering: () => import('@/components/calculators/AviationEngineeringSuite'),
  avionics: () => import('@/components/calculators/AvionicsElectronicsSuite'),
  geometry: () => import('@/components/calculators/AircraftGeometrySuite'),
  environment: () => import('@/components/calculators/ExternalFactorsSuite'),
  radiohorizon: () => import('@/components/calculators/RadioHorizonSuite'),
  coords: () => import('@/components/calculators/CoordinateSystemsSuite'),
  frequency: () => import('@/components/calculators/FrequencyToolsSuite'),
  soldering: () => import('@/components/calculators/SolderingSuite'),
  dronetools: () => import('@/components/calculators/DroneEngineerToolset'),
  ballistics: () => import('@/components/calculators/BallisticsSuite'),
  optics: () => import('@/components/calculators/OpticsSuite'),
  battery: () => import('@/components/calculators/BatteryPackSuite'),
  ew: () => import('@/components/calculators/EwJammingSuite'),
  windprofile: () => import('@/components/calculators/WindProfileSuite'),
  thermalcooling: () => import('@/components/calculators/ThermalCoolingSuite'),
  acoustic: () => import('@/components/calculators/AcousticSuite'),
  slipstream: () => import('@/components/calculators/SlipstreamSuite'),
}

export const SUITE_COMPONENT_KEYS = Object.keys(SUITE_COMPONENT_LOADERS)

export function createSuiteComponentsMap(
  loading: () => JSX.Element,
): Record<string, React.ComponentType> {
  return {
    mission: dynamic(() => import('@/components/calculators/MissionPlanningSuite').then((m) => m.MissionPlanningSuite), { loading }),
    fieldops: dynamic(() => import('@/components/calculators/FieldOpsSuite').then((m) => m.FieldOpsSuite), { loading }),
    dronedb: dynamic(() => import('@/components/calculators/DroneDatabase').then((m) => m.DroneDatabase), { loading }),
    perfcalc: dynamic(() => import('@/components/calculators/PerfCalc').then((m) => m.PerfCalc), { loading }),
    propcalc: dynamic(() => import('@/components/calculators/BasicCalcs').then((m) => m.PropCalcBasic), { loading }),
    xcoptercalc: dynamic(() => import('@/components/calculators/BasicCalcs').then((m) => m.XcopterCalcBasic), { loading }),
    cgcalc: dynamic(() => import('@/components/calculators/BasicCalcs').then((m) => m.CGCalcBasic), { loading }),
    aeronav: dynamic(() => import('@/components/calculators/AeroNavigationSuite').then((m) => m.AeroNavigationSuite), { loading }),
    engineering: dynamic(() => import('@/components/calculators/AviationEngineeringSuite').then((m) => m.AviationEngineeringSuite), { loading }),
    avionics: dynamic(() => import('@/components/calculators/AvionicsElectronicsSuite').then((m) => m.AvionicsElectronicsSuite), { loading }),
    geometry: dynamic(() => import('@/components/calculators/AircraftGeometrySuite').then((m) => m.AircraftGeometrySuite), { loading }),
    environment: dynamic(() => import('@/components/calculators/ExternalFactorsSuite').then((m) => m.ExternalFactorsSuite), { loading }),
    radiohorizon: dynamic(() => import('@/components/calculators/RadioHorizonSuite').then((m) => m.RadioHorizonSuite), { loading }),
    coords: dynamic(() => import('@/components/calculators/CoordinateSystemsSuite').then((m) => m.CoordinateSystemsSuite), { loading }),
    frequency: dynamic(() => import('@/components/calculators/FrequencyToolsSuite').then((m) => m.FrequencyToolsSuite), { loading }),
    soldering: dynamic(() => import('@/components/calculators/SolderingSuite').then((m) => m.SolderingSuite), { loading }),
    dronetools: dynamic(() => import('@/components/calculators/DroneEngineerToolset').then((m) => m.DroneEngineerToolset), { loading }),
    ballistics: dynamic(() => import('@/components/calculators/BallisticsSuite').then((m) => m.BallisticsSuite), { loading }),
    optics: dynamic(() => import('@/components/calculators/OpticsSuite').then((m) => m.OpticsSuite), { loading }),
    battery: dynamic(() => import('@/components/calculators/BatteryPackSuite').then((m) => m.BatteryPackSuite), { loading }),
    ew: dynamic(() => import('@/components/calculators/EwJammingSuite').then((m) => m.EwJammingSuite), { loading }),
    windprofile: dynamic(() => import('@/components/calculators/WindProfileSuite').then((m) => m.WindProfileSuite), { loading }),
    thermalcooling: dynamic(() => import('@/components/calculators/ThermalCoolingSuite').then((m) => m.ThermalCoolingSuite), { loading }),
    acoustic: dynamic(() => import('@/components/calculators/AcousticSuite').then((m) => m.AcousticSuite), { loading }),
    slipstream: dynamic(() => import('@/components/calculators/SlipstreamSuite').then((m) => m.SlipstreamSuite), { loading }),
  }
}
