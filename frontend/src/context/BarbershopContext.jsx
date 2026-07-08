import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import * as barbershopApi from '../api/barbershop.js';

const BarbershopContext = createContext(null);

// Carrega a barbearia do :slug da URL (a "loja" atual). Tudo do cliente
// acontece dentro de uma barbearia.
export function BarbershopProvider({ children }) {
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    barbershopApi
      .getBarbershop(slug)
      .then((data) => {
        if (alive) setBarbershop(data.barbershop);
      })
      .catch(() => {
        if (alive) setError('Barbearia não encontrada.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <BarbershopContext.Provider value={{ slug, barbershop, loading, error }}>
      {children}
    </BarbershopContext.Provider>
  );
}

export function useBarbershop() {
  return useContext(BarbershopContext);
}
