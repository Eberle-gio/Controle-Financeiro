import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { walletService } from '../../services/walletService';
import { CreditCard, TrendingUp, TrendingDown, RefreshCw, LogOut } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import CategoryIcon from '../../components/CategoryIcon';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  // Estado do Usuário Conectado
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  // Estados de Dados
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    byCategory: [],
    byDate: [],
    recentTransactions: []
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Busca perfil atualizado do usuário logado na API do backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await authService.getProfile();
        setCurrentUser(profile);
      } catch (err) {
      }
    };
    fetchUserProfile();
  }, []);

  // Define datas do mês atual 
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Início do mês atual
    setStartDate(`${year}-${month}-01`);
    
    // Fim do mês atual
    const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
    setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
  }, []);

  // Busca carteiras do usuário na API 
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        let userWallets = await walletService.getWallets();
        
        // Se o usuário ainda não tiver nenhuma carteira cadastrada no banco, cria uma padrão automaticamente
        if (userWallets.length === 0) {
          const defaultWallet = await walletService.createWallet('Minha Carteira', 'Carteira Principal');
          userWallets = [defaultWallet];
        }

        setWallets(userWallets);
        if (userWallets.length > 0) {
          setActiveWallet(userWallets[0]);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('Falha ao carregar carteiras da API');
        setLoading(false);
      }
    };
    fetchWallets();
  }, []);

  // Busca dados de resumo da carteira ativa na API 
  const fetchSummary = useCallback(async () => {
    if (!activeWallet) return;
    setLoading(true);
    setError('');

    try {
      const data = await walletService.getSummary(activeWallet.id, startDate, endDate);
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar resumo financeiro');
    } finally {
      setLoading(false);
    }
  }, [activeWallet, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formata datas
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-date">{formatDate(label)}</p>
          <p className="tooltip-income">Receitas: {formatCurrency(payload[0].value)}</p>
          <p className="tooltip-expense">Despesas: {formatCurrency(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page">
      <Sidebar currentUser={currentUser} activeItem="dashboard" />

      <main className="dashboard-content">
        <header className="content-header">
          <div className="title-wrapper">
            <h1>Visão Geral</h1>
            <p>Acompanhe o desempenho financeiro das suas carteiras em tempo real.</p>
          </div>
          
          <div className="header-actions">
            <div className="user-welcome">
              <div className="avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-name-label">{currentUser?.name || 'Usuário'}</span>
            </div>
            
            <button onClick={handleLogout} className="logout-btn" title="Sair da Conta">
              <LogOut size={18} /> Sair
            </button>
          </div>
        </header>


        <section className="controls-bar">
          <div className="wallet-selector-wrapper">
            <label htmlFor="wallet-select">Carteira:</label>
            <select
              id="wallet-select"
              value={activeWallet?.id || ''}
              onChange={(e) => {
                const found = wallets.find(w => w.id === Number(e.target.value));
                setActiveWallet(found);
              }}
              disabled={wallets.length === 0}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nome} {w.meuPapel ? `(${w.meuPapel})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="date-filters">
            <div className="date-input-group">
              <label htmlFor="start-date">De:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">Até:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button onClick={fetchSummary} className="filter-btn" title="Atualizar Dados">
              <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Filtrar
            </button>
          </div>
        </section>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}


        <section className="kpi-grid">
          <div className="kpi-card balance-card">
            <div className="kpi-header">
              <span>Saldo Atual</span>
              <div className="kpi-icon-wrapper balance">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(summary.balance)}</div>
            <span className="kpi-subtext">Resultado do período</span>
          </div>

          <div className="kpi-card income-card">
            <div className="kpi-header">
              <span>Total de Receitas</span>
              <div className="kpi-icon-wrapper income">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="kpi-value text-success">{formatCurrency(summary.totalIncome)}</div>
            <span className="kpi-subtext">Entradas no período</span>
          </div>

          <div className="kpi-card expense-card">
            <div className="kpi-header">
              <span>Total de Despesas</span>
              <div className="kpi-icon-wrapper expense">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="kpi-value text-danger">{formatCurrency(summary.totalExpense)}</div>
            <span className="kpi-subtext">Saídas no período</span>
          </div>
        </section>


        <section className="dashboard-details-grid">
          <div className="details-card chart-card">
            <h3>Evolução de Receitas x Despesas</h3>
            <div className="chart-container">
              {summary.byDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={summary.byDate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `R$${val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorReceitas)" />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesas)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p>Nenhuma transação encontrada no período selecionado.</p>
                </div>
              )}
            </div>
          </div>

          <div className="details-card transactions-card">
            <h3>Lançamentos Recentes</h3>
            <div className="transactions-list">
              {summary.recentTransactions.length > 0 ? (
                summary.recentTransactions.map((t) => (
                  <div key={t.id} className="transaction-item">
                    <div className="transaction-info">
                      <span className="category-icon-badge">
                        <CategoryIcon name={t.categoryIcon} size={16} color={t.categoryColor || 'var(--primary)'} />
                      </span>
                      <div className="transaction-desc-wrapper">
                        <span className="transaction-desc">{t.descricao || t.categoryName}</span>
                        <span className="transaction-date">{formatDate(t.data || t.date)}</span>
                      </div>
                    </div>
                    <span className={`transaction-value ${t.tipo === 'RECEITA' ? 'income' : 'expense'}`}>
                      {t.tipo === 'RECEITA' ? '+' : '-'} {formatCurrency(t.valor)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Nenhuma transação cadastrada.</p>
                </div>
              )}
            </div>
          </div>

        </section>

      </main>
    </div>
  );
};

export default Dashboard;