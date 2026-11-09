export default function Loading({ label = 'Loading' }) {
  return (
    <p className="muted loading" role="status">
      {label}…
    </p>
  );
}
