import { Outlet } from 'react-router-dom';

import { BarbershopProvider, useBarbershop } from '../context/BarbershopContext.jsx';

function LayoutInner() {
  const { loading, error } = useBarbershop();

  if (loading) return <div className="boot">Carregando…</div>;
  if (error) return <div className="boot">Barbearia não encontrada</div>;
  return <Outlet />;
}

// Rota-layout de /b/:slug — carrega a barbearia e disponibiliza no contexto.
export function BarbershopLayout() {
  return (
    <BarbershopProvider>
      <LayoutInner />
    </BarbershopProvider>
  );
}
