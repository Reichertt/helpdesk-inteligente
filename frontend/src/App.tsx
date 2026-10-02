import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RotaProtegida } from './components/layout/RotaProtegida';
import { ChamadoDetalhePage } from './pages/ChamadoDetalhePage';
import { ChamadosPage } from './pages/ChamadosPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NaoEncontradoPage } from './pages/NaoEncontradoPage';
import { NovoChamadoPage } from './pages/NovoChamadoPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chamados" element={<ChamadosPage />} />
          <Route path="chamados/novo" element={<NovoChamadoPage />} />
          <Route path="chamados/:id" element={<ChamadoDetalhePage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NaoEncontradoPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
