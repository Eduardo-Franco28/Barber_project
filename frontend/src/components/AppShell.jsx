import { Link } from 'react-router-dom';

import { Button } from './Button.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useBarbershop } from '../context/BarbershopContext.jsx';

export function AppShell({ children }) {
  const { logout } = useAuth();
  const { slug, barbershop } = useBarbershop();

  return (
    <>
      <header className="topbar">
        <Link to={`/b/${slug}`} className="topbar__brand-link">
          <span className="topbar__brand">{barbershop?.name ?? 'Barbearia'}</span>
        </Link>
        <nav className="topbar__nav">
          <Link to={`/b/${slug}/perfil`} className="topbar__link" data-testid="nav-perfil">
            Perfil
          </Link>
          <ThemeToggle />
          <Button variant="ghost" data-testid="logout" onClick={logout}>
            Sair
          </Button>
        </nav>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
