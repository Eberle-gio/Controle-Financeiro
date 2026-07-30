import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Login.css';

import logo from '../../assets/images/Logo.svg';

export default function Login() {
  const navigate = useNavigate();

  // Estados dos Campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Validação e Envio
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Validação em Tempo Real e ao Submeter
  const validateForm = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Campo obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'E-mail inválido';
    }

    if (!password) {
      tempErrors.password = 'Campo obrigatório';
    } else if (password.length < 6) {
      tempErrors.password = 'Mínimo 6 caracteres';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Trata submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrors({ apiError: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        
        {/* LADO ESQUERDO - MARCA */}
        <div className="login-brand">
          <div className="brand-center-wrapper">
            <img src={logo} alt="NodeBank" className="brand-logo" />
            <h1 className="brand-title">NodeBank</h1>
            <p className="brand-subtitle">
              Seu dinheiro, suas decisões, seu controle.
            </p>
          </div>
        </div>

        {/* LADO DIREITO - FORMULÁRIO */}
        <div className="login-form-side">
          <div className="form-container">
            <h2>Bem-vindo de volta</h2>
            <p className="form-subtitle">Faça login para acessar sua conta.</p>

            {errors.apiError && (
              <div className="alert alert-danger">
                {errors.apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              
              {/* CAMPO E-MAIL */}
              <div className="input-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={submitAttempted && errors.email ? 'input-error' : ''}
                />
                {submitAttempted && errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              {/* CAMPO SENHA */}
              <div className="input-group">
                <label htmlFor="password">Senha</label>
                <div className="password-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={submitAttempted && errors.password ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
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
                {submitAttempted && errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <Link to="/recuperar-senha" className="forgot-password">
                Esqueceu sua senha?
              </Link>

              {/* BOTÃO ENTRAR */}
              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
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
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}