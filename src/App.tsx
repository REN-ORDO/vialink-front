import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MapaPage from './pages/MapaPage';
import ParaderoPage from './pages/ParaderoPage';
import AsistentePage from './pages/AsistentePage';
import ViajePage from './pages/ViajePage';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/auth/RequireAuth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MapaPage />} />
        <Route path="/paradero/:id" element={<ParaderoPage />} />
        <Route
          path="/asistente"
          element={
            <RequireAuth>
              <AsistentePage />
            </RequireAuth>
          }
        />
        <Route path="/viaje/:id" element={<ViajePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
