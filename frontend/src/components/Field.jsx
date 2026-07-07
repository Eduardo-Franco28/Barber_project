import { useState } from 'react';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a13.3 13.3 0 0 1-1.67 2.68" />
      <path d="M6.06 6.06A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 5-1.4" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export function Field({ label, error, type, ...inputProps }) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type;

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="field__control">
        <input
          className={`field__input${error ? ' field__input--error' : ''}${
            isPassword ? ' field__input--with-toggle' : ''
          }`}
          type={inputType}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            data-testid="toggle-password"
            onClick={() => setReveal((current) => !current)}
            aria-label={reveal ? 'Ocultar senha' : 'Mostrar senha'}
            title={reveal ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
