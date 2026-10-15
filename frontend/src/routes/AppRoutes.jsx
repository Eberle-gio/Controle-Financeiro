import { Routes, Route } from 'react-router-dom';

import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ConfirmRegistration from '../pages/ConfirmRegistration/ConfirmRegistration';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import Dashboard from '../pages/Dashboard/Dashboard';
import Transactions from '../pages/Transactions/Transactions';
import Wallets from '../pages/Wallets/Wallets';
import Categories from '../pages/Categories/Categories';
import ChangePassword from '../pages/ChangePassword/ChangePassword';
import PrivateRoute from './PrivateRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/confirmar-cadastro" element={<ConfirmRegistration />} />
      <Route path="/confirmar-cadastro/:token" element={<ConfirmRegistration />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/transacoes" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/carteiras" element={<PrivateRoute><Wallets /></PrivateRoute>} />
      <Route path="/categorias" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/app/perfil/senha" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
    </Routes>
  );
};

export default AppRoutes;
