import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft } from 'lucide-react';
import './ResetPassword.css';

import logo from '../../assets/images/Logo.svg';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // Estados dos Campos
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de Exibição de Senha
  const [exibirSenha, setExibirSenha] = useState(false);
  const [exibirConfirmarSenha, setExibirConfirmarSenha] = useState(false);

  // Estados de Validação e Envio
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [tentativaEnvio, setTentativaEnvio] = useState(false);

  // Estado de Força da Senha
  const [forcaSenha, setForcaSenha] = useState({ score: 0, label: 'Muito Curta', color: '#ef4444', percent: '0%' });

  // Monitora a força da senha em tempo real
  useEffect(() => {
    if (!senha) {
      setForcaSenha({ score: 0, label: 'Muito Curta', color: '#9ca3af', percent: '0%' });
      return;
    }

    let pontuacao = 0;
    if (senha.length >= 6) {
      pontuacao = 1;
    }
    
    const temLetras = /[a-zA-Z]/.test(senha);
    const temNumeros = /[0-9]/.test(senha);
    const temEspeciais = /[^a-zA-Z0-9]/.test(senha);
    
    if (senha.length >= 6 && temLetras && temNumeros) {
      pontuacao = 2;
    }

    const temMaiuscula = /[A-Z]/.test(senha);
    const temMinuscula = /[a-z]/.test(senha);
    
    if (senha.length >= 8 && temMaiuscula && temMinuscula && temNumeros && temEspeciais) {
      pontuacao = 3;
    }

    if (senha.length < 6) {
      setForcaSenha({ score: 0, label: 'Muito Curta (mínimo 6 chars)', color: '#ef4444', percent: '20%' });
    } else if (pontuacao === 1) {
      setForcaSenha({ score: 1, label: 'Fraca', color: '#f59e0b', percent: '40%' });
    } else if (pontuacao === 2) {
      setForcaSenha({ score: 2, label: 'Média', color: '#3b82f6', percent: '70%' });
    } else {
      setForcaSenha({ score: 3, label: 'Forte', color: '#10b981', percent: '100%' });
    }
  }, [senha]);

  useEffect(() => {
    if (confirmarSenha && senha !== confirmarSenha) {
      setErros(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
    } else {
      setErros(prev => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
  }, [confirmarSenha, senha]);

  const validarFormulario = () => {
    const errosTemporarios = {};
    if (!senha) {
      errosTemporarios.password = 'A nova senha é obrigatória';
    } else if (senha.length < 6) {
      errosTemporarios.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmarSenha) {
      errosTemporarios.confirmPassword = 'A confirmação é obrigatória';
    } else if (senha !== confirmarSenha) {
      errosTemporarios.confirmPassword = 'As senhas não coincidem';
    }

    if (!token) {
      errosTemporarios.apiError = 'Token de redefinição ausente na URL.';
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
      await authService.redefinirSenha(token, senha);
      setMensagemSucesso('Senha redefinida com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErros({ apiError: err.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-wrapper">
        <div className="reset-header">
          <img src={logo} alt="NodeBank Logo" className="brand-logo" />
          <h2>Definir Nova Senha</h2>
          <p>Escolha uma nova senha forte para proteger sua conta.</p>
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
          
          {/* NOVA SENHA */}
          <div className="input-group">
            <label htmlFor="password">Nova Senha</label>
            <div className="password-container">
              <input
                id="password"
                type={exibirSenha ? 'text' : 'password'}
                placeholder="No mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={tentativaEnvio && erros.password ? 'input-error' : ''}
                disabled={carregando || !!mensagemSucesso}
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setExibirSenha(!exibirSenha)}
                tabIndex="-1"
                disabled={!!mensagemSucesso}
              >
                {exibirSenha ? (
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
            {tentativaEnvio && erros.password && (
              <span className="error-message">{erros.password}</span>
            )}

            {senha && (
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
                disabled={carregando || !!mensagemSucesso}
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setExibirConfirmarSenha(!exibirConfirmarSenha)}
                tabIndex="-1"
                disabled={!!mensagemSucesso}
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

          <button
            type="submit"
            className="reset-button"
            disabled={carregando || !!mensagemSucesso}
          >
            {carregando ? (
              <span className="spinner-container">
                <span className="spinner"></span> Atualizando...
              </span>
            ) : (
              'Redefinir Senha'
            )}
          </button>
        </form>

        <div className="back-link-wrapper">
          <Link to="/login" className="back-centered-btn">
            <ArrowLeft size={18} />
            <span>Voltar para o Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
