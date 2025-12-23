import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidCountry, DEFAULT_COUNTRY, getCountryConfig, t } from '../lib/countryConfig';
import HostHeader from './HostHeader';
import HostAuthModal from './HostAuthModal';
import TemplateSettingsModal from './TemplateSettingsModal';
import './HostHome.css';

function HostHome() {
  const navigate = useNavigate();
  const { country } = useParams();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState(null);

  // 유효하지 않은 국가 코드인 경우 기본 국가로 리다이렉트
  useEffect(() => {
    if (!isValidCountry(country)) {
      navigate(`/host/${DEFAULT_COUNTRY}`, { replace: true });
    }
  }, [country, navigate]);

  const countryConfig = getCountryConfig(country);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsAuthChecking(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load template when user is authenticated
  useEffect(() => {
    const loadTemplate = async () => {
      if (user) {
        const { data } = await supabase
          .from('host_quote_templates')
          .select('*')
          .eq('host_id', user.id)
          .maybeSingle();
        setTemplate(data || null);
      }
    };
    loadTemplate();
  }, [user]);

  const handleQuoteButtonClick = () => {
    if (user) {
      setShowTemplateModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="host-home-container">
      <HostHeader user={user} onLoginClick={() => setShowAuthModal(true)} country={country} />

      <main className="host-main">
        <div className="host-hero">
          <h2 className="host-title">{t(country, 'heroTitle')}</h2>
          <p className="host-description">
            {t(country, 'heroDescription').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>

          <div className="host-features">
            <div className="feature-item">
              <span className="feature-icon">📩</span>
              <div className="feature-text">
                <h3>{t(country, 'featureRequestTitle')}</h3>
                <p>{t(country, 'featureRequestDesc')}</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <div className="feature-text">
                <h3>{t(country, 'featureWriteTitle')}</h3>
                <p>{t(country, 'featureWriteDesc')}</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📤</span>
              <div className="feature-text">
                <h3>{t(country, 'featureSendTitle')}</h3>
                <p>{t(country, 'featureSendDesc')}</p>
              </div>
            </div>
          </div>

          <button
            className="host-cta-btn"
            onClick={handleQuoteButtonClick}
            disabled={isAuthChecking}
          >
            {t(country, 'registerQuote')}
          </button>

          {!user && (
            <p className="host-login-hint">
              {t(country, 'loginHint')}
            </p>
          )}
        </div>
      </main>

      {showAuthModal && (
        <HostAuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showTemplateModal && (
        <TemplateSettingsModal
          template={template}
          userId={user.id}
          onClose={() => setShowTemplateModal(false)}
          onSave={(newTemplate) => {
            setTemplate(newTemplate);
            setShowTemplateModal(false);
            navigate(`/host/${country}/quotes`);
          }}
          country={country}
        />
      )}
    </div>
  );
}

export default HostHome;
