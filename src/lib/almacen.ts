import type { Equipo, Evaluacion, Evaluador } from '../tipos'

const EQUIPOS_KEY = 'rubricas.equipos'
const EVALUACIONES_KEY = 'rubricas.evaluaciones'
const EVALUADORES_KEY = 'rubricas.evaluadores'

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function escribir<T>(clave: string, valor: T): void {
  localStorage.setItem(clave, JSON.stringify(valor))
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const equiposSemilla: Equipo[] = [
  { id: 'equipo-1', nombre: 'Equipo 1', integrantes: [], orden: 1 },
  { id: 'equipo-2', nombre: 'Equipo 2', integrantes: [], orden: 2 },
  { id: 'equipo-3', nombre: 'Equipo 3', integrantes: [], orden: 3 },
]

export function listarEquiposLocal(): Equipo[] {
  const crudo = localStorage.getItem(EQUIPOS_KEY)
  if (crudo === null) {
    escribir(EQUIPOS_KEY, equiposSemilla)
    return equiposSemilla
  }
  const equipos = leer<Equipo[]>(EQUIPOS_KEY, [])
  return [...equipos].sort((a, b) => a.orden - b.orden)
}

export function guardarEquiposLocal(equipos: Equipo[]): void {
  escribir(EQUIPOS_KEY, equipos)
}

export function listarEvaluacionesLocal(): Evaluacion[] {
  return leer<Evaluacion[]>(EVALUACIONES_KEY, [])
}

export function guardarEvaluacionesLocal(evaluaciones: Evaluacion[]): void {
  escribir(EVALUACIONES_KEY, evaluaciones)
}

export function listarEvaluadoresLocal(): Evaluador[] {
  return leer<Evaluador[]>(EVALUADORES_KEY, [])
}

export function guardarEvaluadorLocal(evaluador: Evaluador): void {
  const evaluadores = listarEvaluadoresLocal().filter(
    (e) => e.id !== evaluador.id,
  )
  evaluadores.push(evaluador)
  escribir(EVALUADORES_KEY, evaluadores)
}

export function guardarEvaluadoresLocal(evaluadores: Evaluador[]): void {
  escribir(EVALUADORES_KEY, evaluadores)
}
