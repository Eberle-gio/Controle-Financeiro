import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Sparkles, TrendingDown, TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { authService } from '../../services/authService';
import { financeInsightsService } from '../../services/financeInsightsService';
import { walletService } from '../../services/walletService';
import { rememberWallet, restoreWallet } from '../../services/walletSelection';
import { subscribeToWallet } from '../../services/walletRealtime';
import './Reports.css';

const periodoDoMes = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate();
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}` };
};

const escaparCsv = (valor) => {
  let texto = String(valor ?? '');
  if (/^[=+@\-\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replaceAll('"', '""')}"`;
};

const Reports = () => {
  const [usuarioAtual, setUsuarioAtual] = useState(() => authService.obterUsuarioAtual());
  const [carteiras, setCarteiras] = useState([]);
  const [carteiraAtiva, setCarteiraAtiva] = useState(null);
  const [periodo, setPeriodo] = useState(periodoDoMes);
  const [resumo, setResumo] = useState(null);
  const [carregandoCarteiras, setCarregandoCarteiras] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [gerandoInsight, setGerandoInsight] = useState(false);
  const [insight, setInsight] = useState([]);
  const [erroInsight, setErroInsight] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => { rememberWallet(carteiraAtiva); }, [carteiraAtiva]);

  useEffect(() => {
    authService.obterPerfil().then(setUsuarioAtual).catch(() => {});
    walletService.listarOuCriarCarteiraPadrao()
      .then(lista => {
        setCarteiras(lista);
        setCarteiraAtiva(atual => restoreWallet(lista, atual));
      })
      .catch(err => setErro(err.message || 'Falha ao carregar carteiras.'))
      .finally(() => setCarregandoCarteiras(false));
  }, []);

  const buscarRelatorio = useCallback(async () => {
    if (!carteiraAtiva) return;
    if (periodo.inicio && periodo.fim && periodo.inicio > periodo.fim) {
      setErro('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const dados = await walletService.obterResumo(carteiraAtiva.id, periodo.inicio, periodo.fim);
      setResumo(dados);
    } catch (err) {
      setErro(err.message || 'Falha ao gerar o relatório.');
    } finally {
      setCarregando(false);
    }
  }, [carteiraAtiva, periodo]);

  useEffect(() => {
    buscarRelatorio();
    if (!carteiraAtiva) return undefined;
    return subscribeToWallet(carteiraAtiva.id, buscarRelatorio);
  }, [buscarRelatorio, carteiraAtiva]);

  const categorias = useMemo(() => (resumo?.byCategory || []).slice().sort((a, b) =>
    (Number(b.totalIncome || 0) + Number(b.totalExpense || 0))
    - (Number(a.totalIncome || 0) + Number(a.totalExpense || 0))), [resumo]);

  const formatarMoeda = valor => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(Number(valor) || 0);

  const gerarInsight = async () => {
    if (!carteiraAtiva || !resumo) return;
    setGerandoInsight(true);
    setErroInsight('');
    setInsight([]);
    try {
      const resultado = await financeInsightsService.gerar(carteiraAtiva.id, periodo.inicio, periodo.fim);
      setInsight(resultado.insights || []);
    } catch (err) {
      setErroInsight(err.message || 'Não foi possível gerar a análise financeira agora.');
    } finally {
      setGerandoInsight(false);
    }
  };

  const exportarPdf = () => {
    if (!resumo || !carteiraAtiva) return;
    const tituloOriginal = document.title;
    document.title = `nodebank-relatorio-${periodo.inicio}-${periodo.fim}`;
    window.addEventListener('afterprint', () => { document.title = tituloOriginal; }, { once: true });
    window.print();
  };

  return (
    <div className="reports-page">
      <Sidebar usuarioAtual={usuarioAtual} itemAtivo="relatorios" />
      <main className="reports-content">
        <header className="reports-header">
          <div>
            <h1>Relatórios</h1>
            <p>Resumo financeiro por carteira e período, com detalhamento por categoria.</p>
          </div>
          <button className="report-export-button" type="button" onClick={exportarPdf} disabled={!resumo || carregando}>
            <Download size={17} /> Salvar como PDF
          </button>
        </header>

        <section className="report-filters" aria-label="Filtros do relatório">
          <label>
            Carteira
            <select value={carteiraAtiva?.id || ''} disabled={carregandoCarteiras || !carteiras.length}
              onChange={event => setCarteiraAtiva(carteiras.find(item => item.id === Number(event.target.value)) || null)}>
              {carteiras.map(carteira => <option key={carteira.id} value={carteira.id}>{carteira.nome}</option>)}
            </select>
          </label>
          <label>
            De
            <input type="date" value={periodo.inicio} onChange={event => setPeriodo(atual => ({ ...atual, inicio: event.target.value }))} />
          </label>
          <label>
            Até
            <input type="date" value={periodo.fim} onChange={event => setPeriodo(atual => ({ ...atual, fim: event.target.value }))} />
          </label>
          <button type="button" className="report-filter-button" onClick={buscarRelatorio} disabled={!carteiraAtiva || carregando}>
            <RefreshCw size={16} className={carregando ? 'report-spin' : ''} /> Atualizar
          </button>
        </section>

        {erro && <div className="report-error" role="alert">{erro}</div>}
        {carregandoCarteiras && <div className="report-empty">Carregando carteiras...</div>}
        {!carregandoCarteiras && !carteiras.length && <div className="report-empty">Nenhuma carteira disponível para gerar relatório.</div>}

        {resumo && (
          <>
            <section className="report-summary-grid" aria-label="Resumo do período">
              <article className="report-summary-card">
                <span><TrendingUp size={18} /> Receitas</span>
                <strong className="report-income">{formatarMoeda(resumo.totalIncome)}</strong>
              </article>
              <article className="report-summary-card">
                <span><TrendingDown size={18} /> Despesas</span>
                <strong className="report-expense">{formatarMoeda(resumo.totalExpense)}</strong>
              </article>
              <article className="report-summary-card">
                <span><WalletIcon size={18} /> Saldo do período</span>
                <strong>{formatarMoeda(resumo.balance)}</strong>
              </article>
              <article className="report-summary-card">
                <span><FileText size={18} /> Lançamentos</span>
                <strong>{resumo.transactionCount || 0}</strong>
              </article>
            </section>

            <section className="report-ai-card" aria-labelledby="report-ai-title">
              <div className="report-ai-heading">
                <div>
                  <h2 id="report-ai-title"><Sparkles size={19} /> Análise financeira com IA</h2>
                  <p>Insights sobre os totais e categorias deste período.</p>
                </div>
                <button type="button" onClick={gerarInsight} disabled={gerandoInsight || carregando}>
                  <Sparkles size={16} /> {gerandoInsight ? 'Analisando...' : insight.length ? 'Atualizar análise' : 'Gerar análise'}
                </button>
              </div>
              <p className="report-ai-privacy">A análise envia à Gemini apenas os totais e nomes das categorias, sem descrições de lançamentos.</p>
              {erroInsight && <p className="report-ai-error" role="alert">{erroInsight}</p>}
              {insight.length > 0 && <div className="report-ai-insights">
                {insight.map((item, index) => <article className="report-ai-insight" key={`${item.title}-${index}`}>
                  <h3>{item.title}</h3>
                  <p>{item.observation}</p>
                  <p><strong>Próximo passo:</strong> {item.nextStep}</p>
                </article>)}
              </div>}
            </section>

            <section className="report-table-card">
              <div className="report-table-heading">
                <div>
                  <h2>Totais por categoria</h2>
                  <p>{carteiraAtiva?.nome} · {periodo.inicio} a {periodo.fim}</p>
                </div>
              </div>
              <div className="report-table-scroll">
                <table className="report-table">
                  <thead><tr><th>Categoria</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead>
                  <tbody>
                    {categorias.map(categoria => {
                      const receitas = Number(categoria.totalIncome || 0);
                      const despesas = Number(categoria.totalExpense || 0);
                      return <tr key={categoria.categoryId || categoria.categoryName}>
                        <td><span className="report-category-dot" style={{ backgroundColor: categoria.categoryColor || '#6b7280' }} />{categoria.categoryName}</td>
                        <td className="report-income">{formatarMoeda(receitas)}</td>
                        <td className="report-expense">{formatarMoeda(despesas)}</td>
                        <td>{formatarMoeda(receitas - despesas)}</td>
                      </tr>;
                    })}
                    {!categorias.length && <tr><td colSpan="4" className="report-no-rows">Sem lançamentos no período selecionado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
