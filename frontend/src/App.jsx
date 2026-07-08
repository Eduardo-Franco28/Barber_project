import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { BarbershopLayout } from './components/BarbershopLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Landing } from './pages/Landing.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ShopEntry } from './pages/ShopEntry.jsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tudo do cliente/dono acontece dentro de uma barbearia (/b/:slug). */}
        <Route path="/b/:slug" element={<BarbershopLayout />}>
          <Route index element={<ShopEntry />} />
          <Route
            path="perfil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
