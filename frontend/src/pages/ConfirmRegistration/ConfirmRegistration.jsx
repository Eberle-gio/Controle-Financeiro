import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import logo from '../../assets/images/Logo.svg';
import '../ResetPassword/ResetPassword.css';

export default function ConfirmRegistration() {
  const { token } = useParams();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function confirmar() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await authService.confirmarCadastro(token);
      setConfirmed(true);
      setMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function reenviar(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await authService.reenviarConfirmacao(email);
      setMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reset-page">
      <div className="reset-wrapper">
        <header className="reset-header">
          <img src={logo} alt="NodeBank Logo" className="brand-logo" />
          <h2>{confirmed ? 'Tudo pronto!' : 'Confirme seu cadastro'}</h2>
          <p>{confirmed ? 'Sua conta está pronta para começar.' : 'Confirme seu e-mail para dar o próximo passo nas suas finanças.'}</p>
        </header>
        {message && <p className="alert alert-success" role="status">{message}</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        {token && !confirmed && (
          <button type="button" className="reset-button" disabled={busy} onClick={confirmar}>
            {busy ? 'Aguarde...' : 'Confirmar meu cadastro'}
          </button>
        )}
        {!confirmed && (
          <form onSubmit={reenviar} style={{ marginTop: '2rem' }}>
            <p>Não recebeu o e-mail ou seu link expirou? Solicite um novo.</p>
            <div className="input-group">
              <label htmlFor="confirmation-email">E-mail do cadastro</label>
              <input id="confirmation-email" type="email" autoComplete="email" required maxLength={254}
                value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <button type="submit" className="reset-button" disabled={busy}>
              {busy ? 'Aguarde...' : 'Reenviar confirmação'}
            </button>
          </form>
        )}
        <div className="back-link-wrapper"><Link to="/login">Voltar para entrar</Link></div>
      </div>
    </main>
  );
}
