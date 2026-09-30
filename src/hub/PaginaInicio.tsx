import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Marca } from '../componentes/Marca'
import { Pie } from '../componentes/Pie'
import { rubricas } from '../rubricas/diseno-apps-moviles/rubrica.config'
import { haySesion, iniciarSesion, obtenerNombre, cerrarSesion } from '../auth/sesion'
import { hayNube } from '../lib/supabase'

export function PaginaInicio() {
  const [nombre, setNombre] = useState(obtenerNombre())
  const [sesionActiva, setSesionActiva] = useState(haySesion())
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setError('')
    setCargando(true)
    try {
      await iniciarSesion(nombre)
      setSesionActiva(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  function cambiarNombre() {
    cerrarSesion()
    setSesionActiva(false)
    setNombre('')
  }

  if (!sesionActiva) {
    return (
      <>
        <main className="app contenido contenido--centrado">
          <div className="tarjeta" style={{ width: '100%', maxWidth: 420 }}>
            <Marca />
            <h1>Rúbricas de evaluación</h1>
            <p className="subtitulo">
              Escribe tu nombre para comenzar. No necesitas cuenta ni contraseña.
            </p>
            <form onSubmit={entrar}>
              <div className="campo">
                <label className="campo__etiqueta" htmlFor="nombre">
                  Tu nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  placeholder="Ej. Prof. Emmanuel Rojas"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
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
                  disabled={cargando || nombre.trim().length === 0}
                >
                  {cargando ? 'Entrando…' : 'Comenzar'}
                </button>
              </div>
            </form>
            <p className="nota">
              {hayNube
                ? 'Tus evaluaciones quedan guardadas y solo tú puedes verlas.'
                : 'Modo local: los datos se guardan en este dispositivo hasta conectar Supabase.'}
            </p>
          </div>
        </main>
        <Pie />
      </>
    )
  }

  return (
    <>
      <main className="app contenido">
        <Marca />
        <h1>Hola, {obtenerNombre()}</h1>
        <p className="subtitulo">Elige una rúbrica para evaluar.</p>

        <div className="lista">
          {rubricas.map((rubrica) => (
            <Link
              key={rubrica.id}
              to={`/rubrica/${rubrica.id}`}
              className="item-enlace"
            >
              <span>
                <span className="item-enlace__titulo">{rubrica.materia}</span>
                <span className="item-enlace__meta">{rubrica.proyecto}</span>
              </span>
              <span className="insignia">Abrir</span>
            </Link>
          ))}
        </div>

        <div className="acciones">
          <Link to="/admin" className="boton boton--secundario boton--bloque">
            Panel de administración
          </Link>
          <button
            type="button"
            className="boton boton--fantasma boton--bloque"
            onClick={cambiarNombre}
          >
            Cambiar de evaluador
          </button>
        </div>
      </main>
      <Pie />
    </>
  )
}
