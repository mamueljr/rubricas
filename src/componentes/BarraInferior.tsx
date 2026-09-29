import type { ReactNode } from 'react'

interface Props {
  syncEstado: 'local' | 'sincronizado' | 'pendiente'
  children: ReactNode
}

const textos: Record<Props['syncEstado'], string> = {
  local: 'Guardado en este dispositivo',
  sincronizado: 'Sincronizado',
  pendiente: 'Pendiente de sincronizar (sin conexión)',
}

export function BarraInferior({ syncEstado, children }: Props) {
  const clase =
    syncEstado === 'pendiente'
      ? 'aviso-sync--pendiente'
      : syncEstado === 'sincronizado'
        ? 'aviso-sync--listo'
        : ''
  return (
    <div className="barra-inferior">
      <div className={`aviso-sync ${clase}`}>{textos[syncEstado]}</div>
      <div className="barra-inferior__fila">{children}</div>
    </div>
  )
}
