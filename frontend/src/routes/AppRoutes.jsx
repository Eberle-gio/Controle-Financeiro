import { Routes, Route } from 'react-router-dom'

import Login from '../pages/Login/Login'
import Register from '../pages/Register/Register'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword'
import ResetPassword from '../pages/ResetPassword/ResetPassword'
import Dashboard from '../pages/Dashboard/Dashboard'
import ChangePassword from '../pages/ChangePassword/ChangePassword'
import PrivateRoute from './PrivateRoute'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/app/perfil/senha" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
    </Routes>
  )
}

export default AppRoutes