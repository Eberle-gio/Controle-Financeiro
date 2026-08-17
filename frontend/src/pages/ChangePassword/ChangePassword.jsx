import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const usuarioAtual = authService.obterUsuarioAtual();

  // Estados dos Campos
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de Exibição
  const [exibirSenhaAtual, setExibirSenhaAtual] = useState(false);
  const [exibirNovaSenha, setExibirNovaSenha] = useState(false);
  const [exibirConfirmarSenha, setExibirConfirmarSenha] = useState(false);

  // Estados de Feedback e Erros
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [tentativaEnvio, setTentativaEnvio] = useState(false);

  // Estado de Força de Nova Senha
  const [forcaSenha, setForcaSenha] = useState({ score: 0, label: 'Muito Curta', color: '#ef4444', percent: '0%' });

  useEffect(() => {
    if (!novaSenha) {
      setForcaSenha({ score: 0, label: 'Muito Curta', color: '#9ca3af', percent: '0%' });
      return;
    }

    let pontuacao = 0;
    if (novaSenha.length >= 6) {
      pontuacao = 1;
    }
    
    const temLetras = /[a-zA-Z]/.test(novaSenha);
    const temNumeros = /[0-9]/.test(novaSenha);
    const temEspeciais = /[^a-zA-Z0-9]/.test(novaSenha);
    
    if (novaSenha.length >= 6 && temLetras && temNumeros) {
      pontuacao = 2;
    }

    const temMaiuscula = /[A-Z]/.test(novaSenha);
    const temMinuscula = /[a-z]/.test(novaSenha);
    
    if (novaSenha.length >= 8 && temMaiuscula && temMinuscula && temNumeros && temEspeciais) {
      pontuacao = 3;
    }

    if (novaSenha.length < 6) {
      setForcaSenha({ score: 0, label: 'Muito Curta (mínimo 6 chars)', color: '#ef4444', percent: '20%' });
    } else if (pontuacao === 1) {
      setForcaSenha({ score: 1, label: 'Fraca', color: '#f59e0b', percent: '40%' });
    } else if (pontuacao === 2) {
      setForcaSenha({ score: 2, label: 'Média', color: '#3b82f6', percent: '70%' });
    } else {
      setForcaSenha({ score: 3, label: 'Forte', color: '#10b981', percent: '100%' });
    }
  }, [novaSenha]);

  useEffect(() => {
    if (confirmarSenha && novaSenha !== confirmarSenha) {
      setErros(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
    } else {
      setErros(prev => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
  }, [confirmarSenha, novaSenha]);

  const validarFormulario = () => {
    const errosTemporarios = {};
    if (!senhaAtual) {
      errosTemporarios.currentPassword = 'A senha atual é obrigatória';
    }
    
    if (!novaSenha) {
      errosTemporarios.newPassword = 'A nova senha é obrigatória';
    } else if (novaSenha.length < 6) {
      errosTemporarios.newPassword = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmarSenha) {
      errosTemporarios.confirmPassword = 'A confirmação da nova senha é obrigatória';
    } else if (novaSenha !== confirmarSenha) {
      errosTemporarios.confirmPassword = 'As senhas não coincidem';
    }

    setErros(errosTemporarios);
    return Object.keys(errosTemporarios).length === 0;
  };

  const lidarEnvio = async (e) => {
    e.preventDefault();
    setTentativaEnvio(true);

    if (!validarFormulario()) return;

    setCarregando(true);
    setErros({});

    try {
      await authService.alterarSenha(senhaAtual, novaSenha);
      setMensagemSucesso('Senha alterada com sucesso!');
      
      // Limpa formulário
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTentativaEnvio(false);
      
      setTimeout(() => {
        setMensagemSucesso('');
      }, 3000);
    } catch (err) {
      setErros({ apiError: err.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="change-pass-page">
      <Sidebar usuarioAtual={usuarioAtual} activeItem="senha" />

      <main className="change-pass-content">

        <div className="change-pass-card">
          <div className="card-header-centered">
            <h1>Alterar Senha</h1>
            <p>Mantenha sua conta segura atualizando sua senha periodicamente.</p>
          </div>

          {mensagemSucesso && (
            <div className="alert alert-success">
              {mensagemSucesso}
            </div>
          )}

          {erros.apiError && (
            <div className="alert alert-danger">
              {erros.apiError}
            </div>
          )}

          <form onSubmit={lidarEnvio} noValidate>
            
            <div className="input-group">
              <label htmlFor="currentPassword">Senha Atual</label>
              <div className="password-container">
                <input
                  id="currentPassword"
                  type={exibirSenhaAtual ? 'text' : 'password'}
                  placeholder="Digite sua senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className={tentativaEnvio && erros.currentPassword ? 'input-error' : ''}
                  disabled={carregando}
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setExibirSenhaAtual(!exibirSenhaAtual)}
                  tabIndex="-1"
                >
                  {exibirSenhaAtual ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {tentativaEnvio && erros.currentPassword && (
                <span className="error-message">{erros.currentPassword}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="newPassword">Nova Senha</label>
              <div className="password-container">
                <input
                  id="newPassword"
                  type={exibirNovaSenha ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className={tentativaEnvio && erros.newPassword ? 'input-error' : ''}
                  disabled={carregando}
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setExibirNovaSenha(!exibirNovaSenha)}
                  tabIndex="-1"
                >
                  {exibirNovaSenha ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {tentativaEnvio && erros.newPassword && (
                <span className="error-message">{erros.newPassword}</span>
              )}

              {novaSenha && (
                <div className="password-strength-meter">
                  <div className="strength-bar-bg">
                    <div className={`strength-bar-fill score-${forcaSenha.score}`}></div>
                  </div>
                  <span className={`strength-label score-${forcaSenha.score}`}>
                    Força da senha: <strong>{forcaSenha.label}</strong>
                  </span>
                </div>
              )}
            </div>


            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <div className="password-container">
                <input
                  id="confirmPassword"
                  type={exibirConfirmarSenha ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className={(tentativaEnvio || confirmarSenha) && erros.confirmPassword ? 'input-error' : ''}
                  disabled={carregando}
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setExibirConfirmarSenha(!exibirConfirmarSenha)}
                  tabIndex="-1"
                >
                  {exibirConfirmarSenha ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {(tentativaEnvio || confirmarSenha) && erros.confirmPassword && (
                <span className="error-message">{erros.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="submit-button" disabled={carregando}>
              {carregando ? (
                <span className="spinner-container">
                  <span className="spinner"></span> Atualizando...
                </span>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>

          </form>

          <div className="back-dashboard-wrapper">
            <Link to="/dashboard" className="back-dashboard-btn">
              <ArrowLeft size={18} />
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ChangePassword;
