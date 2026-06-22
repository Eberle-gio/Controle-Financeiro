import { Navigate } from 'react-router-dom';
import { mockService } from '../services/mockService';

export default function PrivateRoute({ children }) {
  // Se não estiver autenticado, redireciona para a tela de login
  if (!mockService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderiza a rota protegida
  return children;
}
