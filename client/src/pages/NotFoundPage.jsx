import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="page page-narrow">
      <h1>Page not found</h1>
      <p>
        There's nothing at this address. <Link to="/">Go to the start page</Link>.
      </p>
    </section>
  );
}
