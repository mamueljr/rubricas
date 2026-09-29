import { supabase, hayNube } from '../lib/supabase'
import { guardarEvaluadorLocal, nuevoId } from '../lib/almacen'
import type { Evaluador } from '../tipos'

const NOMBRE_KEY = 'rubricas.nombre'
const EVALUADOR_KEY = 'rubricas.evaluadorId'

export function obtenerNombre(): string {
  return localStorage.getItem(NOMBRE_KEY) ?? ''
}

export function obtenerEvaluadorId(): string {
  return localStorage.getItem(EVALUADOR_KEY) ?? ''
}

export function haySesion(): boolean {
  return obtenerNombre().trim().length > 0
}

export function cerrarSesion(): void {
  localStorage.removeItem(NOMBRE_KEY)
  if (hayNube && supabase) {
    void supabase.auth.signOut()
  }
}

async function firmarAnonimamente(): Promise<string | null> {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) return session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) return null
  return data.user?.id ?? null
}

async function sincronizarEvaluador(nombre: string): Promise<Evaluador> {
  const existenteId = obtenerEvaluadorId()

  if (!hayNube || !supabase) {
    const evaluador: Evaluador = {
      id: existenteId || nuevoId(),
      user_id: null,
      nombre,
      rol: 'profesor',
    }
    guardarEvaluadorLocal(evaluador)
    return evaluador
  }

  const userId = await firmarAnonimamente()
  if (!userId) {
    throw new Error('No se pudo iniciar sesión anónima en Supabase.')
  }

  const { data, error } = await supabase
    .from('evaluadores')
    .upsert(
      { user_id: userId, nombre, rol: 'profesor' },
      { onConflict: 'user_id' },
    )
    .select('id, user_id, nombre, rol')
    .single()

  if (error) throw error
  const evaluador: Evaluador = {
    id: data.id,
    user_id: data.user_id,
    nombre: data.nombre,
    rol: data.rol,
  }
  guardarEvaluadorLocal(evaluador)
  return evaluador
}

export async function iniciarSesion(nombre: string): Promise<Evaluador> {
  const limpio = nombre.trim()
  if (!limpio) throw new Error('Escribe tu nombre para continuar.')
  const evaluador = await sincronizarEvaluador(limpio)
  localStorage.setItem(NOMBRE_KEY, limpio)
  localStorage.setItem(EVALUADOR_KEY, evaluador.id)
  return evaluador
}
