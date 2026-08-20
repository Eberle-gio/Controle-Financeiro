import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
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

            <PasswordStrengthMeter password={senha} />
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
