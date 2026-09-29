import type { ReactNode } from 'react'

interface Props {
  titulo: string
  paso: string
  progreso: number
  children?: ReactNode
}

export function BarraSuperior({ titulo, paso, progreso }: Props) {
  const porcentaje = Math.round(Math.min(Math.max(progreso, 0), 1) * 100)
  return (
    <header className="barra-superior">
      <div className="barra-superior__fila">
        <div className="barra-superior__texto">
          <div className="barra-superior__titulo">{titulo}</div>
          <div className="barra-superior__paso">{paso}</div>
        </div>
        <strong style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
          {porcentaje}%
        </strong>
      </div>
      <div
        className="progreso-pista"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
      >
        <div className="progreso-relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </header>
  )
}
