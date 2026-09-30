import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Marca } from '../componentes/Marca'
import { Pie } from '../componentes/Pie'
import { obtenerRubrica } from '../rubricas/diseno-apps-moviles/rubrica.config'
import { listarEquipos, listarMisEvaluaciones } from '../lib/api'
import { obtenerEvaluadorId, obtenerNombre, haySesion } from '../auth/sesion'
import type { Equipo, Evaluacion } from '../tipos'

export function ListaEquipos() {
  const { rubricaId = '' } = useParams()
  const rubrica = obtenerRubrica(rubricaId)
  const evaluadorId = obtenerEvaluadorId()

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!rubrica || !haySesion()) return
    let activo = true
    setCargando(true)
    Promise.all([
      listarEquipos(),
      listarMisEvaluaciones(evaluadorId, rubrica.id),
    ])
      .then(([eq, ev]) => {
        if (!activo) return
        setEquipos(eq)
        setEvaluaciones(ev)
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : 'Error al cargar.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [rubrica, evaluadorId])

  if (!rubrica) return <Navigate to="/" replace />
  if (!haySesion()) return <Navigate to="/" replace />

  const estadoEquipo = (equipoId: string) => {
    const evaluacion = evaluaciones.find((e) => e.equipoId === equipoId)
    if (evaluacion?.enviado) return 'listo'
    if (evaluacion) return 'borrador'
    return 'pendiente'
  }

  const completadas = evaluaciones.filter((e) => e.enviado).length

  return (
    <>
      <main className="app contenido">
        <Link to="/" className="boton boton--fantasma" style={{ marginBottom: 12 }}>
          ← Inicio
        </Link>
        <Marca />
        <h1>{rubrica.materia}</h1>
        <p className="subtitulo">
          {rubrica.proyecto}. Evaluador: <strong>{obtenerNombre()}</strong>·
          enviadas {completadas}/{equipos.length}.
        </p>

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        {cargando ? (
          <p className="nota">Cargando equipos…</p>
        ) : equipos.length === 0 ? (
          <p className="nota">
            Aún no hay equipos. Agrégalos desde el panel de administración.
          </p>
        ) : (
          <div className="lista">
            {equipos.map((equipo) => {
              const estado = estadoEquipo(equipo.id)
              const insignia =
                estado === 'listo'
                  ? 'insignia insignia--listo'
                  : estado === 'borrador'
                    ? 'insignia insignia--pendiente'
                    : 'insignia'
              const texto =
                estado === 'listo'
                  ? 'Evaluado'
                  : estado === 'borrador'
                    ? 'Borrador'
                    : 'Pendiente'
              return (
                <Link
                  key={equipo.id}
                  to={`/rubrica/${rubrica.id}/equipo/${equipo.id}`}
                  className="item-enlace"
                >
                  <span>
                    <span className="item-enlace__titulo">{equipo.nombre}</span>
                    {equipo.integrantes.length > 0 && (
                      <span className="item-enlace__meta">
                        {equipo.integrantes.join(', ')}
                      </span>
                    )}
                  </span>
                  <span className={insignia}>{texto}</span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Pie />
    </>
  )
}
