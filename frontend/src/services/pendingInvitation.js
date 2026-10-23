const key = 'pending_wallet_invitation';
export function rememberInvitation(token) {
  if (/^[a-f0-9]{64}$/.test(token || '')) localStorage.setItem(key, token);
}
export function pendingInvitationPath() {
  const token = localStorage.getItem(key);
  return /^[a-f0-9]{64}$/.test(token || '') ? `/convites/${token}` : '/dashboard';
}
export function forgetInvitation() { localStorage.removeItem(key); }
