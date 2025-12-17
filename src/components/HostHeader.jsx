import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './HostHeader.css';

function HostHeader({ user, onLoginClick }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/host');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="host-header">
      <div className="header-left">
        <Link to="/host" className="header-logo">SpaceCloud Host</Link>
        {user && (
          <nav className="header-nav">
            <Link
              to="/host/quotes"
              className={`nav-link ${isActive('/host/quotes') || location.pathname.startsWith('/host/quote/') ? 'active' : ''}`}
            >
              견적 요청 관리
            </Link>
            <Link
              to="/host/dashboard"
              className={`nav-link ${location.pathname === '/host/dashboard' ? 'active' : ''}`}
            >
              예약/정산 관리
            </Link>
          </nav>
        )}
      </div>
      <div className="header-right">
        {user ? (
          <>
            <span className="user-info">{user?.user_metadata?.name || user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <button className="login-btn" onClick={onLoginClick}>로그인</button>
        )}
      </div>
    </header>
  );
}

export default HostHeader;
