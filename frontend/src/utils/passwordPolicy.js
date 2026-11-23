export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 100;
export const MAX_PASSWORD_UTF8_BYTES = 72;

export function getPasswordUtf8ByteLength(password) {
  return new TextEncoder().encode(password).length;
}

export function getPasswordValidationMessage(password) {
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres`;
  }
  if (getPasswordUtf8ByteLength(password) > MAX_PASSWORD_UTF8_BYTES) {
    return `A senha deve ocupar no máximo ${MAX_PASSWORD_UTF8_BYTES} bytes em UTF-8`;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres`;
  }
  return '';
}
