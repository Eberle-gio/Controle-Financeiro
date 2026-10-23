import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { invitationService } from '../../services/invitationService';
import { rememberInvitation, forgetInvitation } from '../../services/pendingInvitation';
import { rememberWallet } from '../../services/walletSelection';
import logo from '../../assets/images/Logo.svg';
import '../ResetPassword/ResetPassword.css';

export default function Invitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const signedIn = authService.isAuthenticated();
  const user = authService.obterUsuarioAtual();
  const sameEmail = user?.email?.trim().toLowerCase() === invite?.email;

  useEffect(() => {
    let active = true;
    rememberInvitation(token);
    invitationService.consultar(token).then(result => { if (active) setInvite(result); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function accept() {
    setBusy(true); setError('');
    try {
      const result = await invitationService.aceitar(token);
      rememberWallet({ id: result.walletId });
      forgetInvitation();
      navigate('/carteiras', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function switchAccount() { authService.logout(); navigate('/login'); }
  const registerUrl = `/cadastro?email=${encodeURIComponent(invite?.email || '')}`;

  return (
    <main className="reset-page">
      <div className="reset-wrapper">
        <header className="reset-header">
          <img src={logo} alt="NodeBank" className="brand-logo" />
          <h2>Convite para uma carteira</h2>
        </header>
        {loading && <p role="status">Carregando convite...</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        {invite && <>
          <p><strong>{invite.ownerName}</strong> convidou você para <strong>{invite.walletName}</strong>.</p>
          <p>E-mail convidado: <strong>{invite.email}</strong></p>
          <p>Acesso: {invite.papel === 'EDITOR' ? 'leitura e escrita' : 'somente leitura'}.</p>
          <p>Válido até {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}.</p>
          {signedIn && sameEmail ? (
            <button className="reset-button" disabled={busy} onClick={accept}>
              {busy ? 'Aceitando...' : 'Aceitar convite e entrar na carteira'}
            </button>
          ) : signedIn ? (
            <><p>Você está conectado com outro e-mail. Entre com {invite.email} para aceitar.</p>
              <button className="reset-button" onClick={switchAccount}>Trocar de conta</button></>
          ) : (
            <><p>Entre com o e-mail convidado para aceitar. Se ainda não tem conta, crie seu cadastro e confirme seu e-mail. Ao entrar, você voltará para este convite.</p>
              <div className="back-link-wrapper"><Link to="/login">Já tenho conta: entrar</Link></div>
              <div className="back-link-wrapper"><Link to={registerUrl}>Aceitar e criar minha conta</Link></div></>
          )}
        </>}
        <div className="back-link-wrapper"><Link to={signedIn ? '/carteiras' : '/login'} onClick={forgetInvitation}>Voltar</Link></div>
      </div>
    </main>
  );
}
