import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PaginaInicio } from './hub/PaginaInicio'
import { ListaEquipos } from './pages/ListaEquipos'
import { EvaluacionWizard } from './pages/EvaluacionWizard'
import { Admin } from './pages/Admin'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PaginaInicio />} />
        <Route path="/rubrica/:rubricaId" element={<ListaEquipos />} />
        <Route
          path="/rubrica/:rubricaId/equipo/:equipoId"
          element={<EvaluacionWizard />}
        />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
