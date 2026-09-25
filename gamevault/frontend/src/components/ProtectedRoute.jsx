import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Hides pages from users who aren't allowed to see them.
 * This is only for user experience: the API enforces the real access rules.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="state">Checking your session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <section className="state">
        <h1>Admins only</h1>
        <p>Your account doesn&apos;t have access to this page.</p>
      </section>
    );
  }
  return children;
}
