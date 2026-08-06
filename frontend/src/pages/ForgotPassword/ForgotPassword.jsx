import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft } from 'lucide-react';
import './ForgotPassword.css';

import logo from '../../assets/images/Logo.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [debugToken, setDebugToken] = useState('');
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateForm = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'E-mail inválido';
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
    setMessage('');
    setDebugToken('');

    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message || 'Se o e-mail estiver cadastrado, você receberá instruções de redefinição.');
      if (response.debugToken) {
        setDebugToken(response.debugToken);
      }
    } catch (err) {
      setErrors({ apiError: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-wrapper">
        <div className="forgot-header">
          <img src={logo} alt="NodeBank Logo" className="brand-logo" />
          <h2>Recuperar Senha</h2>
          <p>Digite seu e-mail cadastrado e enviaremos as instruções para você redefinir sua senha.</p>
        </div>

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {errors.apiError && (
          <div className="alert alert-danger">
            {errors.apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={submitAttempted && errors.email ? 'input-error' : ''}
              disabled={loading}
            />
            {submitAttempted && errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <button type="submit" className="forgot-button" disabled={loading}>
            {loading ? (
              <span className="spinner-container">
                <span className="spinner"></span> Enviando...
              </span>
            ) : (
              'Solicitar recuperação'
            )}
          </button>
        </form>

        {debugToken && (
          <div className="debug-box">
            <h4>💡 Modo de Teste (Token Gerado)</h4>
            <p>Clique no link abaixo para testar a tela de redefinição:</p>
            <Link to={`/redefinir-senha/${debugToken}`} className="debug-link">
              Redefinir Senha (Token: {debugToken})
            </Link>
          </div>
        )}

        <div className="back-link-wrapper">
          <Link to="/login" className="back-centered-btn">
            <ArrowLeft size={18} />
            <span>Voltar para o Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
