import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function PrivateRoute({ children }) {
  // Se não estiver autenticado, redireciona para a tela de login
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderiza a rota protegida
  return children;
}
