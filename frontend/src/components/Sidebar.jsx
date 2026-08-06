import { Link } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  Lock,
  Users,
  Tag,
  Wallet
} from 'lucide-react';
import logo from '../assets/images/Logo.svg';

/**
 * Sidebar compartilhada por todas as páginas autenticadas.
 * Recebe activeItem para marcar o item ativo: 'dashboard' | 'senha'
 */
export default function Sidebar({ currentUser, activeItem = 'dashboard' }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="NodeBank" className="logo-icon" />
        <h2>NodeBank</h2>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link
          to="/app/perfil/senha"
          className={`nav-item ${activeItem === 'senha' ? 'active' : ''}`}
        >
          <Lock size={18} />
          Alterar Senha
        </Link>

        <div className="nav-separator">Configurações (Em Breve)</div>
        <span className="nav-item disabled"><Users size={18} /> Membros</span>
        <span className="nav-item disabled"><Tag size={18} /> Categorias</span>
        <span className="nav-item disabled"><Wallet size={18} /> Carteiras</span>
      </nav>

      <div className="sidebar-user">
        <div className="avatar">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">{currentUser?.name}</span>
          <span className="user-email">{currentUser?.email}</span>
        </div>
      </div>
    </aside>
  );
}
