import type { Rubrica } from '../../tipos'

const pesoTotal = (rubrica: Rubrica) =>
  rubrica.criterios.reduce((acc, c) => acc + c.peso, 0)

export function normalizarNivel(nivel: number, niveles: number): number {
  if (niveles <= 1) return 1
  return (nivel - 1) / (niveles - 1)
}

export function calcularTotal(
  rubrica: Rubrica,
  respuestas: Record<string, number>,
): number | null {
  const completo = rubrica.criterios.every((c) => {
    const valor = respuestas[c.id]
    return typeof valor === 'number' && valor > 0
  })
  if (!completo) return null

  const maxNivel = Math.max(...rubrica.niveles.map((n) => n.valor))
  const sumaPesos = pesoTotal(rubrica)
  const suma = rubrica.criterios.reduce((acc, c) => {
    const normalizado = normalizarNivel(respuestas[c.id], maxNivel)
    return acc + (c.peso / sumaPesos) * normalizado
  }, 0)

  return Math.round(suma * rubrica.puntajeMaximo)
}

export function criteriosRespondidos(
  rubrica: Rubrica,
  respuestas: Record<string, number>,
): number {
  return rubrica.criterios.filter((c) => respuestas[c.id] > 0).length
}

export function estaCompleta(
  rubrica: Rubrica,
  respuestas: Record<string, number>,
): boolean {
  return criteriosRespondidos(rubrica, respuestas) === rubrica.criterios.length
}
