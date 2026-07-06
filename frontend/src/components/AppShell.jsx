import { Link } from 'react-router-dom';

import { Brand } from './Brand.jsx';
import { Button } from './Button.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function AppShell({ children }) {
  const { logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="topbar__brand-link">
          <Brand compact />
        </Link>
        <nav className="topbar__nav">
          <Link to="/perfil" className="topbar__link" data-testid="nav-perfil">
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
