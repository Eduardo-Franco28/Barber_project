export function Field({ label, error, ...inputProps }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className={`field__input${error ? ' field__input--error' : ''}`}
        {...inputProps}
      />
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
