import { useState, useEffect, useCallback } from 'react';
import { walletService } from '../../services/walletService';
import { rememberWallet, restoreWallet } from '../../services/walletSelection';
import { transactionService } from '../../services/transactionService';
import { authService } from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import CategoryIcon from '../../components/CategoryIcon';
import TransactionModal from '../../components/TransactionModal';
import { Plus, RefreshCw, Filter, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import './Transactions.css';

const Transactions = () => {
  const [usuarioAtual, setUsuarioAtual] = useState(() => authService.obterUsuarioAtual());
  const [carteiras, setCarteiras] = useState([]);
  const [carteiraAtiva, setCarteiraAtiva] = useState(null);

  useEffect(() => { rememberWallet(carteiraAtiva); }, [carteiraAtiva]);

  // Filtros e Paginação
  const [transacoes, setTransacoes] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState(null);

  // Busca perfil do usuário
  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const perfil = await authService.obterPerfil();
        setUsuarioAtual(perfil);
      } catch { /* Mantem o perfil da sessao quando a atualizacao falha. */ }
    };
    buscarPerfil();
  }, []);

  // Busca carteiras
  const carregarCarteiras = useCallback(async () => {
    try {
      const lista = await walletService.listarOuCriarCarteiraPadrao();
      setCarteiras(lista);
      if (lista.length > 0) {
        setCarteiraAtiva((atual) => restoreWallet(lista, atual));
      }
    } catch (err) {
      setErro(err.message || 'Falha ao carregar carteiras');
    }
  }, []);

  useEffect(() => {
    carregarCarteiras();
  }, [carregarCarteiras]);

  // Busca transações paginadas
  const carregarTransacoes = useCallback(async () => {
    if (!carteiraAtiva) return;

    setCarregando(true);
    setErro('');
    try {
      const resp = await transactionService.listarTransacoes(carteiraAtiva.id, {
        pagina,
        tamanho: 15,
        ordenacao: 'data,desc',
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        tipo: tipoFiltro || undefined
      });

      setTransacoes(resp.content || []);
      setTotalPaginas(resp.totalPages || 1);
      setTotalElementos(resp.totalElements || 0);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar transações');
    } finally {
      setCarregando(false);
    }
  }, [carteiraAtiva, pagina, tipoFiltro, dataInicio, dataFim]);

  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);

  const abrirNovaTransacao = () => {
    setTransacaoSelecionada(null);
    setModalAberto(true);
  };

  const abrirEditarTransacao = (tx) => {
    setTransacaoSelecionada(tx);
    setModalAberto(true);
  };

  const formatarMoeda = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatarData = (str) => {
    if (!str) return '';
    const [ano, mes, dia] = str.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="transactions-page">
      <Sidebar usuarioAtual={usuarioAtual} itemAtivo="transacoes" />

      <main className="transactions-content">
        <header className="page-header">
          <div className="header-titles">
            <h1>Extrato de Transações</h1>
            <p>Gerencie e visualize todas as movimentações financeiras das suas carteiras.</p>
          </div>
          <button onClick={abrirNovaTransacao} className="btn-primary-action">
            <Plus size={18} /> Nova Transação
          </button>
        </header>

        {erro && <div className="alert-error-box">{erro}</div>}

        {/* Barra de Filtros */}
        <section className="transactions-filters-card">
          <div className="filter-item">
            <label htmlFor="tx-wallet-select">Carteira:</label>
            <select
              id="tx-wallet-select"
              value={carteiraAtiva?.id || ''}
              onChange={(e) => {
                const found = carteiras.find((w) => w.id === Number(e.target.value));
                setCarteiraAtiva(found);
                setPagina(0);
              }}
            >
              {carteiras.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nome} {w.meuPapel ? `(${w.meuPapel})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="tx-type-filter">Tipo:</label>
            <select
              id="tx-type-filter"
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value);
                setPagina(0);
              }}
            >
              <option value="">Todos os tipos</option>
              <option value="RECEITA">Apenas Receitas</option>
              <option value="DESPESA">Apenas Despesas</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="tx-start-date">De:</label>
            <input
              id="tx-start-date"
              type="date"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
                setPagina(0);
              }}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="tx-end-date">Até:</label>
            <input
              id="tx-end-date"
              type="date"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                setPagina(0);
              }}
            />
          </div>

          <button onClick={carregarTransacoes} className="btn-filter-refresh" title="Atualizar">
            <RefreshCw size={16} className={carregando ? 'spin-icon' : ''} /> Filtrar
          </button>
        </section>

        {/* Tabela de Transações */}
        <section className="transactions-table-card">
          <div className="table-header-meta">
            <span className="total-count">
              Total de registros: <strong>{totalElementos}</strong>
            </span>
          </div>

          <div className="table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.length > 0 ? (
                  transacoes.map((t) => (
                    <tr key={t.id} onClick={() => abrirEditarTransacao(t)} className="clickable-row">
                      <td>
                        <div className="desc-cell">
                          <span className="tx-desc-title">{t.descricao}</span>
                          {t.criadoPorNome && (
                            <span className="tx-creator-subtitle">Criado por: {t.criadoPorNome}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="category-cell">
                          <span
                            className="cat-badge"
                            style={{ backgroundColor: t.categoryColor ? `${t.categoryColor}20` : 'rgba(255,255,255,0.08)' }}
                          >
                            <CategoryIcon name={t.categoryIcon} size={15} color={t.categoryColor || '#9ca3af'} />
                            <span>{t.categoryName || 'Sem Categoria'}</span>
                          </span>
                        </div>
                      </td>
                      <td>{formatarData(t.data)}</td>
                      <td>
                        <span className={`type-badge ${t.tipo === 'RECEITA' ? 'badge-income' : 'badge-expense'}`}>
                          {t.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`value-text ${t.tipo === 'RECEITA' ? 'income' : 'expense'}`}>
                          {t.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(t.valor)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-edit-row"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirEditarTransacao(t);
                          }}
                          title="Editar transação"
                        >
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-table-cell">
                      {carregando ? 'Carregando movimentações...' : 'Nenhuma transação encontrada com os filtros selecionados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="pagination-bar">
              <button
                type="button"
                className="btn-page"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0 || carregando}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span className="page-info">
                Página <strong>{pagina + 1}</strong> de <strong>{totalPaginas}</strong>
              </span>
              <button
                type="button"
                className="btn-page"
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1 || carregando}
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modal de Transação */}
      <TransactionModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => {
          carregarCarteiras();
          carregarTransacoes();
        }}
        walletId={carteiraAtiva?.id}
        wallets={carteiras}
        onWalletChange={(w) => setCarteiraAtiva(w)}
        initialData={transacaoSelecionada}
      />
    </div>
  );
};

export default Transactions;
