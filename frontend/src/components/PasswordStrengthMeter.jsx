import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_PASSWORD_UTF8_BYTES,
  getPasswordUtf8ByteLength,
} from '../utils/passwordPolicy';
import './PasswordStrengthMeter.css';

export default function PasswordStrengthMeter({ password = '' }) {
  const minimumMet = password.length >= MIN_PASSWORD_LENGTH;
  const maximumLengthMet = password.length <= MAX_PASSWORD_LENGTH;
  const maximumBytesMet = getPasswordUtf8ByteLength(password) <= MAX_PASSWORD_UTF8_BYTES;
  const valid = minimumMet && maximumLengthMet && maximumBytesMet;
  const progress = Math.min(100, (password.length / MIN_PASSWORD_LENGTH) * 100);

  return (
    <div className="password-strength-meter" aria-live="polite">
      <div
        className="strength-bar-bg"
        role="progressbar"
        aria-label="Progresso do tamanho mínimo da senha"
        aria-valuemin={0}
        aria-valuemax={MIN_PASSWORD_LENGTH}
        aria-valuenow={Math.min(password.length, MIN_PASSWORD_LENGTH)}
      >
        <div
          className={`strength-bar-fill ${valid ? 'is-valid' : 'is-incomplete'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className={`strength-label ${valid ? 'is-valid' : 'is-incomplete'}`}>
        {valid ? 'Senha atende aos requisitos.' : 'Para aceitar a senha, falta:'}
      </p>
      <ul className="password-requirements">
        <li className={minimumMet ? 'requirement-met' : 'requirement-missing'}>
          <span aria-hidden="true">{minimumMet ? '✓' : '○'}</span>
          Pelo menos {MIN_PASSWORD_LENGTH} caracteres
          <span className="requirement-count">{password.length}/{MIN_PASSWORD_LENGTH}</span>
        </li>
        <li className={maximumLengthMet ? 'requirement-met' : 'requirement-missing'}>
          <span aria-hidden="true">{maximumLengthMet ? '✓' : '○'}</span>
          No máximo {MAX_PASSWORD_LENGTH} caracteres
        </li>
        <li className={maximumBytesMet ? 'requirement-met' : 'requirement-missing'}>
          <span aria-hidden="true">{maximumBytesMet ? '✓' : '○'}</span>
          No máximo {MAX_PASSWORD_UTF8_BYTES} bytes em UTF-8
          <span className="requirement-count">{getPasswordUtf8ByteLength(password)}/{MAX_PASSWORD_UTF8_BYTES}</span>
        </li>
      </ul>
      <span className="password-tip">
        Uma frase longa, fácil de lembrar e difícil de adivinhar, ajuda a proteger sua conta.
      </span>
    </div>
  );
}
