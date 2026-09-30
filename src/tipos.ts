export interface Nivel {
  valor: number
  etiqueta: string
}

export interface Criterio {
  id: string
  nombre: string
  peso: number
  descriptores: Record<number, string>
}

export interface CampoTexto {
  tipo: 'texto'
  etiqueta: string
  placeholder?: string
}

export interface CampoOpcion {
  tipo: 'opcion'
  etiqueta: string
  opciones: string[]
}

export interface Cierre {
  comentarioGeneral: CampoTexto
  utilizaria: CampoOpcion
  gusto: CampoTexto
  mejorar: CampoTexto
}

export interface Rubrica {
  id: string
  materia: string
  proyecto: string
  descripcion: string
  puntajeMaximo: number
  niveles: Nivel[]
  criterios: Criterio[]
  comentarioPorCriterio: boolean
  cierre: Cierre
}

export interface Equipo {
  id: string
  nombre: string
  integrantes: string[]
  orden: number
}

export interface RespuestasCierre {
  comentarioGeneral: string
  utilizaria: string
  gusto: string
  mejorar: string
}

export interface Evaluacion {
  id: string
  equipoId: string
  evaluadorId: string
  rubricaId: string
  respuestas: Record<string, number>
  comentarios: Record<string, string>
  cierre: RespuestasCierre
  total: number | null
  enviado: boolean
  actualizado: string
}

export interface Evaluador {
  id: string
  user_id: string | null
  nombre: string
  rol: 'profesor' | 'admin'
}

export interface PromedioEquipo {
  equipoId: string
  promedio: number
  evaluaciones: number
  evaluadores: string[]
}
