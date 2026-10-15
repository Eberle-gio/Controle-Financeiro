import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberWallet, restoreWallet } from '../src/services/walletSelection.js';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
};

test.beforeEach(() => {
  values.clear();
  localStorage.setItem('current_session', JSON.stringify({ user: { id: 1 } }));
});

test('recarregar restaura a carteira escolhida, mesmo mudando a ordem da API', () => {
  rememberWallet({ id: 20 });
  const freshWallet = { id: 20, nome: 'Carteira atualizada' };
  assert.equal(restoreWallet([{ id: 10 }, freshWallet], null), freshWallet);
  assert.equal(restoreWallet([freshWallet, { id: 10 }], null), freshWallet);
});

test('nao reutiliza uma carteira removida ou sem acesso', () => {
  rememberWallet({ id: 20 });
  const allowedWallet = { id: 10 };
  assert.equal(restoreWallet([allowedWallet], { id: 20 }), allowedWallet);
  assert.equal(restoreWallet([], null), null);
});

test('a escolha de um usuario nao altera a carteira de outro', () => {
  rememberWallet({ id: 20 });
  localStorage.setItem('current_session', JSON.stringify({ user: { id: 2 } }));
  assert.equal(restoreWallet([{ id: 10 }, { id: 20 }], null).id, 10);
});

test('atualiza os dados da carteira ativa com a resposta mais recente da API', () => {
  const freshWallet = { id: 20, nome: 'Novo nome', meuPapel: 'VISUALIZADOR' };
  assert.equal(restoreWallet([freshWallet], { id: 20, meuPapel: 'DONO' }), freshWallet);
});
