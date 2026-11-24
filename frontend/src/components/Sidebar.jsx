import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  Lock,
  FileText,
  UserRound,
  LogOut
} from 'lucide-react';
import { authService } from '../services/authService';
import logo from '../assets/images/Logo.svg';
import './Sidebar.css';

const Sidebar = ({ usuarioAtual, currentUser, activeItem = 'dashboard', itemAtivo }) => {
  const navigate = useNavigate();
  const usuario = usuarioAtual || currentUser;
  const item = itemAtivo || activeItem;

  const lidarLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate('/login');
    }
  };

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

        <Link
          to="/relatorios"
          className={`nav-item ${item === 'relatorios' ? 'active' : ''}`}
        >
          <FileText size={18} />
          Relatórios
        </Link>

        <div className="nav-separator">Conta</div>
        <Link
          to="/app/perfil"
          className={`nav-item ${item === 'perfil' ? 'active' : ''}`}
        >
          <UserRound size={18} />
          Meu Perfil
        </Link>
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
        <button
          type="button"
          onClick={lidarLogout}
          className="sidebar-logout-btn"
          title="Sair da conta"
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
