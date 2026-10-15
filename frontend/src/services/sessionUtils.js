export function decodeJwt(token) {
  const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function tokenIsCurrent(token) {
  try {
    const payload = decodeJwt(token);
    return Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
