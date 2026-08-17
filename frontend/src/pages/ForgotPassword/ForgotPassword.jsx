import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft } from 'lucide-react';
import './ForgotPassword.css';

import logo from '../../assets/images/Logo.svg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erros, setErros] = useState({});
  const [tentativaEnvio, setTentativaEnvio] = useState(false);

  const validarFormulario = () => {
    const errosTemporarios = {};
    if (!email) {
      errosTemporarios.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errosTemporarios.email = 'E-mail inválido';
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
    setMensagem('');

    try {
      const resposta = await authService.solicitarRecuperacaoSenha(email);
      setMensagem(resposta.message || 'Se o e-mail estiver cadastrado, você receberá instruções de redefinição.');
    } catch (err) {
      setErros({ apiError: err.message });
    } finally {
      setCarregando(false);
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

        {mensagem && (
          <div className="alert alert-success">
            {mensagem}
          </div>
        )}

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
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={tentativaEnvio && erros.email ? 'input-error' : ''}
              disabled={carregando}
            />
            {tentativaEnvio && erros.email && (
              <span className="error-message">{erros.email}</span>
            )}
          </div>

          <button type="submit" className="forgot-button" disabled={carregando}>
            {carregando ? (
              <span className="spinner-container">
                <span className="spinner"></span> Enviando...
              </span>
            ) : (
              'Solicitar recuperação'
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

export default ForgotPassword;
