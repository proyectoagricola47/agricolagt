import { cropsService } from '../../crops/services/cropsService'
import { harvestService } from '../../crops/services/harvestService'
import { activityService } from '../../crops/services/activityService'
import { pestService } from '../../pests/services/pestService'
import type { Crop } from '../../../model/crop'
import type { Harvest } from '../../../model/harvest'
import type { CropActivity, ActivityType } from '../../../model/activity'
import type { PestReport, PestSeverity } from '../../../model/pest'

export type Filtros = {
  temporada?: string
  ubicacion?: string
}

export type RendimientoTemporada = {
  temporada: string
  unidad: string
  total: number
  cosechas: number
  ingreso: number
}

export type PlagaPorTipo = {
  tipo: string
  total: number
  baja: number
  media: number
  alta: number
}

export type LaborPorTipo = {
  tipo: ActivityType
  total: number
  costo: number
}

export type LaborPorMes = {
  mes: string
  total: number
}

export type Reporte = {
  cultivos: number
  areaTotal: number
  rendimiento: RendimientoTemporada[]
  plagasPorTipo: PlagaPorTipo[]
  plagasPorSeveridad: Record<PestSeverity, number>
  focosActivos: number
  laboresPorTipo: LaborPorTipo[]
  laboresPorMes: LaborPorMes[]
  gastoTotal: number
  ingresoTotal: number
  temporadasDisponibles: string[]
  ubicacionesDisponibles: string[]
}

/** Datos crudos, cargados una sola vez y filtrados en memoria. */
export type DatosCrudos = {
  cultivos: Crop[]
  cosechas: Harvest[]
  plagas: PestReport[]
  labores: CropActivity[]
}

export async function cargarDatos(): Promise<DatosCrudos> {
  const [cultivos, cosechas, plagas, labores] = await Promise.all([
    cropsService.list(),
    harvestService.listMine(),
    pestService.list(),
    activityService.listRecent(500),
  ])
  return { cultivos, cosechas, plagas, labores }
}

export function construirReporte(datos: DatosCrudos, filtros: Filtros = {}): Reporte {
  const { cultivos, cosechas, plagas, labores } = datos

  // Cultivos que pasan el filtro de ubicación
  const cultivosFiltrados = filtros.ubicacion
    ? cultivos.filter((c) => (c.location ?? '') === filtros.ubicacion)
    : cultivos
  const idsPermitidos = new Set(cultivosFiltrados.map((c) => c.id))

  const cosechasFiltradas = cosechas.filter(
    (h) =>
      idsPermitidos.has(h.cropId) &&
      (!filtros.temporada || h.season === filtros.temporada),
  )
  const plagasFiltradas = plagas.filter((p) => !p.cropId || idsPermitidos.has(p.cropId))
  const laboresFiltradas = labores.filter((a) => idsPermitidos.has(a.cropId))

  // --- Rendimiento por temporada, separado por unidad de medida ---
  const mapaRendimiento = new Map<string, RendimientoTemporada>()
  for (const h of cosechasFiltradas) {
    const clave = `${h.season}|${h.unit}`
    const actual = mapaRendimiento.get(clave) ?? {
      temporada: h.season, unidad: h.unit, total: 0, cosechas: 0, ingreso: 0,
    }
    actual.total += h.quantity
    actual.cosechas += 1
    actual.ingreso += h.income ?? 0
    mapaRendimiento.set(clave, actual)
  }
  const rendimiento = Array.from(mapaRendimiento.values())
    .sort((a, b) => a.temporada.localeCompare(b.temporada))

  // --- Plagas por tipo y severidad ---
  const mapaPlagas = new Map<string, PlagaPorTipo>()
  const porSeveridad: Record<PestSeverity, number> = { baja: 0, media: 0, alta: 0 }
  for (const p of plagasFiltradas) {
    const actual = mapaPlagas.get(p.pestType) ?? {
      tipo: p.pestType, total: 0, baja: 0, media: 0, alta: 0,
    }
    actual.total += 1
    actual[p.severity] += 1
    mapaPlagas.set(p.pestType, actual)
    porSeveridad[p.severity] += 1
  }
  const plagasPorTipo = Array.from(mapaPlagas.values()).sort((a, b) => b.total - a.total)

  // --- Labores por tipo y por mes ---
  const mapaLabores = new Map<ActivityType, LaborPorTipo>()
  const mapaMeses = new Map<string, number>()
  let gastoTotal = 0
  for (const a of laboresFiltradas) {
    const actual = mapaLabores.get(a.activityType) ?? { tipo: a.activityType, total: 0, costo: 0 }
    actual.total += 1
    actual.costo += a.cost ?? 0
    mapaLabores.set(a.activityType, actual)
    gastoTotal += a.cost ?? 0

    const mes = a.performedAt.slice(0, 7)
    if (mes) mapaMeses.set(mes, (mapaMeses.get(mes) ?? 0) + 1)
  }
  const laboresPorTipo = Array.from(mapaLabores.values()).sort((a, b) => b.total - a.total)
  const laboresPorMes = Array.from(mapaMeses.entries())
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-12)

  return {
    cultivos: cultivosFiltrados.length,
    areaTotal: cultivosFiltrados.reduce((s, c) => s + (c.area ?? 0), 0),
    rendimiento,
    plagasPorTipo,
    plagasPorSeveridad: porSeveridad,
    focosActivos: plagasFiltradas.filter((p) => p.status === 'activa').length,
    laboresPorTipo,
    laboresPorMes,
    gastoTotal,
    ingresoTotal: cosechasFiltradas.reduce((s, h) => s + (h.income ?? 0), 0),
    temporadasDisponibles: Array.from(new Set(cosechas.map((h) => h.season))).sort(),
    ubicacionesDisponibles: Array.from(
      new Set(cultivos.map((c) => c.location).filter(Boolean) as string[]),
    ).sort(),
  }
}
