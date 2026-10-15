export function walletSelectionKey() {
  try {
    const session = JSON.parse(localStorage.getItem('current_session'));
    const user = session?.user;
    return user?.id || user?.email
      ? `nodebank:active-wallet:${user.id || user.email}`
      : null;
  } catch {
    return null;
  }
}

export function rememberWallet(wallet) {
  try {
    const key = walletSelectionKey();
    if (key && wallet?.id != null) localStorage.setItem(key, String(wallet.id));
  } catch {
    // A indisponibilidade do armazenamento nao impede o uso da carteira.
  }
}

export function restoreWallet(wallets, current) {
  let savedId;
  try {
    const key = walletSelectionKey();
    savedId = key ? localStorage.getItem(key) : null;
  } catch {
    savedId = null;
  }
  return wallets.find(wallet => String(wallet.id) === String(current?.id))
    || wallets.find(wallet => String(wallet.id) === savedId)
    || wallets[0]
    || null;
}
