import type { Nivel } from '../tipos'

interface Props {
  niveles: Nivel[]
  valor: number
  descriptores: Record<number, string>
  onCambiar: (valor: number) => void
}

export function SelectorNivel({
  niveles,
  valor,
  descriptores,
  onCambiar,
}: Props) {
  return (
    <>
      <div className="opciones-nivel" role="radiogroup" aria-label="Nivel">
        {niveles.map((nivel) => {
          const activo = valor === nivel.valor
          return (
            <button
              key={nivel.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-pressed={activo}
              className="opcion-nivel"
              onClick={() => onCambiar(nivel.valor)}
            >
              <span className="opcion-nivel__marca" aria-hidden="true" />
              <span className="opcion-nivel__etiqueta">{nivel.etiqueta}</span>
            </button>
          )
        })}
      </div>
      {valor > 0 && descriptores[valor] ? (
        <p className="descriptor">{descriptores[valor]}</p>
      ) : (
        <p className="nota">Selecciona un nivel para ver su descripción.</p>
      )}
    </>
  )
}
