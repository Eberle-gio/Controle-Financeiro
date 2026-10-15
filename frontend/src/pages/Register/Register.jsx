import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import './Register.css';

import logo from '../../assets/images/Logo.svg';

const Register = () => {

  // Estados dos Campos
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de Exibição de Senha
  const [exibirSenha, setExibirSenha] = useState(false);
  const [exibirConfirmarSenha, setExibirConfirmarSenha] = useState(false);

  // Estados de Validação e Erro
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

  // Validação do Formulário Completo
  const validarFormulario = () => {
    const errosTemporarios = {};
    if (!nome.trim()) errosTemporarios.name = 'Nome é obrigatório';
    
    if (!email) {
      errosTemporarios.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errosTemporarios.email = 'E-mail inválido';
    }
    
    if (!senha) {
      errosTemporarios.password = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      errosTemporarios.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmarSenha) {
      errosTemporarios.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (senha !== confirmarSenha) {
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
      await authService.cadastrar(nome, email, senha);
      setMensagemSucesso('Sua conta foi criada! Confira seu e-mail e confirme o cadastro pelo link enviado.');
      setSenha('');
      setConfirmarSenha('');
    } catch (err) {
      setErros({ apiError: err.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-wrapper">
      
        <div className="register-brand">
          <div className="brand-center-wrapper">
            <img src={logo} alt="NodeBank Logo" className="brand-logo" />
            <h1 className="brand-title">NodeBank</h1>
            <p className="brand-subtitle">Crie sua conta gratuita em poucos minutos e comece a controlar suas finanças.</p>
          </div>
        </div>

        <div className="register-form-side">
          <div className="form-container">
            <h2>Criar Conta</h2>
            <p className="form-subtitle">Cadastre-se para começar seu planejamento financeiro.</p>

            {erros.apiError && (
              <div className="alert alert-danger">
                {erros.apiError}
              </div>
            )}

            {mensagemSucesso && (
              <div className="alert alert-success" role="status">
                {mensagemSucesso}
                <p><Link to="/confirmar-cadastro">Não recebeu? Reenviar confirmação</Link></p>
              </div>
            )}

            {!mensagemSucesso && <form onSubmit={lidarEnvio} noValidate>
              
              <div className="input-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={tentativaEnvio && erros.name ? 'input-error' : ''}
                />
                {tentativaEnvio && erros.name && <span className="error-message">{erros.name}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={tentativaEnvio && erros.email ? 'input-error' : ''}
                />
                {tentativaEnvio && erros.email && <span className="error-message">{erros.email}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="password">Senha</label>
                <div className="password-container">
                  <input
                    id="password"
                    type={exibirSenha ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={tentativaEnvio && erros.password ? 'input-error' : ''}
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
                {tentativaEnvio && erros.password && <span className="error-message">{erros.password}</span>}

                <PasswordStrengthMeter password={senha} />
              </div>
              
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar Senha</label>
                <div className="password-container">
                  <input
                    id="confirmPassword"
                    type={exibirConfirmarSenha ? 'text' : 'password'}
                    placeholder="Repita sua senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={(tentativaEnvio || confirmarSenha) && erros.confirmPassword ? 'input-error' : ''}
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

              {/* BOTÃO SUBMIT */}
              <button
                type="submit"
                className="register-button"
                disabled={carregando}
              >
                {carregando ? (
                  <span className="spinner-container">
                    <span className="spinner"></span> Cadastrando...
                  </span>
                ) : (
                  'Cadastrar'
                )}
              </button>

            </form>}

            <div className="login-link">
              Já tem uma conta? <Link to="/login">Entrar</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
