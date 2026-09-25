import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="topbar">
      <nav className="topbar-inner" aria-label="Main">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true" />
          GameVault
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end>Browse</NavLink>
          {user && <NavLink to="/collection">Collection</NavLink>}
          {user && <NavLink to="/wishlist">Wishlist</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </div>
        <div className="nav-account">
          {user ? (
            <>
              <NavLink to="/profile" className="chip">{user.username}</NavLink>
              <button type="button" className="btn ghost small" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="btn small">Create account</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
