import type { Equipo, Evaluacion, Rubrica } from '../tipos'

function escapar(valor: unknown): string {
  const texto = valor == null ? '' : String(valor)
  if (/[",\n;]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`
  return texto
}

export function generarCSV(
  rubrica: Rubrica,
  equipos: Equipo[],
  evaluaciones: Evaluacion[],
): string {
  const nombreEquipo = (id: string) =>
    equipos.find((e) => e.id === id)?.nombre ?? id

  const encabezados = [
    'Equipo',
    'Juez',
    ...rubrica.criterios.map((c) => c.nombre),
    'Total',
    'Enviado',
    rubrica.cierre.comentarioGeneral.etiqueta,
    rubrica.cierre.utilizaria.etiqueta,
    rubrica.cierre.gusto.etiqueta,
    rubrica.cierre.mejorar.etiqueta,
  ]

  const filas = evaluaciones.map((e) => [
    nombreEquipo(e.equipoId),
    e.evaluadorId,
    ...rubrica.criterios.map((c) => e.respuestas[c.id] ?? ''),
    e.total ?? '',
    e.enviado ? 'Sí' : 'No',
    e.cierre.comentarioGeneral,
    e.cierre.utilizaria,
    e.cierre.gusto,
    e.cierre.mejorar,
  ])

  return [encabezados, ...filas]
    .map((fila) => fila.map(escapar).join(','))
    .join('\n')
}

export function descargarCSV(nombreArchivo: string, contenido: string): void {
  const blob = new Blob([`\uFEFF${contenido}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
