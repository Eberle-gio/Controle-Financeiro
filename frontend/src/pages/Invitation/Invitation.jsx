import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { invitationService } from '../../services/invitationService';
import { rememberInvitation, forgetInvitation } from '../../services/pendingInvitation';
import { rememberWallet } from '../../services/walletSelection';
import logo from '../../assets/images/Logo.svg';
import '../ResetPassword/ResetPassword.css';
import './Invitation.css';

export default function Invitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.obterUsuarioAtual());
  const sameEmail = user?.email?.trim().toLowerCase() === invite?.email;

  useEffect(() => {
    let active = true;
    rememberInvitation(token);
    invitationService.consultar(token)
      .then(result => { if (active) setInvite(result); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    authService.validarSessao().then(currentUser => {
      setUser(currentUser);
      setSignedIn(Boolean(currentUser));
    });
  }, []);

  async function accept() {
    setBusy(true);
    setError('');
    try {
      const result = await invitationService.aceitar(token);
      rememberWallet({ id: result.walletId });
      forgetInvitation();
      navigate('/carteiras', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    await authService.logout();
    navigate('/login');
  }

  const registerUrl = `/cadastro?email=${encodeURIComponent(invite?.email || '')}`;

  return (
    <main className="reset-page invitation-page">
      <div className="reset-wrapper invitation-wrapper">
        <header className="reset-header invitation-header">
          <span className="invitation-logo-frame">
            <img src={logo} alt="NodeBank" className="brand-logo" />
          </span>
          <p className="invitation-eyebrow">CARTEIRA COMPARTILHADA</p>
          <h1>Convite para participar</h1>
          <p>Confira os detalhes antes de entrar na carteira.</p>
        </header>

        {loading && <p className="invitation-loading" role="status">Carregando convite...</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}

        {invite && !loading && (
          <>
            <section className="invitation-details" aria-label="Detalhes do convite">
              <div className="invitation-detail-row">
                <span>Carteira</span>
                <strong>{invite.walletName}</strong>
              </div>
              <div className="invitation-detail-row">
                <span>Convidado por</span>
                <strong>{invite.ownerName}</strong>
              </div>
              <div className="invitation-detail-row">
                <span>Enviado para</span>
                <strong>{invite.email}</strong>
              </div>
              <div className="invitation-detail-row">
                <span>Seu acesso</span>
                <strong>{invite.papel === 'EDITOR' ? 'Lançamentos e consulta' : 'Somente consulta'}</strong>
              </div>
            </section>

            <p className="invitation-validity">
              Convite válido até {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}.
            </p>

            <div className="invitation-actions">
              {signedIn && sameEmail ? (
                <button type="button" className="reset-button" disabled={busy} onClick={accept}>
                  {busy ? 'Aceitando...' : 'Aceitar convite e abrir carteira'}
                </button>
              ) : signedIn ? (
                <>
                  <p className="invitation-note">
                    Você está conectado como <strong>{user?.email}</strong>. Para aceitar, entre com {invite.email}.
                  </p>
                  <button type="button" className="reset-button invitation-secondary-action" disabled={busy} onClick={switchAccount}>
                    Trocar de conta
                  </button>
                </>
              ) : (
                <>
                  <p className="invitation-note">
                    Entre com o e-mail convidado para aceitar. Se ainda não tem conta, crie uma com esse mesmo e-mail.
                  </p>
                  <Link className="invitation-link-action" to="/login">Já tenho uma conta</Link>
                  <Link className="invitation-link-action invitation-secondary-action" to={registerUrl}>
                    Criar conta com {invite.email}
                  </Link>
                </>
              )}
            </div>
          </>
        )}

        {!loading && !invite && (
          <div className="back-link-wrapper">
            <Link to="/login" onClick={forgetInvitation}>Voltar para entrar</Link>
          </div>
        )}
        {invite && signedIn && (
          <div className="back-link-wrapper">
            <Link to="/carteiras" onClick={forgetInvitation}>Voltar para carteiras</Link>
          </div>
        )}
      </div>
    </main>
  );
}
