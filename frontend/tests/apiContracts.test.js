import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { decodeJwt, tokenIsCurrent } from '../src/services/sessionUtils.js';
import { localDate } from '../src/utils/localDate.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const backend = '../../backend/src/main/java/controle_financeiro/backend/';
function dtoFields(name) {
  return new Set([...read(`${backend}dto/${name}.java`).matchAll(/private\s+[\w<>]+\s+(\w+)\s*(?:=[^;]*)?;/g)].map(match => match[1]));
}

// Verifica os campos realmente acessados nas telas contra os DTOs Java atuais.
for (const [file, variable, dto] of [
  ['../src/pages/Wallets/Wallets.jsx', 'm', 'WalletMemberResponse'],
  ['../src/pages/Wallets/Wallets.jsx', 'c', 'WalletResponse'],
  ['../src/pages/Transactions/Transactions.jsx', 't', 'TransactionResponse'],
  ['../src/pages/Dashboard/Dashboard.jsx', 't', 'TransactionResponse'],
  ['../src/pages/Categories/Categories.jsx', 'c', 'CategoryResponse'],
  ['../src/components/TransactionModal.jsx', 'initialData', 'TransactionResponse'],
]) {
  test(`${file}: campos de ${dto} correspondem ao backend`, () => {
    const fields = dtoFields(dto);
    const accesses = [...read(file).matchAll(new RegExp(`\\b${variable}\\??\\.(\\w+)`, 'g'))];
    assert.ok(accesses.length > 0);
    for (const [, field] of accesses) assert.ok(fields.has(field), `${dto} nao possui ${field}`);
  });
}

test('permissoes oferecidas no formulario existem no enum do backend', () => {
  const enumeration = read(`${backend}model/TipoPermissao.java`);
  const options = [...read('../src/pages/Wallets/Wallets.jsx').matchAll(/<option value="([A-Z_]+)"/g)];
  assert.ok(options.length > 0);
  for (const [, value] of options) assert.match(enumeration, new RegExp(`\\b${value}\\b`));
});

test('JWT Base64URL preserva nomes acentuados e reconhece expiracao', () => {
  const encode = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  const current = encode({ name: 'João Conceição', exp: Math.floor(Date.now() / 1000) + 60 });
  assert.equal(decodeJwt(current).name, 'João Conceição');
  assert.equal(tokenIsCurrent(current), true);
  assert.equal(tokenIsCurrent(encode({ exp: 1 })), false);
  assert.equal(tokenIsCurrent('invalido'), false);
});

test('data do formulario usa o calendario local mesmo quando UTC ja mudou de dia', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'America/Sao_Paulo';
    assert.equal(localDate(new Date('2026-10-16T01:00:00Z')), '2026-10-15');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
