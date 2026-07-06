import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Register.css';

import logo from '../../assets/images/Logo.svg';

export default function Register() {
  const navigate = useNavigate();

  // Estados dos Campos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Exibição de Senha
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de Validação e Erro
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Estado de Força da Senha
  const [strength, setStrength] = useState({ score: 0, label: 'Muito Curta', color: '#ef4444', percent: '0%' });

  // Monitora a força da senha em tempo real
  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: 'Muito Curta', color: '#9ca3af', percent: '0%' });
      return;
    }

    let score = 0;
    
    // Critério 1: Comprimento mínimo
    if (password.length >= 6) {
      score = 1;
    }
    
    // Critério 2: Mistura de letras e números
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    if (password.length >= 6 && hasLetters && hasNumbers) {
      score = 2; // Média
    }

    // Critério 3: Muito forte (mais de 8 caracteres, maiúsculas, minúsculas, números e caracteres especiais)
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    
    if (password.length >= 8 && hasUpper && hasLower && hasNumbers && hasSpecial) {
      score = 3; // Forte
    }

    // Mapeamento de score para visual
    if (password.length < 6) {
      setStrength({ score: 0, label: 'Muito Curta (mínimo 6 chars)', color: '#ef4444', percent: '20%' });
    } else if (score === 1) {
      setStrength({ score: 1, label: 'Fraca', color: '#f59e0b', percent: '40%' });
    } else if (score === 2) {
      setStrength({ score: 2, label: 'Média', color: '#3b82f6', percent: '70%' });
    } else {
      setStrength({ score: 3, label: 'Forte 💪', color: '#10b981', percent: '100%' });
    }
  }, [password]);

  // Validação Cross-field em Tempo Real para Confirmação de Senha
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
  }, [confirmPassword, password]);

  // Validação do Formulário Completo
  const validateForm = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Nome é obrigatório';
    
    if (!email) {
      tempErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'E-mail inválido';
    }
    
    if (!password) {
      tempErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      tempErrors.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await authService.register(name, email, password);
      setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors({ apiError: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-wrapper">
        
        {/* LADO DA MARCA */}
        <div className="register-brand">
          <div className="brand-center-wrapper">
            <img src={logo} alt="NodeBank Logo" className="brand-logo" />
            <h1 className="brand-title">NodeBank</h1>
            <p className="brand-subtitle">Crie sua conta gratuita em poucos minutos e comece a controlar suas finanças.</p>
          </div>
        </div>

        {/* LADO DO FORMULÁRIO */}
        <div className="register-form-side">
          <div className="form-container">
            <h2>Criar Conta</h2>
            <p className="form-subtitle">Cadastre-se para começar seu planejamento financeiro.</p>

            {errors.apiError && (
              <div className="alert alert-danger">
                {errors.apiError}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              
              {/* CAMPO NOME */}
              <div className="input-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={submitAttempted && errors.name ? 'input-error' : ''}
                />
                {submitAttempted && errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* CAMPO E-MAIL */}
              <div className="input-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={submitAttempted && errors.email ? 'input-error' : ''}
                />
                {submitAttempted && errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* CAMPO SENHA */}
              <div className="input-group">
                <label htmlFor="password">Senha</label>
                <div className="password-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
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
                {submitAttempted && errors.password && <span className="error-message">{errors.password}</span>}

                {/* INDICADOR DE FORÇA DE SENHA */}
                {password && (
                  <div className="password-strength-meter">
                    <div className="strength-bar-bg">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: strength.percent,
                          backgroundColor: strength.color
                        }}
                      ></div>
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>
                      Força da senha: <strong>{strength.label}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* CAMPO CONFIRMAÇÃO DE SENHA */}
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar Senha</label>
                <div className="password-container">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={(submitAttempted || confirmPassword) && errors.confirmPassword ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
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
                {(submitAttempted || confirmPassword) && errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>

              {/* BOTÃO SUBMIT */}
              <button
                type="submit"
                className="register-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-container">
                    <span className="spinner"></span> Cadastrando...
                  </span>
                ) : (
                  'Cadastrar'
                )}
              </button>

            </form>

            <div className="login-link">
              Já tem uma conta? <Link to="/login">Entrar</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}