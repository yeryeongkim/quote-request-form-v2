import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCountryConfig, DEFAULT_COUNTRY, t, COUNTRY_CONFIG } from '../lib/countryConfig';
import './HostHeader.css';

function HostHeader({ user, onLoginClick, country = DEFAULT_COUNTRY }) {
  const location = useLocation();
  const navigate = useNavigate();
  const countryConfig = getCountryConfig(country);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(`/host/${country}`);
  };

  const handleCountryChange = (newCountry) => {
    setIsCountryDropdownOpen(false);
    // Keep the same page path but change the country
    const currentPath = location.pathname;
    const newPath = currentPath.replace(`/host/${country}`, `/host/${newCountry}`);
    navigate(newPath);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const countries = Object.values(COUNTRY_CONFIG);

  return (
    <header className="host-header">
      <div className="header-left">
        <div className="header-logo-wrapper">
          <Link to={`/host/${country}`} className="header-logo">
            {t(country, 'hostPortal')}
          </Link>
          <div className="country-selector" ref={dropdownRef}>
            <button
              className="country-badge-btn"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              aria-expanded={isCountryDropdownOpen}
            >
              {countryConfig.nameEn}
              <span className="dropdown-arrow">{isCountryDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {isCountryDropdownOpen && (
              <div className="country-dropdown">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    className={`country-option ${c.code === country ? 'active' : ''}`}
                    onClick={() => handleCountryChange(c.code)}
                  >
                    <span className="country-name">{c.nameEn}</span>
                    <span className="country-currency">{c.currency} ({c.currencySymbol})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {user && (
          <nav className="header-nav">
            <Link
              to={`/host/${country}/quotes`}
              className={`nav-link ${isActive(`/host/${country}/quotes`) || location.pathname.includes('/quote/') ? 'active' : ''}`}
            >
              {t(country, 'quoteManagement')}
            </Link>
            <Link
              to={`/host/${country}/dashboard`}
              className={`nav-link ${location.pathname === `/host/${country}/dashboard` ? 'active' : ''}`}
            >
              {t(country, 'bookingManagement')}
            </Link>
          </nav>
        )}
      </div>
      <div className="header-right">
        {user ? (
          <>
            <span className="user-info">{user?.user_metadata?.name || user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>{t(country, 'logout')}</button>
          </>
        ) : (
          <button className="login-btn" onClick={onLoginClick}>{t(country, 'login')}</button>
        )}
      </div>
    </header>
  );
}

export default HostHeader;
