import { Navigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const { slug } = useParams();

  if (loading) return <div className="boot">Carregando…</div>;
  if (!user) return <Navigate to={`/b/${slug}`} replace />;
  if (role && user.role !== role) return <Navigate to={`/b/${slug}`} replace />;

  return children;
}
