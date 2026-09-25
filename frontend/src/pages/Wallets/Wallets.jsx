import { useState, useEffect, useCallback } from 'react';
import { walletService } from '../../services/walletService';
import { authService } from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import {
  Wallet,
  Plus,
  Users,
  Trash2,
  Edit2,
  X,
  Check,
  UserPlus,
  Shield,
  AlertCircle
} from 'lucide-react';
import './Wallets.css';

const Wallets = () => {
  const [usuarioAtual, setUsuarioAtual] = useState(() => authService.obterUsuarioAtual());
  const [carteiras, setCarteiras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Modal Nova / Editar Carteira
  const [modalCarteiraAberto, setModalCarteiraAberto] = useState(false);
  const [carteiraEmEdicao, setCarteiraEmEdicao] = useState(null);
  const [nomeCarteira, setNomeCarteira] = useState('');
  const [descricaoCarteira, setDescricaoCarteira] = useState('');
  const [salvandoCarteira, setSalvandoCarteira] = useState(false);

  // Modal de Membros
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);
  const [carteiraMembros, setCarteiraMembros] = useState(null);
  const [membros, setMembros] = useState([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [novoMembroEmail, setNovoMembroEmail] = useState('');
  const [novoMembroPapel, setNovoMembroPapel] = useState('LEITURA');
  const [adicionandoMembro, setAdicionandoMembro] = useState(false);
  const [erroMembros, setErroMembros] = useState('');

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const perfil = await authService.obterPerfil();
        setUsuarioAtual(perfil);
      } catch (e) {}
    };
    buscarPerfil();
  }, []);

  const carregarCarteiras = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      let lista = await walletService.listarCarteiras();
      if (lista.length === 0) {
        const padrao = await walletService.criarCarteira('Minha Carteira', 'Carteira Principal');
        lista = [padrao];
      }
      setCarteiras(lista);
    } catch (err) {
      setErro(err.message || 'Falha ao carregar carteiras');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCarteiras();
  }, [carregarCarteiras]);

  // Abertura de modal de criação/edição
  const abrirCriarCarteira = () => {
    setCarteiraEmEdicao(null);
    setNomeCarteira('');
    setDescricaoCarteira('');
    setModalCarteiraAberto(true);
  };

  const abrirEditarCarteira = (c) => {
    setCarteiraEmEdicao(c);
    setNomeCarteira(c.nome);
    setDescricaoCarteira(c.descricao || '');
    setModalCarteiraAberto(true);
  };

  const salvarCarteira = async (e) => {
    e.preventDefault();
    if (!nomeCarteira.trim()) return;

    setSalvandoCarteira(true);
    setErro('');
    try {
      if (carteiraEmEdicao) {
        await walletService.atualizarCarteira(carteiraEmEdicao.id, nomeCarteira.trim(), descricaoCarteira.trim());
      } else {
        await walletService.criarCarteira(nomeCarteira.trim(), descricaoCarteira.trim());
      }
      setModalCarteiraAberto(false);
      carregarCarteiras();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar carteira');
    } finally {
      setSalvandoCarteira(false);
    }
  };

  const excluirCarteira = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta carteira e todas as suas transações?')) return;
    try {
      await walletService.excluirCarteira(id);
      carregarCarteiras();
    } catch (err) {
      alert(err.message || 'Não foi possível excluir a carteira.');
    }
  };

  // Gestão de Membros
  const abrirGerenciarMembros = async (carteira) => {
    setCarteiraMembros(carteira);
    setModalMembrosAberto(true);
    setErroMembros('');
    setNovoMembroEmail('');
    setCarregandoMembros(true);
    try {
      const lista = await walletService.listarMembros(carteira.id);
      setMembros(lista);
    } catch (err) {
      setErroMembros(err.message || 'Erro ao carregar membros');
    } finally {
      setCarregandoMembros(false);
    }
  };

  const adicionarMembro = async (e) => {
    e.preventDefault();
    if (!novoMembroEmail.trim() || !carteiraMembros) return;

    setAdicionandoMembro(true);
    setErroMembros('');
    try {
      await walletService.adicionarMembro(carteiraMembros.id, novoMembroEmail.trim(), novoMembroPapel);
      setNovoMembroEmail('');
      const lista = await walletService.listarMembros(carteiraMembros.id);
      setMembros(lista);
    } catch (err) {
      setErroMembros(err.message || 'Falha ao convidar membro');
    } finally {
      setAdicionandoMembro(false);
    }
  };

  const removerMembro = async (userId) => {
    if (!carteiraMembros) return;
    try {
      await walletService.removerMembro(carteiraMembros.id, userId);
      setMembros((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      setErroMembros(err.message || 'Falha ao remover membro');
    }
  };

  return (
    <div className="wallets-page">
      <Sidebar usuarioAtual={usuarioAtual} itemAtivo="carteiras" />

      <main className="wallets-content">
        <header className="page-header">
          <div className="header-titles">
            <h1>Minhas Carteiras</h1>
            <p>Organize suas finanças individuais ou compartilhe orçamentos com outras pessoas.</p>
          </div>
          <button onClick={abrirCriarCarteira} className="btn-primary-action">
            <Plus size={18} /> Nova Carteira
          </button>
        </header>

        {erro && <div className="alert-error-box">{erro}</div>}

        {/* Grid de Carteiras */}
        <section className="wallets-grid">
          {carteiras.map((c) => (
            <div key={c.id} className="wallet-card">
              <div className="wallet-card-header">
                <div className="wallet-icon-title">
                  <div className="wallet-badge">
                    <Wallet size={22} color="var(--primary-hover)" />
                  </div>
                  <div>
                    <h3>{c.nome}</h3>
                    <span className="wallet-role-pill">
                      <Shield size={12} /> {c.meuPapel || 'PROPRIETARIO'}
                    </span>
                  </div>
                </div>

                <div className="wallet-card-actions">
                  <button
                    type="button"
                    onClick={() => abrirEditarCarteira(c)}
                    className="icon-action-btn"
                    title="Editar Carteira"
                  >
                    <Edit2 size={16} />
                  </button>
                  {carteiras.length > 1 && (
                    <button
                      type="button"
                      onClick={() => excluirCarteira(c.id)}
                      className="icon-action-btn delete"
                      title="Excluir Carteira"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <p className="wallet-card-desc">
                {c.descricao || 'Sem descrição cadastrada.'}
              </p>

              <div className="wallet-card-footer">
                <button
                  type="button"
                  onClick={() => abrirGerenciarMembros(c)}
                  className="btn-members-manage"
                >
                  <Users size={16} /> Membros Compartilhados
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Modal Criar / Editar Carteira */}
      {modalCarteiraAberto && (
        <div className="modal-backdrop" onClick={() => setModalCarteiraAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{carteiraEmEdicao ? 'Editar Carteira' : 'Nova Carteira'}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalCarteiraAberto(false)}
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={salvarCarteira} className="modal-form">
              <div className="form-group">
                <label htmlFor="wallet-name">Nome da Carteira*</label>
                <input
                  id="wallet-name"
                  type="text"
                  placeholder="Ex: Família, Empresa, Pessoal..."
                  value={nomeCarteira}
                  onChange={(e) => setNomeCarteira(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="wallet-desc">Descrição (Opcional)</label>
                <input
                  id="wallet-desc"
                  type="text"
                  placeholder="Ex: Gastos compartilhados da casa"
                  value={descricaoCarteira}
                  onChange={(e) => setDescricaoCarteira(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <div className="modal-right-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setModalCarteiraAberto(false)}
                    disabled={salvandoCarteira}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={salvandoCarteira}>
                    <Check size={18} />
                    {salvandoCarteira ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Membros */}
      {modalMembrosAberto && (
        <div className="modal-backdrop" onClick={() => setModalMembrosAberto(false)}>
          <div className="modal-container members-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>Membros da Carteira</h2>
                <span className="modal-subtitle">{carteiraMembros?.nome}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalMembrosAberto(false)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="modal-body-content">
              {erroMembros && (
                <div className="modal-error-alert">
                  <AlertCircle size={16} />
                  <span>{erroMembros}</span>
                </div>
              )}

              {/* Formulário Convidar Membro */}
              <form onSubmit={adicionarMembro} className="invite-member-form">
                <div className="invite-inputs">
                  <input
                    type="email"
                    placeholder="E-mail do membro cadastrado"
                    value={novoMembroEmail}
                    onChange={(e) => setNovoMembroEmail(e.target.value)}
                    required
                  />
                  <select
                    value={novoMembroPapel}
                    onChange={(e) => setNovoMembroPapel(e.target.value)}
                  >
                    <option value="LEITURA">Leitura</option>
                    <option value="ESCRITA">Escrita (pode lançar)</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-invite"
                  disabled={adicionandoMembro}
                >
                  <UserPlus size={16} />
                  {adicionandoMembro ? 'Adicionando...' : 'Convidar'}
                </button>
              </form>

              {/* Lista de Membros Existentes */}
              <div className="members-list-wrapper">
                <h4>Membros Atuais</h4>
                {carregandoMembros ? (
                  <p className="loading-text">Carregando membros...</p>
                ) : membros.length > 0 ? (
                  <div className="members-list">
                    {membros.map((m) => (
                      <div key={m.userId} className="member-item">
                        <div className="member-avatar">
                          {m.userName ? m.userName.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{m.userName || 'Membro'}</span>
                          <span className="member-email">{m.userEmail}</span>
                        </div>
                        <div className="member-role-badge">{m.papel}</div>
                        {m.papel !== 'PROPRIETARIO' && (
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removerMembro(m.userId)}
                            title="Remover Membro"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-members">Esta carteira ainda não possui outros membros.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
