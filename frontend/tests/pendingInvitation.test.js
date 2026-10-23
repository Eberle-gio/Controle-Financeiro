import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberInvitation, pendingInvitationPath, forgetInvitation } from '../src/services/pendingInvitation.js';

test('cadastro e login retomam somente um caminho interno de convite valido', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  assert.equal(pendingInvitationPath(), '/dashboard');
  rememberInvitation('https://externo.example');
  assert.equal(pendingInvitationPath(), '/dashboard');
  const token = 'a'.repeat(64);
  rememberInvitation(token);
  assert.equal(pendingInvitationPath(), `/convites/${token}`);
  forgetInvitation();
  assert.equal(pendingInvitationPath(), '/dashboard');
});
