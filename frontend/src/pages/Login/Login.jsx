import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { pendingInvitationPath } from '../../services/pendingInvitation';
import './Login.css';

import logo from '../../assets/images/Logo.svg';

const Login = () => {
  const navigate = useNavigate();

  // Estados dos Campos
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [exibirSenha, setExibirSenha] = useState(false);

  // Estados de Validação e Envio
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [tentativaEnvio, setTentativaEnvio] = useState(false);

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate(pendingInvitationPath());
    }
  }, [navigate]);

  const validarFormulario = () => {
    const errosTemporarios = {};
    if (!email) {
      errosTemporarios.email = 'Campo obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errosTemporarios.email = 'E-mail inválido';
    }

    if (!senha) {
      errosTemporarios.senha = 'Campo obrigatório';
    } else if (senha.length < 6) {
      errosTemporarios.senha = 'Mínimo 6 caracteres';
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
      await authService.login(email, senha);
      navigate(pendingInvitationPath());
    } catch (err) {
      setErros({ apiError: err.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        
        <div className="login-brand">
          <div className="brand-center-wrapper">
            <img src={logo} alt="NodeBank" className="brand-logo" />
            <h1 className="brand-title">NodeBank</h1>
            <p className="brand-subtitle">
              Seu dinheiro, suas decisões, seu controle.
            </p>
          </div>
        </div>

        <div className="login-form-side">
          <div className="form-container">
            <h2>Bem-vindo de volta</h2>
            <p className="form-subtitle">Faça login para acessar sua conta.</p>

            {erros.apiError && (
              <div className="alert alert-danger">
                {erros.apiError}
              </div>
            )}

            <form onSubmit={lidarEnvio} noValidate>
              
              <div className="input-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={tentativaEnvio && erros.email ? 'input-error' : ''}
                />
                {tentativaEnvio && erros.email && (
                  <span className="error-message">{erros.email}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="password">Senha</label>
                <div className="password-container">
                  <input
                    id="password"
                    type={exibirSenha ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={tentativaEnvio && erros.senha ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setExibirSenha(!exibirSenha)}
                    tabIndex="-1"
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
                {tentativaEnvio && erros.senha && (
                  <span className="error-message">{erros.senha}</span>
                )}
              </div>

              <Link to="/recuperar-senha" className="forgot-password">
                Esqueceu sua senha?
              </Link>

              <button
                className="login-button"
                type="submit"
                disabled={carregando}
              >
                {carregando ? (
                  <span className="spinner-container">
                    <span className="spinner"></span> Carregando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>

            </form>

            <div className="register-link">
              Não possui conta? <Link to="/cadastro">Criar conta</Link>
              <p><Link to="/confirmar-cadastro">Reenviar confirmação de cadastro</Link></p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
