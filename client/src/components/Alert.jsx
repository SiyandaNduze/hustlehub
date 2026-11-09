// role="alert" for errors (announced immediately), role="status" for success.
export default function Alert({ type = 'error', children }) {
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`alert alert-${type}`}>
      {children}
    </div>
  );
}

// Shows an ApiError: friendly message plus any field problems that are not
// already shown next to their own input (pass those names in `shownFields`).
export function ApiErrorAlert({ error, shownFields = [] }) {
  if (!error) return null;
  const fields = (Array.isArray(error.fieldErrors) ? error.fieldErrors : []).filter(
    (f) => !shownFields.includes(f.field)
  );
  return (
    <Alert>
      <p>{error.message}</p>
      {fields.length > 0 && (
        <ul>
          {fields.map((f, i) => (
            <li key={`${f.field}-${i}`}>{f.message}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}
