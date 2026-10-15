import { useMemo } from 'react';
import './PasswordStrengthMeter.css';

export default function PasswordStrengthMeter({ password }) {

  const strength = useMemo(() => {
    if (!password) {
      return { score: 0, label: 'Muito Curta', color: '#9ca3af', percent: '0%' };
    }

    let score = 0;
    if (password.length >= 6) {
      score = 1;
    }
    
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    if (password.length >= 6 && hasLetters && hasNumbers) {
      score = 2;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    
    if (password.length >= 8 && hasUpper && hasLower && hasNumbers && hasSpecial) {
      score = 3;
    }

    if (password.length < 6) {
      return { score: 0, label: 'Muito Curta (mínimo 6 chars)', color: '#ef4444', percent: '20%' };
    } else if (score === 1) {
      return { score: 1, label: 'Fraca', color: '#f59e0b', percent: '40%' };
    } else if (score === 2) {
      return { score: 2, label: 'Média', color: '#3b82f6', percent: '70%' };
    } else {
      return { score: 3, label: 'Forte', color: '#10b981', percent: '100%' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="password-strength-meter">
      <div className="strength-bar-bg">
        <div className={`strength-bar-fill score-${strength.score}`}></div>
      </div>
      <span className={`strength-label score-${strength.score}`}>
        Força da senha: <strong>{strength.label}</strong>
      </span>
    </div>
  );
}
