import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="state">
      <h1>Page not found</h1>
      <p>That address doesn&apos;t match anything in the vault.</p>
      <Link to="/" className="btn">Browse games</Link>
    </section>
  );
}
