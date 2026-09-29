interface Props {
  total: number
  puntajeMaximo: number
}

export function ResumenFinal({ total, puntajeMaximo }: Props) {
  const porcentaje = puntajeMaximo > 0 ? Math.round((total / puntajeMaximo) * 100) : 0
  return (
    <section className="resultado-final" role="status" aria-live="polite">
      <p className="resultado-final__etiqueta">Puntuación final</p>
      <p className="resultado-final__numero">
        {total}
        <span style={{ fontSize: '1.2rem', color: 'var(--texto-suave)' }}>
          /{puntajeMaximo}
        </span>
      </p>
      <p className="resultado-final__mensaje">{porcentaje}% del total</p>
    </section>
  )
}
