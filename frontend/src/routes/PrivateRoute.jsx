import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const [sessaoValida, setSessaoValida] = useState(null);

  useEffect(() => {
    let ativa = true;
    authService.validarSessao().then(usuario => {
      if (ativa) setSessaoValida(Boolean(usuario));
    });
    return () => { ativa = false; };
  }, []);

  if (sessaoValida === null) return <div role="status" aria-live="polite">Verificando sessão...</div>;
  if (!sessaoValida) return <Navigate to="/login" replace />;

  return children;
};

export default PrivateRoute;
