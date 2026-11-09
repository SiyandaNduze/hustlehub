import { useId } from 'react';

// Accessible form field: the label, hint and error are linked to the input
// (aria-describedby) and invalid inputs are flagged with aria-invalid.
export default function Field({ label, error, hint, as = 'input', id, children, ...inputProps }) {
  const autoId = useId();
  const inputId = id || autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const Control = as;

  return (
    <div className={`field${error ? ' field-invalid' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      <Control id={inputId} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...inputProps}>
        {children}
      </Control>
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
