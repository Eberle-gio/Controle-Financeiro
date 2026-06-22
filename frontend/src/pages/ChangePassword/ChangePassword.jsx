import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockService } from '../../services/mockService';
import './ChangePassword.css';

export default function ChangePassword() {
  const navigate = useNavigate();
  const currentUser = mockService.getCurrentUser();

  // Estados dos Campos
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Exibição
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de Feedback e Erros
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Estado de Força de Nova Senha
  const [strength, setStrength] = useState({ score: 0, label: 'Muito Curta', color: '#ef4444', percent: '0%' });

  // Monitora a força da nova senha
  useEffect(() => {
    if (!newPassword) {
      setStrength({ score: 0, label: 'Muito Curta', color: '#9ca3af', percent: '0%' });
      return;
    }

    let score = 0;
    if (newPassword.length >= 6) {
      score = 1;
    }
    
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    
    if (newPassword.length >= 6 && hasLetters && hasNumbers) {
      score = 2;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    
    if (newPassword.length >= 8 && hasUpper && hasLower && hasNumbers && hasSpecial) {
      score = 3;
    }

    if (newPassword.length < 6) {
      setStrength({ score: 0, label: 'Muito Curta (mínimo 6 chars)', color: '#ef4444', percent: '20%' });
    } else if (score === 1) {
      setStrength({ score: 1, label: 'Fraca', color: '#f59e0b', percent: '40%' });
    } else if (score === 2) {
      setStrength({ score: 2, label: 'Média', color: '#3b82f6', percent: '70%' });
    } else {
      setStrength({ score: 3, label: 'Forte 💪', color: '#10b981', percent: '100%' });
    }
  }, [newPassword]);

  // Validação Cross-field
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
  }, [confirmPassword, newPassword]);

  const validateForm = () => {
    const tempErrors = {};
    if (!currentPassword) {
      tempErrors.currentPassword = 'A senha atual é obrigatória';
    }
    
    if (!newPassword) {
      tempErrors.newPassword = 'A nova senha é obrigatória';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'A confirmação da nova senha é obrigatória';
    } else if (newPassword !== confirmPassword) {
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
      await mockService.changePassword(currentPassword, newPassword);
      setSuccessMessage('Senha alterada com sucesso!');
      
      // Limpa formulário
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSubmitAttempted(false);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setErrors({ apiError: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-pass-page">
      {/* Navegação/Sidebar Simples da Área Autenticada */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="logo-icon">⚡</span>
          <h2>NodeBank</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            📊 Dashboard
          </Link>
          <Link to="/app/perfil/senha" className="nav-item active">
            🔒 Alterar Senha
          </Link>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser?.name}</span>
            <span className="user-email">{currentUser?.email}</span>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="change-pass-content">
        <header className="content-header">
          <div className="title-wrapper">
            <h1>Alterar Senha</h1>
            <p>Mantenha sua conta segura atualizando sua senha periodicamente.</p>
          </div>
          <Link to="/dashboard" className="back-btn">
            ← Voltar ao Dashboard
          </Link>
        </header>

        <div className="change-pass-form-container">
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          {errors.apiError && (
            <div className="alert alert-danger">
              {errors.apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            {/* SENHA ATUAL */}
            <div className="input-group">
              <label htmlFor="currentPassword">Senha Atual</label>
              <div className="password-container">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={submitAttempted && errors.currentPassword ? 'input-error' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex="-1"
                >
                  {showCurrentPassword ? (
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
              {submitAttempted && errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            {/* NOVA SENHA */}
            <div className="input-group">
              <label htmlFor="newPassword">Nova Senha</label>
              <div className="password-container">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={submitAttempted && errors.newPassword ? 'input-error' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex="-1"
                >
                  {showNewPassword ? (
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
              {submitAttempted && errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}

              {/* MEDIDOR DE FORÇA DA NOVA SENHA */}
              {newPassword && (
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

            {/* CONFIRMAÇÃO DE SENHA */}
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <div className="password-container">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={(submitAttempted || confirmPassword) && errors.confirmPassword ? 'input-error' : ''}
                  disabled={loading}
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

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <span className="spinner-container">
                  <span className="spinner"></span> Atualizando...
                </span>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}
