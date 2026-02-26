import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Demo App
        </Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
        </nav>
        <div className="auth-section">
          {isAuthenticated ? (
            <>
              <span className="user-name">{user?.name}</span>
              <button onClick={logout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <button className="btn-login">Login</button>
          )}
        </div>
      </div>
    </header>
  );
}
