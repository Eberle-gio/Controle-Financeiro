import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  Lock
} from 'lucide-react';
import logo from '../assets/images/Logo.svg';
import './Sidebar.css';

const Sidebar = ({ usuarioAtual, currentUser, activeItem = 'dashboard', itemAtivo }) => {
  const usuario = usuarioAtual || currentUser;
  const item = itemAtivo || activeItem;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="NodeBank" className="logo-icon" />
        <h2>NodeBank</h2>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`nav-item ${item === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          to="/transacoes"
          className={`nav-item ${item === 'transacoes' ? 'active' : ''}`}
        >
          <ArrowLeftRight size={18} />
          Transações
        </Link>

        <Link
          to="/carteiras"
          className={`nav-item ${item === 'carteiras' ? 'active' : ''}`}
        >
          <Wallet size={18} />
          Carteiras
        </Link>

        <Link
          to="/categorias"
          className={`nav-item ${item === 'categorias' ? 'active' : ''}`}
        >
          <Tag size={18} />
          Categorias
        </Link>

        <div className="nav-separator">Conta</div>
        <Link
          to="/app/perfil/senha"
          className={`nav-item ${item === 'senha' ? 'active' : ''}`}
        >
          <Lock size={18} />
          Alterar Senha
        </Link>
      </nav>

      <div className="sidebar-user">
        <div className="avatar">
          {usuario?.name ? usuario.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">{usuario?.name || 'Usuário'}</span>
          <span className="user-email">{usuario?.email || ''}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
