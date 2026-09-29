import { supabase, hayNube, claveAdmin } from './supabase'
import {
  listarEquiposLocal,
  guardarEquiposLocal,
  listarEvaluacionesLocal,
  guardarEvaluacionesLocal,
  listarEvaluadoresLocal,
  nuevoId,
} from './almacen'
import type {
  Equipo,
  Evaluacion,
  Evaluador,
  PromedioEquipo,
  RespuestasCierre,
} from '../tipos'

export interface DatosEvaluacion {
  equipoId: string
  evaluadorId: string
  rubricaId: string
  respuestas: Record<string, number>
  comentarios: Record<string, string>
  cierre: RespuestasCierre
  total: number | null
  enviado: boolean
}

const cierreVacio: RespuestasCierre = {
  comentarioGeneral: '',
  utilizaria: '',
  gusto: '',
  mejorar: '',
}

interface FilaEvaluacion {
  id: string
  equipo_id: string
  evaluador_id: string
  rubrica_id: string
  respuestas: Record<string, number> | null
  comentarios: Record<string, string> | null
  cierre: RespuestasCierre | null
  total: number | null
  enviado: boolean
  updated_at: string
}

function aEvaluacion(fila: FilaEvaluacion): Evaluacion {
  return {
    id: fila.id,
    equipoId: fila.equipo_id,
    evaluadorId: fila.evaluador_id,
    rubricaId: fila.rubrica_id,
    respuestas: fila.respuestas ?? {},
    comentarios: fila.comentarios ?? {},
    cierre: { ...cierreVacio, ...(fila.cierre ?? {}) },
    total: fila.total,
    enviado: fila.enviado,
    actualizado: fila.updated_at,
  }
}

export async function listarEquipos(): Promise<Equipo[]> {
  if (hayNube && supabase) {
    const { data, error } = await supabase
      .from('equipos')
      .select('id, nombre, integrantes, orden')
      .order('orden', { ascending: true })
    if (error) throw error
    return (data ?? []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      integrantes: e.integrantes ?? [],
      orden: e.orden ?? 0,
    }))
  }
  return listarEquiposLocal()
}

export async function listarMisEvaluaciones(
  evaluadorId: string,
  rubricaId: string,
): Promise<Evaluacion[]> {
  if (hayNube && supabase) {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*')
      .eq('evaluador_id', evaluadorId)
      .eq('rubrica_id', rubricaId)
    if (error) throw error
    return (data ?? []).map(aEvaluacion)
  }
  return listarEvaluacionesLocal().filter(
    (e) => e.evaluadorId === evaluadorId && e.rubricaId === rubricaId,
  )
}

export async function obtenerEvaluacion(
  rubricaId: string,
  equipoId: string,
  evaluadorId: string,
): Promise<Evaluacion | null> {
  const todas = await listarMisEvaluaciones(evaluadorId, rubricaId)
  return todas.find((e) => e.equipoId === equipoId) ?? null
}

export async function guardarEvaluacion(
  datos: DatosEvaluacion,
): Promise<Evaluacion> {
  const ahora = new Date().toISOString()

  if (hayNube && supabase) {
    const { data, error } = await supabase
      .from('evaluaciones')
      .upsert(
        {
          equipo_id: datos.equipoId,
          evaluador_id: datos.evaluadorId,
          rubrica_id: datos.rubricaId,
          respuestas: datos.respuestas,
          comentarios: datos.comentarios,
          cierre: datos.cierre,
          total: datos.total,
          enviado: datos.enviado,
          updated_at: ahora,
        },
        { onConflict: 'equipo_id,evaluador_id,rubrica_id' },
      )
      .select('*')
      .single()
    if (error) throw error
    return aEvaluacion(data)
  }

  const evaluaciones = listarEvaluacionesLocal()
  const indice = evaluaciones.findIndex(
    (e) =>
      e.equipoId === datos.equipoId &&
      e.evaluadorId === datos.evaluadorId &&
      e.rubricaId === datos.rubricaId,
  )
  const evaluacion: Evaluacion = {
    id: indice >= 0 ? evaluaciones[indice].id : nuevoId(),
    ...datos,
    actualizado: ahora,
  }
  if (indice >= 0) evaluaciones[indice] = evaluacion
  else evaluaciones.push(evaluacion)
  guardarEvaluacionesLocal(evaluaciones)
  return evaluacion
}

export async function esAdmin(clave: string): Promise<boolean> {
  if (hayNube && supabase) {
    const { data, error } = await supabase.rpc('admin_login', { p_clave: clave })
    if (error) throw error
    return Boolean(data)
  }
  return claveAdmin.length === 0 ? true : clave === claveAdmin
}

export async function guardarEquipo(
  clave: string,
  equipo: Pick<Equipo, 'id' | 'nombre' | 'integrantes' | 'orden'>,
): Promise<void> {
  if (hayNube && supabase) {
    const { error } = await supabase.rpc('admin_guardar_equipo', {
      p_clave: clave,
      p_id: equipo.id || null,
      p_nombre: equipo.nombre,
      p_integrantes: equipo.integrantes,
      p_orden: equipo.orden,
    })
    if (error) throw error
    return
  }
  const equipos = listarEquiposLocal()
  const indice = equipos.findIndex((e) => e.id === equipo.id)
  const final: Equipo = { ...equipo, id: equipo.id || nuevoId() }
  if (indice >= 0) equipos[indice] = final
  else equipos.push(final)
  guardarEquiposLocal(equipos)
}

export async function eliminarEquipo(clave: string, id: string): Promise<void> {
  if (hayNube && supabase) {
    const { error } = await supabase.rpc('admin_eliminar_equipo', {
      p_clave: clave,
      p_id: id,
    })
    if (error) throw error
    return
  }
  guardarEquiposLocal(listarEquiposLocal().filter((e) => e.id !== id))
}

export async function listarTodasEvaluaciones(
  clave: string,
  rubricaId: string,
): Promise<Evaluacion[]> {
  if (hayNube && supabase) {
    const { data, error } = await supabase.rpc('admin_listar_evaluaciones', {
      p_clave: clave,
      p_rubrica: rubricaId,
    })
    if (error) throw error
    return (data ?? []).map(aEvaluacion)
  }
  return listarEvaluacionesLocal().filter((e) => e.rubricaId === rubricaId)
}

export async function listarEvaluadores(clave: string): Promise<Evaluador[]> {
  if (hayNube && supabase) {
    const { data, error } = await supabase.rpc('admin_listar_evaluadores', {
      p_clave: clave,
    })
    if (error) throw error
    return (data ?? []) as Evaluador[]
  }
  return listarEvaluadoresLocal()
}

export function promediosPorEquipo(
  evaluaciones: Evaluacion[],
): PromedioEquipo[] {
  const mapa = new Map<string, { suma: number; n: number }>()
  for (const e of evaluaciones) {
    if (e.total == null) continue
    const actual = mapa.get(e.equipoId) ?? { suma: 0, n: 0 }
    actual.suma += e.total
    actual.n += 1
    mapa.set(e.equipoId, actual)
  }
  return [...mapa.entries()].map(([equipoId, { suma, n }]) => ({
    equipoId,
    promedio: Math.round((suma / n) * 10) / 10,
    evaluaciones: n,
  }))
}
