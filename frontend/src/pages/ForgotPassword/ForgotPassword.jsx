import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockService } from '../../services/mockService';
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
      const response = await mockService.forgotPassword(email);
      setMessage(response.message);
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
          <p>Digite seu e-mail cadastrado e enviaremos um link de recuperação.</p>
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
              placeholder="Digite seu e-mail"
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

        {/* ATENÇÃO: Box de Depuração exclusivo para Mock/Ambiente de Testes */}
        {debugToken && (
          <div className="debug-box">
            <h4>💡 Modo de Teste (Mock Local)</h4>
            <p>Como não enviamos e-mails reais, clique no link abaixo para ir direto à tela de redefinição com o token gerado:</p>
            <Link to={`/redefinir-senha/${debugToken}`} className="debug-link">
              Redefinir Senha (Token: {debugToken})
            </Link>
          </div>
        )}

        <div className="back-link">
          <Link to="/login">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}
