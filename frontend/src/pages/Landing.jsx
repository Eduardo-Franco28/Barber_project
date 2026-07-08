import { ThemeToggle } from '../components/ThemeToggle.jsx';

// Raiz do app (/) — a plataforma em si. Clientes e donos entram pelo link da
// barbearia (/b/:slug), então aqui é só uma vitrine institucional simples.
export function Landing() {
  return (
    <div className="auth">
      <div className="auth__top">
        <ThemeToggle />
      </div>
      <div className="auth__box" style={{ textAlign: 'center' }}>
        <div className="brand__name">BRYAN</div>
        <div className="brand__sub">Agendamento para barbearias</div>
        <p className="auth__hint">Acesse pelo link da sua barbearia.</p>
      </div>
    </div>
  );
}
