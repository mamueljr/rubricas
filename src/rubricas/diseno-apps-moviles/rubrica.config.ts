import type { Rubrica } from '../../tipos'

export const rubricaDisenoAppsMoviles: Rubrica = {
  id: 'diseno-apps-moviles',
  materia: 'Desarrollo de Aplicaciones Móviles',
  proyecto: 'Presentación y evaluación de aplicación móvil Android',
  descripcion:
    'Evaluación centrada en la experiencia de usuario. No se requieren conocimientos de programación.',
  puntajeMaximo: 100,
  niveles: [
    { valor: 4, etiqueta: 'Excelente' },
    { valor: 3, etiqueta: 'Bueno' },
    { valor: 2, etiqueta: 'Regular' },
    { valor: 1, etiqueta: 'Insuficiente' },
  ],
  criterios: [
    {
      id: 'diseno',
      nombre: 'Diseño y apariencia',
      peso: 0.2,
      descriptores: {
        4: 'Diseño atractivo, claro, consistente y agradable visualmente.',
        3: 'Buen diseño, aunque presenta algunos detalles que podrían mejorarse.',
        2: 'Diseño funcional, pero poco atractivo o con elementos inconsistentes.',
        1: 'Diseño confuso, descuidado o difícil de visualizar.',
      },
    },
    {
      id: 'navegacion',
      nombre: 'Facilidad de uso y navegación',
      peso: 0.25,
      descriptores: {
        4: 'La aplicación es muy fácil e intuitiva de utilizar. La navegación resulta natural y el usuario puede entender rápidamente cómo utilizarla.',
        3: 'Es fácil de utilizar, aunque existen algunos puntos que podrían mejorar.',
        2: 'Requiere cierta explicación para utilizarla o presenta algunas dificultades de navegación.',
        1: 'Es difícil de entender o utilizar sin ayuda.',
      },
    },
    {
      id: 'utilidad',
      nombre: 'Utilidad y propuesta de valor',
      peso: 0.25,
      descriptores: {
        4: 'Resuelve claramente una necesidad o problema y ofrece una propuesta interesante para el usuario.',
        3: 'Tiene una utilidad clara, aunque podría aportar mayor valor al usuario.',
        2: 'La utilidad es limitada o la propuesta no está completamente clara.',
        1: 'No se identifica claramente qué problema resuelve o qué utilidad tiene.',
      },
    },
    {
      id: 'funcionamiento',
      nombre: 'Funcionamiento y experiencia',
      peso: 0.15,
      descriptores: {
        4: 'Las funciones principales funcionan correctamente y la experiencia de uso es fluida.',
        3: 'Funciona correctamente en general, aunque presenta pequeños problemas.',
        2: 'Presenta varios problemas, errores o funciones incompletas.',
        1: 'Presenta problemas importantes que dificultan o impiden utilizar adecuadamente la aplicación.',
      },
    },
    {
      id: 'presentacion',
      nombre: 'Presentación y demostración',
      peso: 0.15,
      descriptores: {
        4: 'El equipo comunica claramente su idea, demuestra la aplicación y logra transmitir su valor como producto.',
        3: 'La presentación es clara y demuestra adecuadamente la aplicación.',
        2: 'La explicación es poco clara o la demostración es limitada.',
        1: 'No logra explicar claramente la aplicación ni demostrar adecuadamente su funcionamiento.',
      },
    },
  ],
  comentarioPorCriterio: true,
  cierre: {
    comentarioGeneral: {
      tipo: 'texto',
      etiqueta: 'Comentario general del juez',
      placeholder: 'Observaciones generales sobre la aplicación…',
    },
    utilizaria: {
      tipo: 'opcion',
      etiqueta: '¿Utilizarías esta aplicación?',
      opciones: ['Sí', 'Tal vez', 'No'],
    },
    gusto: {
      tipo: 'texto',
      etiqueta: '¿Qué fue lo que más te gustó?',
      placeholder: 'Lo mejor de la aplicación…',
    },
    mejorar: {
      tipo: 'texto',
      etiqueta: '¿Qué mejorarías?',
      placeholder: 'Áreas de oportunidad…',
    },
  },
}

export const rubricas: Rubrica[] = [rubricaDisenoAppsMoviles]

export function obtenerRubrica(id: string): Rubrica | undefined {
  return rubricas.find((r) => r.id === id)
}
