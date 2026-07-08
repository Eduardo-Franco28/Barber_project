import { useAuth } from '../context/AuthContext.jsx';
import { BarberHome } from './BarberHome.jsx';
import { BookingPage } from './BookingPage.jsx';
import { LoginPage } from './LoginPage.jsx';

// Entrada de /b/:slug — decide o que mostrar pelo estado de login/papel.
export function ShopEntry() {
  const { user, loading } = useAuth();

  if (loading) return <div className="boot">Carregando…</div>;
  if (!user) return <LoginPage />;
  if (user.role === 'client') return <BookingPage />;
  return <BarberHome />;
}
