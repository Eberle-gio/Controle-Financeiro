import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, LockKeyhole, Moon, Save, Sun, Trash2, UserRound, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { authService } from '../../services/authService';
import './Profile.css';

const Profile = () => {
  const [usuario, setUsuario] = useState(() => authService.obterUsuarioAtual());
  const [nome, setNome] = useState(usuario?.name || '');
  const [tema, setTema] = useState(() => document.documentElement.dataset.theme || localStorage.getItem('app_theme') || 'dark');
  const [carregando, setCarregando] = useState(!usuario);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [etapaExclusao, setEtapaExclusao] = useState('');
  const [carteirasAtivas, setCarteirasAtivas] = useState([]);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    let ativo = true;
    authService.obterPerfil()
      .then(perfil => {
        if (!ativo) return;
        setUsuario(perfil);
        setNome(perfil.name || '');
      })
      .catch(error => {
        if (ativo) setErro(error.message || 'Não foi possível carregar seu perfil.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  const selecionarTema = (novoTema) => {
    setTema(novoTema);
    document.documentElement.dataset.theme = novoTema;
    localStorage.setItem('app_theme', novoTema);
  };

  const salvarNome = async (event) => {
    event.preventDefault();
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
      setErro('O nome deve ter entre 3 e 100 caracteres.');
      setSucesso('');
      return;
    }

    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      const perfilAtualizado = await authService.atualizarPerfil(nomeLimpo);
      setUsuario(perfilAtualizado);
      setNome(perfilAtualizado.name || nomeLimpo);
      setSucesso('Nome atualizado com sucesso.');
    } catch (error) {
      setErro(error.message || 'Não foi possível atualizar seu nome.');
    } finally {
      setSalvando(false);
    }
  };

  const iniciarExclusao = async () => {
    setErro('');
    try {
      const resumo = await authService.obterResumoExclusaoConta();
      const nomes = resumo.activeWalletNames || [];
      setCarteirasAtivas(nomes);
      setEtapaExclusao(nomes.length ? 'carteiras' : 'confirmacao');
    } catch (error) {
      setErro(error.message || 'Não foi possível verificar suas carteiras.');
    }
  };

  const continuarExclusao = () => {
    setSenhaExclusao('');
    setConfirmacaoExclusao('');
    setEtapaExclusao('confirmacao');
  };

  const confirmarExclusao = async (event) => {
    event.preventDefault();
    if (confirmacaoExclusao !== 'EXCLUIR') {
      setErro('Digite EXCLUIR para confirmar.');
      return;
    }
    setExcluindo(true);
    setErro('');
    try {
      await authService.excluirConta(senhaExclusao, confirmacaoExclusao);
      setEtapaExclusao('');
      window.location.assign('/login');
    } catch (error) {
      setErro(error.message || 'Não foi possível excluir sua conta.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="profile-page">
      <Sidebar usuarioAtual={usuario} activeItem="perfil" />
      <main className="profile-content">
        <header className="profile-heading">
          <div className="profile-heading-icon"><UserRound size={24} /></div>
          <div>
            <h1>Meu perfil</h1>
            <p>Gerencie seus dados pessoais e preferências da conta.</p>
          </div>
        </header>

        {erro && <div className="profile-alert profile-alert-error" role="alert">{erro}</div>}
        {sucesso && <div className="profile-alert profile-alert-success" role="status">{sucesso}</div>}
        {carregando ? (
          <p className="profile-loading" role="status">Carregando perfil...</p>
        ) : (
          <div className="profile-sections">
            <section className="profile-card" aria-labelledby="profile-data-title">
              <div className="profile-card-heading">
                <div>
                  <h2 id="profile-data-title">Dados pessoais</h2>
                  <p>Atualize o nome que aparece na sua conta.</p>
                </div>
              </div>
              <form className="profile-form" onSubmit={salvarNome}>
                <label htmlFor="profile-name">Nome</label>
                <input
                  id="profile-name"
                  type="text"
                  minLength={3}
                  maxLength={100}
                  value={nome}
                  onChange={event => setNome(event.target.value)}
                  autoComplete="name"
                  required
                />
                <label htmlFor="profile-email">E-mail</label>
                <input id="profile-email" type="email" value={usuario?.email || ''} readOnly />
                <button className="profile-primary-button" type="submit" disabled={salvando}>
                  <Save size={17} />
                  {salvando ? 'Salvando...' : 'Salvar nome'}
                </button>
              </form>
            </section>

            <section className="profile-card" aria-labelledby="profile-theme-title">
              <div className="profile-card-heading">
                <div>
                  <h2 id="profile-theme-title">Aparência</h2>
                  <p>Escolha o tema usado neste navegador.</p>
                </div>
              </div>
              <div className="theme-options" role="group" aria-label="Tema da interface">
                <button
                  type="button"
                  className={`theme-option ${tema === 'light' ? 'selected' : ''}`}
                  aria-pressed={tema === 'light'}
                  onClick={() => selecionarTema('light')}
                >
                  <Sun size={21} />
                  <span><strong>Claro</strong><small>Fundo claro e texto escuro</small></span>
                  <span className="theme-radio" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`theme-option ${tema === 'dark' ? 'selected' : ''}`}
                  aria-pressed={tema === 'dark'}
                  onClick={() => selecionarTema('dark')}
                >
                  <Moon size={21} />
                  <span><strong>Escuro</strong><small>Fundo escuro e texto claro</small></span>
                  <span className="theme-radio" aria-hidden="true" />
                </button>
              </div>
            </section>

            <section className="profile-card profile-security-card" aria-labelledby="profile-security-title">
              <div className="profile-card-heading">
                <div className="profile-security-icon"><LockKeyhole size={20} /></div>
                <div>
                  <h2 id="profile-security-title">Segurança</h2>
                  <p>Atualize sua senha para manter a conta protegida.</p>
                </div>
              </div>
              <Link to="/app/perfil/senha" className="profile-secondary-button">Alterar senha</Link>
            </section>

            <section className="profile-card profile-danger-card" aria-labelledby="profile-delete-title">
              <div className="profile-card-heading">
                <div className="profile-danger-icon"><AlertTriangle size={20} /></div>
                <div>
                  <h2 id="profile-delete-title">Excluir conta</h2>
                  <p>Remova seu acesso e seus dados pessoais do NodeBank.</p>
                </div>
              </div>
              <button type="button" className="profile-delete-button" onClick={iniciarExclusao}>
                <Trash2 size={17} /> Excluir minha conta
              </button>
            </section>
          </div>
        )}
      </main>

      {etapaExclusao && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !excluindo) setEtapaExclusao('');
        }}>
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <button type="button" className="profile-modal-close" aria-label="Fechar" disabled={excluindo} onClick={() => setEtapaExclusao('')}>
              <X size={20} />
            </button>
            {etapaExclusao === 'carteiras' ? (
              <>
                <div className="profile-danger-icon"><AlertTriangle size={22} /></div>
                <h2 id="delete-dialog-title">Suas carteiras estão ativas</h2>
                <p>Encontramos {carteirasAtivas.length} {carteirasAtivas.length === 1 ? 'carteira ativa' : 'carteiras ativas'}:</p>
                <ul className="active-wallet-list">
                  {carteirasAtivas.map((carteira, index) => <li key={`${carteira}-${index}`}>{carteira}</li>)}
                </ul>
                <p>Se continuar, elas serão inativadas e ficarão disponíveis somente para consulta dos demais membros. O histórico financeiro será preservado.</p>
                <div className="profile-modal-actions">
                  <button type="button" className="profile-secondary-button" onClick={() => setEtapaExclusao('')}>Cancelar</button>
                  <button type="button" className="profile-delete-button" onClick={continuarExclusao}>Sim, inativar e continuar</button>
                </div>
              </>
            ) : (
              <form onSubmit={confirmarExclusao}>
                <div className="profile-danger-icon"><AlertTriangle size={22} /></div>
                <h2 id="delete-dialog-title">Confirme a exclusão da conta</h2>
                <p>Seu acesso e dados pessoais serão removidos. Carteiras próprias serão inativadas; o histórico será preservado para os membros restantes. Seu acesso a carteiras compartilhadas também será removido. Esta ação não pode ser desfeita.</p>
                {erro && <div className="profile-alert profile-alert-error" role="alert">{erro}</div>}
                <label htmlFor="delete-account-password">Senha atual</label>
                <input
                  id="delete-account-password"
                  type="password"
                  value={senhaExclusao}
                  onChange={event => setSenhaExclusao(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <label htmlFor="delete-account-confirmation">Digite EXCLUIR para confirmar</label>
                <input
                  id="delete-account-confirmation"
                  type="text"
                  value={confirmacaoExclusao}
                  onChange={event => setConfirmacaoExclusao(event.target.value)}
                  autoComplete="off"
                  required
                />
                <div className="profile-modal-actions">
                  <button type="button" className="profile-secondary-button" disabled={excluindo} onClick={() => setEtapaExclusao('')}>Cancelar</button>
                  <button type="submit" className="profile-delete-button" disabled={excluindo || confirmacaoExclusao !== 'EXCLUIR'}>
                    <Trash2 size={17} /> {excluindo ? 'Excluindo...' : 'Excluir conta definitivamente'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
