import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Marca } from '../componentes/Marca'
import { Pie } from '../componentes/Pie'
import { rubricaDisenoAppsMoviles as rubrica } from '../rubricas/diseno-apps-moviles/rubrica.config'
import {
  esAdmin,
  guardarEquipo,
  eliminarEquipo,
  eliminarEvaluacion,
  borrarTodasEvaluaciones,
  borrarTodo,
  listarEquipos,
  listarTodasEvaluaciones,
  listarEvaluadores,
  promediosPorEquipo,
} from '../lib/api'
import { generarCSV, descargarCSV, copiarAlPortapapeles } from '../lib/exportar'
import type { Equipo, Evaluacion, Evaluador } from '../tipos'

const CLAVE_SESION_KEY = 'rubricas.adminClave'

interface FilaEquipo {
  id: string
  nombre: string
  integrantes: string
}

export function Admin() {
  const [clave, setClave] = useState(sessionStorage.getItem(CLAVE_SESION_KEY) ?? '')
  const [autenticado, setAutenticado] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [filas, setFilas] = useState<FilaEquipo[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const guardada = sessionStorage.getItem(CLAVE_SESION_KEY)
    if (guardada) {
      void entrarCon(guardada, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function entrarCon(valor: string, silencioso = false) {
    setError('')
    setCargando(true)
    try {
      const ok = await esAdmin(valor)
      if (!ok) {
        setAutenticado(false)
        if (!silencioso) setError('Clave incorrecta.')
        sessionStorage.removeItem(CLAVE_SESION_KEY)
        return
      }
      sessionStorage.setItem(CLAVE_SESION_KEY, valor)
      setAutenticado(true)
      await recargar(valor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo verificar la clave.')
    } finally {
      setCargando(false)
    }
  }

  async function recargar(valor: string) {
    const [eq, ev, evs] = await Promise.all([
      listarEquipos(),
      listarTodasEvaluaciones(valor, rubrica.id),
      listarEvaluadores(valor),
    ])
    setEquipos(eq)
    setFilas(
      eq.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        integrantes: e.integrantes.join(', '),
      })),
    )
    setEvaluaciones(ev)
    setEvaluadores(evs)
  }

  function nombreEvaluador(id: string): string {
    return evaluadores.find((e) => e.id === id)?.nombre ?? id.slice(0, 8)
  }

  function actualizarFila(id: string, campo: keyof FilaEquipo, valor: string) {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)),
    )
  }

  async function guardarFila(fila: FilaEquipo) {
    setAviso('')
    try {
      const orden = equipos.findIndex((e) => e.id === fila.id) + 1
      await guardarEquipo(clave, {
        id: fila.id,
        nombre: fila.nombre.trim() || 'Equipo',
        integrantes: fila.integrantes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        orden: orden || equipos.length + 1,
      })
      setAviso('Equipo guardado.')
      await recargar(clave)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  async function agregarEquipo() {
    setAviso('')
    try {
      await guardarEquipo(clave, {
        id: '',
        nombre: `Equipo ${equipos.length + 1}`,
        integrantes: [],
        orden: equipos.length + 1,
      })
      await recargar(clave)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar.')
    }
  }

  async function borrarEquipo(id: string) {
    if (!window.confirm('¿Eliminar este equipo y sus evaluaciones?')) return
    try {
      await eliminarEquipo(clave, id)
      await recargar(clave)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.')
    }
  }

  function exportar() {
    const csv = generarCSV(rubrica, equipos, evaluaciones)
    descargarCSV('evaluaciones-diseno-apps-moviles.csv', csv)
  }

  async function copiar() {
    const csv = generarCSV(rubrica, equipos, evaluaciones)
    const ok = await copiarAlPortapapeles(csv)
    setAviso(ok ? 'CSV copiado al portapapeles.' : 'No se pudo copiar.')
  }

  async function borrarEvaluacion(id: string) {
    if (!window.confirm('¿Borrar esta evaluación? Esta acción no se puede deshacer.'))
      return
    setError('')
    setAviso('')
    try {
      await eliminarEvaluacion(clave, id)
      await recargar(clave)
      setAviso('Evaluación borrada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.')
    }
  }

  async function borrarEvaluaciones() {
    if (
      !window.confirm(
        '¿Borrar TODAS las evaluaciones? Se conservan equipos y jueces. Esta acción no se puede deshacer.',
      )
    )
      return
    setError('')
    setAviso('')
    try {
      await borrarTodasEvaluaciones(clave)
      await recargar(clave)
      setAviso('Todas las evaluaciones fueron borradas.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.')
    }
  }

  async function borrarTodoAdmin() {
    if (
      !window.confirm(
        '¿Borrar TODO? Se eliminarán los jueces, todas las calificaciones y los equipos. Esta acción no se puede deshacer.',
      )
    )
      return
    setError('')
    setAviso('')
    try {
      await borrarTodo(clave)
      await recargar(clave)
      setAviso('Se borró todo: jueces, calificaciones y equipos.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.')
    }
  }

  if (!autenticado) {
    return (
      <>
        <main className="app contenido contenido--centrado">
          <div className="tarjeta" style={{ width: '100%', maxWidth: 420 }}>
          <Marca />
          <h1>Administración</h1>
          <p className="subtitulo">
            Ingresa la clave de administrador para gestionar equipos y ver
            resultados.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void entrarCon(clave)
            }}
          >
            <div className="campo">
              <label className="campo__etiqueta" htmlFor="clave">
                Clave
              </label>
              <input
                id="clave"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>
            {error && (
              <p className="mensaje-error" role="alert">
                {error}
              </p>
            )}
            <div className="acciones">
              <button
                type="submit"
                className="boton boton--primario boton--bloque"
                disabled={cargando || clave.length === 0}
              >
                {cargando ? 'Verificando…' : 'Entrar'}
              </button>
              <Link to="/" className="boton boton--fantasma boton--bloque">
                Volver al inicio
              </Link>
            </div>
          </form>
        </div>
        </main>
        <Pie />
      </>
    )
  }

  const promedios = promediosPorEquipo(evaluaciones)

  return (
    <>
      <main className="app contenido" style={{ maxWidth: 900 }}>
        <Link to="/" className="boton boton--fantasma" style={{ marginBottom: 12 }}>
          ← Inicio
        </Link>
        <Marca />
        <h1>Panel de administración</h1>
        <p className="subtitulo">{rubrica.materia}</p>

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}
        {aviso && <p className="nota">{aviso}</p>}

        <h2 style={{ marginTop: 24 }}>Equipos</h2>
        <div className="acciones" style={{ maxWidth: 240 }}>
          <button
            type="button"
            className="boton boton--secundario boton--bloque"
            onClick={agregarEquipo}
          >
            + Agregar equipo
          </button>
        </div>

        <div className="lista">
          {filas.map((fila) => (
            <div key={fila.id} className="tarjeta">
              <div className="campo" style={{ marginTop: 0 }}>
                <label className="campo__etiqueta">Nombre</label>
                <input
                  type="text"
                  value={fila.nombre}
                  onChange={(e) =>
                    actualizarFila(fila.id, 'nombre', e.target.value)
                  }
                />
              </div>
              <div className="campo">
                <label className="campo__etiqueta">
                  Integrantes (separados por coma)
                </label>
                <input
                  type="text"
                  value={fila.integrantes}
                  onChange={(e) =>
                    actualizarFila(fila.id, 'integrantes', e.target.value)
                  }
                />
              </div>
              <div className="acciones" style={{ gridAutoFlow: 'column' }}>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => guardarFila(fila)}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="boton boton--peligro"
                  onClick={() => borrarEquipo(fila.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="separador" />

        <h2>Resultados</h2>
        <p className="nota">
          {evaluaciones.length} evaluaciones registradas ·{' '}
          {evaluaciones.filter((e) => e.enviado).length} enviadas.
        </p>

        <div className="acciones" style={{ gridAutoFlow: 'column', maxWidth: 620 }}>
          <button
            type="button"
            className="boton boton--primario"
            onClick={exportar}
          >
            Descargar CSV
          </button>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={copiar}
          >
            Copiar CSV
          </button>
          <button
            type="button"
            className="boton boton--peligro"
            onClick={borrarEvaluaciones}
            disabled={evaluaciones.length === 0}
          >
            Borrar evaluaciones
          </button>
        </div>

        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Juez</th>
                <th>Total</th>
                <th>Enviado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((e) => (
                <tr key={e.id}>
                  <td>
                    {equipos.find((eq) => eq.id === e.equipoId)?.nombre ??
                      e.equipoId}
                  </td>
                  <td>{nombreEvaluador(e.evaluadorId)}</td>
                  <td>{e.total ?? '—'}</td>
                  <td>{e.enviado ? 'Sí' : 'No'}</td>
                  <td>
                    <button
                      type="button"
                      className="boton boton--peligro boton--mini"
                      onClick={() => borrarEvaluacion(e.id)}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {evaluaciones.length === 0 && (
                <tr>
                  <td colSpan={5}>Sin evaluaciones todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 style={{ marginTop: 24 }}>Promedios por equipo</h2>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Promedio</th>
                <th>N.º evaluaciones</th>
                <th>Evaluadores</th>
              </tr>
            </thead>
            <tbody>
              {promedios.map((p) => (
                <tr key={p.equipoId}>
                  <td>
                    {equipos.find((eq) => eq.id === p.equipoId)?.nombre ??
                      p.equipoId}
                  </td>
                  <td>{p.promedio}</td>
                  <td>{p.evaluaciones}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    {p.evaluadores.length === 0
                      ? '—'
                      : p.evaluadores.map((id) => (
                          <div key={id}>{nombreEvaluador(id)}</div>
                        ))}
                  </td>
                </tr>
              ))}
              {promedios.length === 0 && (
                <tr>
                  <td colSpan={4}>Sin evaluaciones enviadas todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="zona-peligro">
          <h2 className="zona-peligro__titulo">Zona de peligro</h2>
          <p className="nota">
            Borra <strong>jueces, calificaciones y equipos</strong>. No se puede
            deshacer.
          </p>
          <button
            type="button"
            className="boton boton--peligro boton--bloque"
            onClick={borrarTodoAdmin}
          >
            Borrar todo
          </button>
        </section>
      </main>
      <Pie />
    </>
  )
}
