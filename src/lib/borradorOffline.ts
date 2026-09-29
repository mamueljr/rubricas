import type { DatosEvaluacion } from './api'

const BORRADORES_KEY = 'rubricas.borradores'

export interface Borrador {
  clave: string
  datos: DatosEvaluacion
  pendiente: boolean
  actualizado: string
}

export function claveBorrador(
  rubricaId: string,
  equipoId: string,
  evaluadorId: string,
): string {
  return `${rubricaId}::${equipoId}::${evaluadorId}`
}

function leerTodos(): Record<string, Borrador> {
  try {
    const crudo = localStorage.getItem(BORRADORES_KEY)
    return crudo ? (JSON.parse(crudo) as Record<string, Borrador>) : {}
  } catch {
    return {}
  }
}

function escribirTodos(borradores: Record<string, Borrador>): void {
  localStorage.setItem(BORRADORES_KEY, JSON.stringify(borradores))
}

export function guardarBorrador(
  clave: string,
  datos: DatosEvaluacion,
  pendiente: boolean,
): void {
  const todos = leerTodos()
  todos[clave] = {
    clave,
    datos,
    pendiente,
    actualizado: new Date().toISOString(),
  }
  escribirTodos(todos)
}

export function leerBorrador(clave: string): Borrador | null {
  return leerTodos()[clave] ?? null
}

export function marcarSincronizado(clave: string): void {
  const todos = leerTodos()
  if (todos[clave]) {
    todos[clave].pendiente = false
    escribirTodos(todos)
  }
}

export function listarPendientes(): Borrador[] {
  return Object.values(leerTodos()).filter((b) => b.pendiente)
}
