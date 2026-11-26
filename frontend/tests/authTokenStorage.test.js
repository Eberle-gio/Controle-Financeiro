import test from 'node:test';
import assert from 'node:assert/strict';
import { attachAccessToken, getAccessToken, saveAuthTokens } from '../src/services/authTokenStorage.js';

let activeTabStorage = new Map();
globalThis.sessionStorage = {
  getItem: key => activeTabStorage.get(key) ?? null,
  setItem: (key, value) => activeTabStorage.set(key, String(value)),
  removeItem: key => activeTabStorage.delete(key),
};

test('cada aba envia o Bearer associado ao proprio sessionStorage', () => {
  const tabA = new Map();
  const tabB = new Map();

  activeTabStorage = tabA;
  saveAuthTokens({ accessToken: 'access-a', refreshToken: 'refresh-a' });
  const requestA = attachAccessToken({ headers: {} });

  activeTabStorage = tabB;
  saveAuthTokens({ accessToken: 'access-b', refreshToken: 'refresh-b' });
  const requestB = attachAccessToken({ headers: {} });

  activeTabStorage = tabA;
  assert.equal(getAccessToken(), 'access-a');
  assert.equal(requestA.headers.Authorization, 'Bearer access-a');
  activeTabStorage = tabB;
  assert.equal(getAccessToken(), 'access-b');
  assert.equal(requestB.headers.Authorization, 'Bearer access-b');
});