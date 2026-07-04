import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { BarberHome } from './pages/BarberHome.jsx';
import { ClientHome } from './pages/ClientHome.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div className="boot">Bryan Barbearia</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'barber' ? '/painel' : '/agendar'} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/agendar"
          element={
            <ProtectedRoute role="client">
              <ClientHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/painel"
          element={
            <ProtectedRoute role="barber">
              <BarberHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
