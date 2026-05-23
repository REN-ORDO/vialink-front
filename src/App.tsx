import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MapaPage from './pages/MapaPage';
import ParaderoPage from './pages/ParaderoPage';
import AsistentePage from './pages/AsistentePage';
import ViajePage from './pages/ViajePage';
import OnboardingPage, { isOnboarded } from './pages/OnboardingPage';

function HomeGate() {
  return isOnboarded() ? <MapaPage /> : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<OnboardingPage />} />
        <Route path="/" element={<HomeGate />} />
        <Route path="/paradero/:id" element={<ParaderoPage />} />
        <Route path="/asistente" element={<AsistentePage />} />
        <Route path="/viaje/:id" element={<ViajePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
