import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Marca } from '../componentes/Marca'
import { BarraSuperior } from '../componentes/BarraSuperior'
import { BarraInferior } from '../componentes/BarraInferior'
import { Pie } from '../componentes/Pie'
import { SelectorNivel } from '../componentes/SelectorNivel'
import { ResumenFinal } from '../componentes/ResumenFinal'
import { obtenerRubrica } from '../rubricas/diseno-apps-moviles/rubrica.config'
import { calcularTotal } from '../rubricas/diseno-apps-moviles/calculo'
import {
  guardarEvaluacion,
  listarEquipos,
  obtenerEvaluacion,
  type DatosEvaluacion,
} from '../lib/api'
import {
  claveBorrador,
  guardarBorrador,
  leerBorrador,
  marcarSincronizado,
  listarPendientes,
} from '../lib/borradorOffline'
import { hayNube } from '../lib/supabase'
import { obtenerEvaluadorId, haySesion } from '../auth/sesion'
import type { Equipo, RespuestasCierre } from '../tipos'

type SyncEstado = 'local' | 'sincronizado' | 'pendiente'

const cierreInicial: RespuestasCierre = {
  comentarioGeneral: '',
  utilizaria: '',
  gusto: '',
  mejorar: '',
}

export function EvaluacionWizard() {
  const { rubricaId = '', equipoId = '' } = useParams()
  const navigate = useNavigate()
  const rubrica = obtenerRubrica(rubricaId)
  const evaluadorId = obtenerEvaluadorId()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [cierre, setCierre] = useState<RespuestasCierre>(cierreInicial)
  const [paso, setPaso] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [enviado, setEnviado] = useState(false)
  const [syncEstado, setSyncEstado] = useState<SyncEstado>(
    hayNube ? 'sincronizado' : 'local',
  )
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cargado = useRef(false)
  const clave = rubrica ? claveBorrador(rubrica.id, equipoId, evaluadorId) : ''

  useEffect(() => {
    if (!rubrica || !haySesion()) return
    let activo = true
    setCargando(true)

    async function cargar() {
      try {
        const equipos = await listarEquipos()
        const encontrado = equipos.find((e) => e.id === equipoId) ?? null
        if (!activo) return
        setEquipo(encontrado)

        const borrador = leerBorrador(clave)
        if (borrador) {
          setRespuestas(borrador.datos.respuestas)
          setComentarios(borrador.datos.comentarios)
          setCierre(borrador.datos.cierre)
          setEnviado(borrador.datos.enviado)
        } else {
          const evaluacion = await obtenerEvaluacion(
            rubrica!.id,
            equipoId,
            evaluadorId,
          )
          if (activo && evaluacion) {
            setRespuestas(evaluacion.respuestas)
            setComentarios(evaluacion.comentarios)
            setCierre(evaluacion.cierre)
            setEnviado(evaluacion.enviado)
          }
        }
        await sincronizarPendientes()
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'Error al cargar.')
      } finally {
        if (activo) {
          setCargando(false)
          cargado.current = true
        }
      }
    }
    void cargar()
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubrica?.id, equipoId, evaluadorId])

  async function sincronizarPendientes() {
    if (!hayNube) return
    for (const pendiente of listarPendientes()) {
      try {
        await guardarEvaluacion(pendiente.datos)
        marcarSincronizado(pendiente.clave)
        setSyncEstado('sincronizado')
      } catch {
        setSyncEstado('pendiente')
      }
    }
  }

  function construirDatos(enviar: boolean): DatosEvaluacion {
    return {
      equipoId,
      evaluadorId,
      rubricaId,
      respuestas,
      comentarios,
      cierre,
      total: calcularTotal(rubrica!, respuestas),
      enviado: enviar,
    }
  }

  useEffect(() => {
    if (!rubrica || !cargado.current || !haySesion()) return
    const datos = construirDatos(enviado)
    guardarBorrador(clave, datos, true)
    if (!hayNube) {
      setSyncEstado('local')
      return
    }
    const temporizador = setTimeout(async () => {
      try {
        await guardarEvaluacion({ ...datos, enviado })
        marcarSincronizado(clave)
        setSyncEstado('sincronizado')
      } catch {
        setSyncEstado('pendiente')
      }
    }, 900)
    return () => clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respuestas, comentarios, cierre, enviado])

  if (!rubrica) return <Navigate to="/" replace />
  if (!haySesion()) return <Navigate to="/" replace />

  const totalPasos = rubrica.criterios.length + 1
  const esCierre = paso === rubrica.criterios.length
  const criterio = rubrica.criterios[paso]
  const progreso = (paso + 1) / totalPasos
  const total = calcularTotal(rubrica, respuestas)

  function responder(valor: number) {
    if (!criterio) return
    setRespuestas((prev) => ({ ...prev, [criterio.id]: valor }))
  }

  function comentarCriterio(texto: string) {
    if (!criterio) return
    setComentarios((prev) => ({ ...prev, [criterio.id]: texto }))
  }

  async function enviar() {
    setError('')
    setEnviando(true)
    const datos = construirDatos(true)
    guardarBorrador(clave, datos, true)
    try {
      await guardarEvaluacion(datos)
      marcarSincronizado(clave)
      setSyncEstado(hayNube ? 'sincronizado' : 'local')
    } catch {
      setSyncEstado('pendiente')
    } finally {
      setEnviando(false)
      setEnviado(true)
    }
  }

  if (cargando) {
    return (
      <main className="app contenido contenido--centrado">
        <p className="nota">Cargando…</p>
      </main>
    )
  }

  if (enviado && total != null) {
    return (
      <>
        <main className="app contenido">
          <Marca />
          <h1>{equipo?.nombre ?? 'Equipo'}</h1>
          <p className="subtitulo">Evaluación registrada.</p>
          <ResumenFinal total={total} puntajeMaximo={rubrica.puntajeMaximo} />
          <div className="acciones">
            <button
              type="button"
              className="boton boton--secundario boton--bloque"
              onClick={() => setEnviado(false)}
            >
              Revisar o modificar respuestas
            </button>
            <Link
              to={`/rubrica/${rubrica.id}`}
              className="boton boton--primario boton--bloque"
            >
              Volver a la lista de equipos
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <BarraSuperior
        titulo={equipo?.nombre ?? 'Equipo'}
        paso={esCierre ? 'Cierre de la evaluación' : `Criterio ${paso + 1} de ${rubrica.criterios.length}`}
        progreso={progreso}
      />
      <main className="app contenido" style={{ paddingTop: 20 }}>
        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        {!esCierre && criterio ? (
          <>
            <div className="fila-encabezado">
              <h2>{criterio.nombre}</h2>
              <span className="peso-chip">
                {Math.round(criterio.peso * 100)}%
              </span>
            </div>
            <p className="subtitulo">
              ¿Cómo valoras este aspecto en la aplicación?
            </p>
            <SelectorNivel
              niveles={rubrica.niveles}
              valor={respuestas[criterio.id] ?? 0}
              descriptores={criterio.descriptores}
              onCambiar={responder}
            />
            {rubrica.comentarioPorCriterio && (
              <div className="campo">
                <label className="campo__etiqueta" htmlFor="comentario">
                  Comentario (opcional)
                </label>
                <textarea
                  id="comentario"
                  placeholder="Observaciones sobre este criterio…"
                  value={comentarios[criterio.id] ?? ''}
                  onChange={(e) => comentarCriterio(e.target.value)}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <h2>Cierre de la evaluación</h2>
            <p className="subtitulo">
              Últimas preguntas sobre la aplicación.
            </p>

            <div className="campo">
              <label className="campo__etiqueta" htmlFor="utilizaria">
                {rubrica.cierre.utilizaria.etiqueta}
              </label>
              <div className="opciones-nivel" role="radiogroup">
                {rubrica.cierre.utilizaria.opciones.map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    role="radio"
                    aria-checked={cierre.utilizaria === opcion}
                    aria-pressed={cierre.utilizaria === opcion}
                    className="opcion-nivel"
                    onClick={() =>
                      setCierre((prev) => ({ ...prev, utilizaria: opcion }))
                    }
                  >
                    <span className="opcion-nivel__marca" aria-hidden="true" />
                    <span className="opcion-nivel__etiqueta">{opcion}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="campo">
              <label className="campo__etiqueta" htmlFor="comentario-general">
                {rubrica.cierre.comentarioGeneral.etiqueta}
              </label>
              <textarea
                id="comentario-general"
                placeholder={rubrica.cierre.comentarioGeneral.placeholder}
                value={cierre.comentarioGeneral}
                onChange={(e) =>
                  setCierre((prev) => ({
                    ...prev,
                    comentarioGeneral: e.target.value,
                  }))
                }
              />
            </div>

            <div className="campo">
              <label className="campo__etiqueta" htmlFor="gusto">
                {rubrica.cierre.gusto.etiqueta}
              </label>
              <textarea
                id="gusto"
                placeholder={rubrica.cierre.gusto.placeholder}
                value={cierre.gusto}
                onChange={(e) =>
                  setCierre((prev) => ({ ...prev, gusto: e.target.value }))
                }
              />
            </div>

            <div className="campo">
              <label className="campo__etiqueta" htmlFor="mejorar">
                {rubrica.cierre.mejorar.etiqueta}
              </label>
              <textarea
                id="mejorar"
                placeholder={rubrica.cierre.mejorar.placeholder}
                value={cierre.mejorar}
                onChange={(e) =>
                  setCierre((prev) => ({ ...prev, mejorar: e.target.value }))
                }
              />
            </div>

            {total != null && (
              <ResumenFinal
                total={total}
                puntajeMaximo={rubrica.puntajeMaximo}
              />
            )}

            <Pie />
          </>
        )}
      </main>

      <BarraInferior syncEstado={syncEstado}>
        <button
          type="button"
          className="boton boton--secundario"
          onClick={() => (paso === 0 ? navigate(`/rubrica/${rubrica.id}`) : setPaso(paso - 1))}
        >
          {paso === 0 ? 'Salir' : 'Atrás'}
        </button>
        {esCierre ? (
          <button
            type="button"
            className="boton boton--primario"
            disabled={enviando || total == null}
            onClick={enviar}
          >
            {enviando ? 'Enviando…' : 'Enviar evaluación'}
          </button>
        ) : (
          <button
            type="button"
            className="boton boton--primario"
            disabled={(respuestas[criterio.id] ?? 0) === 0}
            onClick={() => setPaso(paso + 1)}
          >
            Siguiente
          </button>
        )}
      </BarraInferior>
    </>
  )
}
