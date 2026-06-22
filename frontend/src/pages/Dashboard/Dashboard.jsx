import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockService } from '../../services/mockService';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = mockService.getCurrentUser();

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

  // Estados de Filtros e UI
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define datas do mês atual por padrão
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

  // Busca carteiras do usuário
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const userWallets = await mockService.getWallets();
        setWallets(userWallets);
        if (userWallets.length > 0) {
          setActiveWallet(userWallets[0]);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('Falha ao carregar carteiras');
        setLoading(false);
      }
    };
    fetchWallets();
  }, []);

  // Busca dados de resumo da carteira ativa
  const fetchSummary = useCallback(async () => {
    if (!activeWallet) return;
    setLoading(true);
    setError('');

    try {
      const data = await mockService.getWalletSummary(activeWallet.id, startDate, endDate);
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

  // Trata logout
  const handleLogout = async () => {
    await mockService.logout();
    navigate('/login');
  };

  // Formata valores monetários em BRL
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formata datas
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Customização do Tooltip do Gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-date">{formatDate(label)}</p>
          <p className="tooltip-income">
            Receita: <span>{formatCurrency(payload[0].value)}</span>
          </p>
          {payload[1] && (
            <p className="tooltip-expense">
              Despesa: <span>{formatCurrency(payload[1].value)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page">
      {/* SIDEBAR */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="logo-icon">⚡</span>
          <h2>NodeBank</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            📊 Dashboard
          </Link>
          <Link to="/app/perfil/senha" className="nav-item">
            🔒 Alterar Senha
          </Link>
          <div className="nav-separator">Configurações (Em Breve)</div>
          <span className="nav-item disabled">👥 Membros</span>
          <span className="nav-item disabled">🏷️ Categorias</span>
          <span className="nav-item disabled">💳 Carteiras</span>
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="dashboard-content">
        {/* TOPBAR */}
        <header className="dashboard-header">
          <div className="welcome-section">
            <h1>Olá, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Usuário'}!</h1>
            <p>Veja como estão as suas finanças neste período.</p>
          </div>
          <div className="header-actions">
            {/* Seletor de Carteira */}
            {wallets.length > 1 && (
              <select
                value={activeWallet?.id || ''}
                onChange={(e) => setActiveWallet(wallets.find(w => w.id === Number(e.target.value)))}
                className="wallet-selector"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.nome}</option>
                ))}
              </select>
            )}
            
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Sair
            </button>
          </div>
        </header>

        {/* FILTROS DE DATA */}
        <section className="filters-section">
          <div className="filter-group">
            <label htmlFor="startDate">De:</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">Até:</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="refresh-btn" onClick={fetchSummary} disabled={loading}>
            🔄 Atualizar
          </button>
        </section>

        {/* MENSAGEM DE ERRO */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* INDICADOR DE CARREGAMENTO */}
        {loading ? (
          <div className="dashboard-loading-overlay">
            <span className="spinner"></span>
            <p>Carregando seus dados financeiros...</p>
          </div>
        ) : (
          <>
            {/* CARDS DE INDICADORES */}
            <section className="metrics-grid">
              {/* CARD SALDO */}
              <div className="metric-card balance-card">
                <div className="card-header">
                  <span>Saldo Geral</span>
                  <span className="card-icon">💳</span>
                </div>
                <div className="card-value">{formatCurrency(summary.balance)}</div>
                <p className="card-trend">Diferença de entradas e saídas</p>
              </div>

              {/* CARD RECEITAS */}
              <div className="metric-card income-card">
                <div className="card-header">
                  <span>Receitas</span>
                  <span className="card-icon">📈</span>
                </div>
                <div className="card-value">{formatCurrency(summary.totalIncome)}</div>
                <p className="card-trend text-success">Total acumulado no período</p>
              </div>

              {/* CARD DESPESAS */}
              <div className="metric-card expense-card">
                <div className="card-header">
                  <span>Despesas</span>
                  <span className="card-icon">📉</span>
                </div>
                <div className="card-value">{formatCurrency(summary.totalExpense)}</div>
                <p className="card-trend text-danger">Total gasto no período</p>
              </div>
            </section>

            {/* GRÁFICOS E LANÇAMENTOS */}
            <section className="details-grid">
              {/* GRÁFICO */}
              <div className="details-card chart-card">
                <h3>Fluxo de Caixa Diário</h3>
                <div className="chart-container">
                  {summary.byDate.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={summary.byDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(tick) => tick.split('-')[2]} // Mostra apenas o dia no eixo X
                          stroke="var(--text-muted)"
                          tickLine={false}
                        />
                        <YAxis stroke="var(--text-muted)" tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        <Area
                          type="monotone"
                          name="Receitas"
                          dataKey="receitas"
                          stroke="var(--success)"
                          fillOpacity={1}
                          fill="url(#colorReceita)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          name="Despesas"
                          dataKey="despesas"
                          stroke="var(--danger)"
                          fillOpacity={1}
                          fill="url(#colorDespesa)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">
                      <p>Nenhuma transação encontrada no período selecionado.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LISTA DE LANÇAMENTOS RECENTES */}
              <div className="details-card transactions-card">
                <h3>Lançamentos Recentes</h3>
                <div className="transactions-list">
                  {summary.recentTransactions.length > 0 ? (
                    summary.recentTransactions.map((t) => (
                      <div key={t.id} className="transaction-item">
                        <div className="transaction-info">
                          <span
                            className="category-icon-badge"
                            style={{ backgroundColor: `${t.categoryColor}20`, color: t.categoryColor }}
                          >
                            {t.categoryIcon}
                          </span>
                          <div className="transaction-desc-wrapper">
                            <span className="transaction-desc">{t.descricao || t.categoryName}</span>
                            <span className="transaction-date">{formatDate(t.date)}</span>
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
          </>
        )}
      </main>
    </div>
  );
}