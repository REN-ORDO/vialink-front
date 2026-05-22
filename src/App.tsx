import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MapaPage from './pages/MapaPage';
import ParaderoPage from './pages/ParaderoPage';
import AsistentePage from './pages/AsistentePage';
import ViajePage from './pages/ViajePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapaPage />} />
        <Route path="/paradero/:id" element={<ParaderoPage />} />
        <Route path="/asistente" element={<AsistentePage />} />
        <Route path="/viaje/:id" element={<ViajePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
