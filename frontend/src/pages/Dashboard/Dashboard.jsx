import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { walletService } from '../../services/walletService';
import { rememberWallet, restoreWallet } from '../../services/walletSelection';
import { CreditCard, TrendingUp, TrendingDown, RefreshCw, LogOut, Plus, Edit2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import CategoryIcon from '../../components/CategoryIcon';
import TransactionModal from '../../components/TransactionModal';
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
  const [usuarioAtual, setUsuarioAtual] = useState(() => authService.obterUsuarioAtual());

  // Estados de Dados
  const [carteiras, setCarteiras] = useState([]);
  const [carteiraAtiva, setCarteiraAtiva] = useState(null);

  useEffect(() => { rememberWallet(carteiraAtiva); }, [carteiraAtiva]);
  const [resumo, setResumo] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    byCategory: [],
    byDate: [],
    recentTransactions: []
  });

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Estados do Modal de Transação
  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState(null);

  const abrirNovaTransacao = () => {
    if (!carteiraAtiva && carteiras.length > 0) {
      setCarteiraAtiva(carteiras[0]);
    }
    setTransacaoSelecionada(null);
    setModalTransacaoAberto(true);
  };

  const abrirEditarTransacao = (transacao) => {
    setTransacaoSelecionada(transacao);
    setModalTransacaoAberto(true);
  };

  // Busca perfil atualizado do usuário logado 
  useEffect(() => {
    const buscarPerfilUsuario = async () => {
      try {
        const perfil = await authService.obterPerfil();
        setUsuarioAtual(perfil);
      } catch { /* Mantem o perfil da sessao quando a atualizacao falha. */ }
    };
    buscarPerfilUsuario();
  }, []);

  // Define datas do mês atual 
  useEffect(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
    // Início do mês atual
    setDataInicio(`${ano}-${mes}-01`);
    
    // Fim do mês atual
    const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate();
    setDataFim(`${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`);
  }, []);

  // Busca carteiras do usuário
  const buscarCarteiras = useCallback(async () => {
    try {
      const carteirasUsuario = await walletService.listarOuCriarCarteiraPadrao();

      setCarteiras(carteirasUsuario);
      if (carteirasUsuario.length > 0) {
        setCarteiraAtiva((atual) => restoreWallet(carteirasUsuario, atual));
      } else {
        setCarregando(false);
      }
    } catch (err) {
      setErro(err.message || 'Falha ao carregar carteiras da API');
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarCarteiras();
  }, [buscarCarteiras]);

  // Busca dados de resumo da carteira ativa 
  const buscarResumo = useCallback(async () => {
    if (!carteiraAtiva) return;
    setCarregando(true);
    setErro('');

    try {
      const dados = await walletService.obterResumo(carteiraAtiva.id, dataInicio, dataFim);
      setResumo(dados);
    } catch (err) {
      setErro(err.message || 'Falha ao buscar resumo financeiro');
    } finally {
      setCarregando(false);
    }
  }, [carteiraAtiva, dataInicio, dataFim]);

  useEffect(() => {
    buscarResumo();
  }, [buscarResumo]);

  const lidarLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Formata datas
  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-date">{formatarData(label)}</p>
          <p className="tooltip-income">Receitas: {formatarMoeda(payload[0].value)}</p>
          <p className="tooltip-expense">Despesas: {formatarMoeda(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page">
      <Sidebar usuarioAtual={usuarioAtual} activeItem="dashboard" />

      <main className="dashboard-content">
        <header className="content-header">
          <div className="title-wrapper">
            <h1>Visão Geral</h1>
            <p>Acompanhe o desempenho financeiro das suas carteiras em tempo real.</p>
          </div>
          
          <div className="header-actions">
            <div className="user-welcome">
              <div className="avatar">
                {usuarioAtual?.name ? usuarioAtual.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-name-label">{usuarioAtual?.name || 'Usuário'}</span>
            </div>
            
            <button onClick={lidarLogout} className="logout-btn" title="Sair da Conta">
              <LogOut size={18} /> Sair
            </button>
          </div>
        </header>


        <section className="controls-bar">
          <div className="wallet-selector-wrapper">
            <label htmlFor="wallet-select">Carteira:</label>
            <select
              id="wallet-select"
              value={carteiraAtiva?.id || ''}
              onChange={(e) => {
                const encontrada = carteiras.find(w => w.id === Number(e.target.value));
                setCarteiraAtiva(encontrada);
              }}
              disabled={carteiras.length === 0}
            >
              {carteiras.map((w) => (
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
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">Até:</label>
              <input
                id="end-date"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <button onClick={buscarResumo} className="filter-btn" title="Atualizar Dados">
              <RefreshCw size={16} className={carregando ? 'spin-icon' : ''} /> Filtrar
            </button>

            <button
              type="button"
              onClick={abrirNovaTransacao}
              className="btn-new-transaction"
              title="Adicionar nova transação"
            >
              <Plus size={16} /> Nova Transação
            </button>
          </div>
        </section>

        {erro && (
          <div className="alert alert-danger">
            {erro}
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
            <div className="kpi-value">{formatarMoeda(resumo.balance)}</div>
            <span className="kpi-subtext">Resultado do período</span>
          </div>

          <div className="kpi-card income-card">
            <div className="kpi-header">
              <span>Total de Receitas</span>
              <div className="kpi-icon-wrapper income">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="kpi-value text-success">{formatarMoeda(resumo.totalIncome)}</div>
            <span className="kpi-subtext">Entradas no período</span>
          </div>

          <div className="kpi-card expense-card">
            <div className="kpi-header">
              <span>Total de Despesas</span>
              <div className="kpi-icon-wrapper expense">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="kpi-value text-danger">{formatarMoeda(resumo.totalExpense)}</div>
            <span className="kpi-subtext">Saídas no período</span>
          </div>
        </section>


        <section className="dashboard-details-grid">
          <div className="details-card chart-card">
            <h3>Evolução de Receitas x Despesas</h3>
            <div className="chart-container">
              {resumo.byDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={resumo.byDate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    <XAxis dataKey="date" tickFormatter={formatarData} stroke="#9ca3af" fontSize={12} />
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
            <div className="card-header-row">
              <h3>Lançamentos Recentes</h3>
              <button
                type="button"
                className="btn-quick-add"
                onClick={abrirNovaTransacao}
                title="Adicionar lançamento rápido"
              >
                <Plus size={14} /> Novo
              </button>
            </div>
            <div className="transactions-list">
              {resumo.recentTransactions.length > 0 ? (
                resumo.recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="transaction-item clickable"
                    onClick={() => abrirEditarTransacao(t)}
                    title="Clique para editar ou excluir"
                  >
                    <div className="transaction-info">
                      <span className="category-icon-badge">
                        <CategoryIcon name={t.categoryIcon} size={16} color={t.categoryColor || 'var(--primary)'} />
                      </span>
                      <div className="transaction-desc-wrapper">
                        <span className="transaction-desc">{t.descricao || t.categoryName}</span>
                        <span className="transaction-date">{formatarData(t.data)}</span>
                      </div>
                    </div>
                    <div className="transaction-value-action">
                      <span className={`transaction-value ${t.tipo === 'RECEITA' ? 'income' : 'expense'}`}>
                        {t.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(t.valor)}
                      </span>
                      <Edit2 size={13} className="edit-hint-icon" />
                    </div>
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

      {/* Modal de Transação (Criação / Edição / Exclusão) */}
      <TransactionModal
        isOpen={modalTransacaoAberto}
        onClose={() => setModalTransacaoAberto(false)}
        onSuccess={() => {
          buscarCarteiras();
          buscarResumo();
        }}
        walletId={carteiraAtiva?.id}
        wallets={carteiras}
        onWalletChange={(nova) => setCarteiraAtiva(nova)}
        initialData={transacaoSelecionada}
      />
    </div>
  );
};

export default Dashboard;
