'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Compass, Crosshair, Globe, MapPinned, Move, Navigation, Route, Scale, Target, Waypoints } from 'lucide-react'
import {
  destinationPoint,
  ecefToEnu,
  ecefToGeodetic,
  enuToEcef,
  enuToNed,
  geodeticToEcef,
  geodeticToUtm,
  haversineDistance,
  initialBearing,
  nedToEnu,
  sphericalToLocal,
} from '@/lib/coordinate-systems'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function GeodeticToEcefCard() {
  const [geoState, setGeoState] = usePersistedState('coords.geo', { lat: 50.45, lon: 30.52, alt: 180 })
  const [ecefResult, setEcefResult] = useState<{ x: number; y: number; z: number } | null>(null)
  return (
    <ToolCard icon={<Globe className="h-4 w-4" />} title="Geodetic → ECEF" description="Lat/Lon/Alt у глобальну декартову систему WGS-84.">
      <Field label="Широта, °"><Input type="number" step="0.0001" value={geoState.lat} onChange={(e) => setGeoState((s) => ({ ...s, lat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота, °"><Input type="number" step="0.0001" value={geoState.lon} onChange={(e) => setGeoState((s) => ({ ...s, lon: Number(e.target.value) }))} /></Field>
      <Field label="Висота, м"><Input type="number" step="0.1" value={geoState.alt} onChange={(e) => setGeoState((s) => ({ ...s, alt: Number(e.target.value) }))} /></Field>
      <Button onClick={() => {
        const result = geodeticToEcef(geoState.lat, geoState.lon, geoState.alt)
        setEcefResult(result)
      }}>Розрахувати</Button>
      <ResultBox>X/Y/Z: <span className="font-semibold text-ecalc-navy">{formatToolNumber(ecefResult?.x, 0)} / {formatToolNumber(ecefResult?.y, 0)} / {formatToolNumber(ecefResult?.z, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function EcefToGeodeticCard() {
  const [ecefState, setEcefState] = usePersistedState('coords.ecef', { x: 0, y: 0, z: 0 })
  const [geodeticResult, setGeodeticResult] = useState<{ latDeg: number; lonDeg: number; altM: number } | null>(null)
  return (
    <ToolCard icon={<Crosshair className="h-4 w-4" />} title="ECEF → Geodetic" description="Зворотне перетворення з глобальних координат у lat/lon/alt.">
      <Field label="X, м"><Input type="number" value={ecefState.x} onChange={(e) => setEcefState((s) => ({ ...s, x: Number(e.target.value) }))} /></Field>
      <Field label="Y, м"><Input type="number" value={ecefState.y} onChange={(e) => setEcefState((s) => ({ ...s, y: Number(e.target.value) }))} /></Field>
      <Field label="Z, м"><Input type="number" value={ecefState.z} onChange={(e) => setEcefState((s) => ({ ...s, z: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setGeodeticResult(ecefToGeodetic(ecefState.x, ecefState.y, ecefState.z))}>Розрахувати</Button>
      <ResultBox>Lat/Lon/Alt: <span className="font-semibold text-ecalc-navy">{formatToolNumber(geodeticResult?.latDeg, 5)}° / {formatToolNumber(geodeticResult?.lonDeg, 5)}° / {formatToolNumber(geodeticResult?.altM, 1)} м</span></ResultBox>
    </ToolCard>
  )
}

function GeodeticToUtmCard() {
  const [utmState, setUtmState] = usePersistedState('coords.utm', { lat: 50.45, lon: 30.52 })
  const [utmResult, setUtmResult] = useState<{ zone: number; easting: number; northing: number } | null>(null)
  return (
    <ToolCard icon={<MapPinned className="h-4 w-4" />} title="Geodetic → UTM" description="WGS-84 геодезичні координати у спрощену UTM-проєкцію.">
      <Field label="Широта, °"><Input type="number" step="0.0001" value={utmState.lat} onChange={(e) => setUtmState((s) => ({ ...s, lat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота, °"><Input type="number" step="0.0001" value={utmState.lon} onChange={(e) => setUtmState((s) => ({ ...s, lon: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setUtmResult(geodeticToUtm(utmState.lat, utmState.lon))}>Розрахувати</Button>
      <ResultBox>UTM: <span className="font-semibold text-ecalc-navy">Zone {utmResult?.zone ?? '—'}, E {formatToolNumber(utmResult?.easting, 0)}, N {formatToolNumber(utmResult?.northing, 0)}</span></ResultBox>
    </ToolCard>
  )
}

function EcefToEnuCard() {
  const [enuState, setEnuState] = usePersistedState('coords.enu', { x: 3657773, y: 2148321, z: 5017542, refLat: 50.45, refLon: 30.52, refAlt: 180 })
  const [enuResult, setEnuResult] = useState<{ east: number; north: number; up: number } | null>(null)
  return (
    <ToolCard icon={<Move className="h-4 w-4" />} title="ECEF → ENU" description="Локальна система East-North-Up відносно опорної точки.">
      <Field label="X, м"><Input type="number" value={enuState.x} onChange={(e) => setEnuState((s) => ({ ...s, x: Number(e.target.value) }))} /></Field>
      <Field label="Y, м"><Input type="number" value={enuState.y} onChange={(e) => setEnuState((s) => ({ ...s, y: Number(e.target.value) }))} /></Field>
      <Field label="Z, м"><Input type="number" value={enuState.z} onChange={(e) => setEnuState((s) => ({ ...s, z: Number(e.target.value) }))} /></Field>
      <Field label="Ref lat/lon/alt"><Input type="text" value={`${enuState.refLat}, ${enuState.refLon}, ${enuState.refAlt}`} onChange={() => undefined} readOnly /></Field>
      <Button onClick={() => setEnuResult(ecefToEnu(enuState.x, enuState.y, enuState.z, enuState.refLat, enuState.refLon, enuState.refAlt))}>Розрахувати</Button>
      <ResultBox>E/N/U: <span className="font-semibold text-ecalc-navy">{formatToolNumber(enuResult?.east, 1)} / {formatToolNumber(enuResult?.north, 1)} / {formatToolNumber(enuResult?.up, 1)} м</span></ResultBox>
    </ToolCard>
  )
}

function EnuToEcefCard() {
  const [enuBackState, setEnuBackState] = usePersistedState('coords.enuback', { east: 120, north: 340, up: 25, refLat: 50.45, refLon: 30.52, refAlt: 180 })
  const [ecefBackResult, setEcefBackResult] = useState<{ x: number; y: number; z: number } | null>(null)
  return (
    <ToolCard icon={<Move className="h-4 w-4" />} title="ENU → ECEF" description="Повернення з локальної ENU-системи в глобальну ECEF.">
      <Field label="East, м"><Input type="number" value={enuBackState.east} onChange={(e) => setEnuBackState((s) => ({ ...s, east: Number(e.target.value) }))} /></Field>
      <Field label="North, м"><Input type="number" value={enuBackState.north} onChange={(e) => setEnuBackState((s) => ({ ...s, north: Number(e.target.value) }))} /></Field>
      <Field label="Up, м"><Input type="number" value={enuBackState.up} onChange={(e) => setEnuBackState((s) => ({ ...s, up: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setEcefBackResult(enuToEcef(enuBackState.east, enuBackState.north, enuBackState.up, enuBackState.refLat, enuBackState.refLon, enuBackState.refAlt))}>Розрахувати</Button>
      <ResultBox>X/Y/Z: <span className="font-semibold text-ecalc-navy">{formatToolNumber(ecefBackResult?.x, 1)} / {formatToolNumber(ecefBackResult?.y, 1)} / {formatToolNumber(ecefBackResult?.z, 1)} м</span></ResultBox>
    </ToolCard>
  )
}

function NedEnuConverterCard() {
  const [nedState, setNedState] = usePersistedState('coords.ned', { north: 40, east: 15, down: -8 })
  const [enuFromNedResult, setEnuFromNedResult] = useState<{ east: number; north: number; up: number } | null>(null)
  const [enuToNedState, setEnuToNedState] = usePersistedState('coords.enu2ned', { east: 15, north: 40, up: 8 })
  const [nedFromEnuResult, setNedFromEnuResult] = useState<{ north: number; east: number; down: number } | null>(null)
  return (
    <ToolCard icon={<Scale className="h-4 w-4" />} title="NED ↔ ENU" description="Конвертер між авіаційною NED та наземною ENU системами.">
      <Field label="North / East / Down"><Input type="text" value={`${nedState.north}, ${nedState.east}, ${nedState.down}`} onChange={() => undefined} readOnly /></Field>
      <Button onClick={() => setEnuFromNedResult(nedToEnu(nedState.north, nedState.east, nedState.down))}>NED → ENU</Button>
      <ResultBox>ENU: <span className="font-semibold text-ecalc-navy">{formatToolNumber(enuFromNedResult?.east, 1)} / {formatToolNumber(enuFromNedResult?.north, 1)} / {formatToolNumber(enuFromNedResult?.up, 1)}</span></ResultBox>
      <Field label="East / North / Up"><Input type="text" value={`${enuToNedState.east}, ${enuToNedState.north}, ${enuToNedState.up}`} onChange={() => undefined} readOnly /></Field>
      <Button onClick={() => setNedFromEnuResult(enuToNed(enuToNedState.east, enuToNedState.north, enuToNedState.up))}>ENU → NED</Button>
      <ResultBox>NED: <span className="font-semibold text-ecalc-navy">{formatToolNumber(nedFromEnuResult?.north, 1)} / {formatToolNumber(nedFromEnuResult?.east, 1)} / {formatToolNumber(nedFromEnuResult?.down, 1)}</span></ResultBox>
    </ToolCard>
  )
}

function SphericalToLocalCard() {
  const [localState, setLocalState] = usePersistedState('coords.local', { lat: 50.451, lon: 30.525, refLat: 50.45, refLon: 30.52 })
  const [localResult, setLocalResult] = useState<{ x: number; y: number } | null>(null)
  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Spherical to local" description="Мала сферична апроксимація lat/lon у локальні x/y координати.">
      <Field label="Lat/Lon"><Input type="text" value={`${localState.lat}, ${localState.lon}`} onChange={() => undefined} readOnly /></Field>
      <Field label="Ref Lat/Lon"><Input type="text" value={`${localState.refLat}, ${localState.refLon}`} onChange={() => undefined} readOnly /></Field>
      <Button onClick={() => setLocalResult(sphericalToLocal(localState.lat, localState.lon, localState.refLat, localState.refLon))}>Розрахувати</Button>
      <ResultBox>x/y: <span className="font-semibold text-ecalc-navy">{formatToolNumber(localResult?.x, 1)} / {formatToolNumber(localResult?.y, 1)} м</span></ResultBox>
    </ToolCard>
  )
}

function HaversineCard() {
  const [distanceState, setDistanceState] = usePersistedState('coords.distance', { lat1: 50.45, lon1: 30.52, lat2: 50.46, lon2: 30.53 })
  const [distanceResult, setDistanceResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Route className="h-4 w-4" />} title="Haversine distance" description="Велике коло між двома координатами у метрах.">
      <Field label="Точка 1"><Input type="text" value={`${distanceState.lat1}, ${distanceState.lon1}`} onChange={() => undefined} readOnly /></Field>
      <Field label="Точка 2"><Input type="text" value={`${distanceState.lat2}, ${distanceState.lon2}`} onChange={() => undefined} readOnly /></Field>
      <Button onClick={() => setDistanceResult(haversineDistance(distanceState.lat1, distanceState.lon1, distanceState.lat2, distanceState.lon2))}>Розрахувати</Button>
      <ResultBox>Distance: <span className="font-semibold text-ecalc-navy">{formatToolNumber(distanceResult, 1)} м</span></ResultBox>
    </ToolCard>
  )
}

function InitialBearingCard() {
  const [bearingState, setBearingState] = usePersistedState('coords.bearing', { lat1: 50.45, lon1: 30.52, lat2: 49.84, lon2: 24.03 })
  const [bearingResult, setBearingResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Navigation className="h-4 w-4" />} title="Initial bearing" description="Початковий азимут від точки 1 до точки 2.">
      <Field label="Точка 1"><Input type="text" value={`${bearingState.lat1}, ${bearingState.lon1}`} onChange={() => undefined} readOnly /></Field>
      <Field label="Точка 2"><Input type="text" value={`${bearingState.lat2}, ${bearingState.lon2}`} onChange={() => undefined} readOnly /></Field>
      <Button onClick={() => setBearingResult(initialBearing(bearingState.lat1, bearingState.lon1, bearingState.lat2, bearingState.lon2))}>Розрахувати</Button>
      <ResultBox>Bearing: <span className="font-semibold text-ecalc-navy">{formatToolNumber(bearingResult, 2)}°</span></ResultBox>
    </ToolCard>
  )
}

function DestinationPointCard() {
  const [destinationState, setDestinationState] = usePersistedState('coords.destination', { lat: 50.45, lon: 30.52, distance: 12000, bearing: 315 })
  const [destinationResult, setDestinationResult] = useState<{ latDeg: number; lonDeg: number } | null>(null)
  return (
    <ToolCard icon={<Waypoints className="h-4 w-4" />} title="Destination point" description="Нова точка за заданою відстанню і курсом від старту.">
      <Field label="Старт"><Input type="text" value={`${destinationState.lat}, ${destinationState.lon}`} onChange={() => undefined} readOnly /></Field>
      <Field label="Відстань, м"><Input type="number" value={destinationState.distance} onChange={(e) => setDestinationState((s) => ({ ...s, distance: Number(e.target.value) }))} /></Field>
      <Field label="Курс, °"><Input type="number" value={destinationState.bearing} onChange={(e) => setDestinationState((s) => ({ ...s, bearing: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDestinationResult(destinationPoint(destinationState.lat, destinationState.lon, destinationState.distance, destinationState.bearing))}>Розрахувати</Button>
      <ResultBox>Destination: <span className="font-semibold text-ecalc-navy">{formatToolNumber(destinationResult?.latDeg, 5)}°, {formatToolNumber(destinationResult?.lonDeg, 5)}°</span></ResultBox>
    </ToolCard>
  )
}

export function CoordinateSystemsSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Coordinate Systems Suite</CardTitle>
          <CardDescription>
            10 навігаційних інструментів для переходів між геодезичними, ECEF, ENU, NED, UTM та базових маршрутних обчислень.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Цей модуль закриває геометрію позиціонування для дронів, наземних станцій і маршрутного планування: глобальні координати, локальні системи, відстань, bearing і destination-point.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">10</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Geodesy + local frames</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Тип</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Navigation transforms</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <GeodeticToEcefCard />
        <EcefToGeodeticCard />
        <GeodeticToUtmCard />
        <EcefToEnuCard />
        <EnuToEcefCard />
        <NedEnuConverterCard />
        <SphericalToLocalCard />
        <HaversineCard />
        <InitialBearingCard />
        <DestinationPointCard />
      </div>
    </section>
  )
}
