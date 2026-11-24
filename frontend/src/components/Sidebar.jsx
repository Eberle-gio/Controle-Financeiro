import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  FileText,
  UserRound,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { authService } from '../services/authService';
import logo from '../assets/images/Logo.svg';
import './Sidebar.css';

const Sidebar = ({ usuarioAtual, currentUser, activeItem = 'dashboard', itemAtivo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const usuario = usuarioAtual || currentUser;
  const item = itemAtivo || activeItem;

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAberto) return undefined;
    const fecharComEscape = event => {
      if (event.key === 'Escape') setMenuAberto(false);
    };
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [menuAberto]);

  const lidarLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-menu-toggle ${menuAberto ? 'is-open' : ''}`}
        onClick={() => setMenuAberto(aberto => !aberto)}
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuAberto}
        aria-controls="app-sidebar-navigation"
      >
        {menuAberto ? <X size={21} /> : <Menu size={21} />}
      </button>
      {menuAberto && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
        />
      )}
      <aside className={`app-sidebar ${menuAberto ? 'is-open' : ''}`} id="app-sidebar-navigation">
      <div className="sidebar-brand">
        <img src={logo} alt="NodeBank" className="logo-icon" />
        <h2>NodeBank</h2>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          onClick={() => setMenuAberto(false)}
          className={`nav-item ${item === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          to="/transacoes"
          onClick={() => setMenuAberto(false)}
          className={`nav-item ${item === 'transacoes' ? 'active' : ''}`}
        >
          <ArrowLeftRight size={18} />
          Transações
        </Link>

        <Link
          to="/carteiras"
          onClick={() => setMenuAberto(false)}
          className={`nav-item ${item === 'carteiras' ? 'active' : ''}`}
        >
          <Wallet size={18} />
          Carteiras
        </Link>

        <Link
          to="/categorias"
          onClick={() => setMenuAberto(false)}
          className={`nav-item ${item === 'categorias' ? 'active' : ''}`}
        >
          <Tag size={18} />
          Categorias
        </Link>

        <Link
          to="/relatorios"
          onClick={() => setMenuAberto(false)}
          className={`nav-item ${item === 'relatorios' ? 'active' : ''}`}
        >
          <FileText size={18} />
          Relatórios
        </Link>

        <div className="nav-separator">Conta</div>
        <Link
          to="/app/perfil"
          onClick={() => setMenuAberto(false)}
          className={`nav-item ${item === 'perfil' ? 'active' : ''}`}
        >
          <UserRound size={18} />
          Meu Perfil
        </Link>
      </nav>

      <div className="sidebar-user">
        <Link
          to="/app/perfil"
          onClick={() => setMenuAberto(false)}
          className="sidebar-profile-link"
          aria-label="Abrir meu perfil"
        >
        <div className="avatar">
          {usuario?.name ? usuario.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">{usuario?.name || 'Usuário'}</span>
          <span className="user-email">{usuario?.email || ''}</span>
        </div>
        </Link>
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
    </>
  );
};

export default Sidebar;
