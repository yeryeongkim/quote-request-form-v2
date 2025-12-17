import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HostHeader from './HostHeader';
import HostAuthModal from './HostAuthModal';
import TemplateSettingsModal from './TemplateSettingsModal';
import './HostHome.css';

function HostHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState(null);

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
      <HostHeader user={user} onLoginClick={() => setShowAuthModal(true)} />

      <main className="host-main">
        <div className="host-hero">
          <h2 className="host-title">게스트에게 견적서를 보내세요</h2>
          <p className="host-description">
            SpaceCloud에서 공간을 검색한 게스트가 견적 요청을 보내면,<br />
            호스트님께서 직접 견적서를 작성하여 회신할 수 있습니다.
          </p>

          <div className="host-features">
            <div className="feature-item">
              <span className="feature-icon">📩</span>
              <div className="feature-text">
                <h3>견적 요청 확인</h3>
                <p>이메일로 게스트의 견적 요청을 받아보세요</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <div className="feature-text">
                <h3>견적서 작성</h3>
                <p>공간 이용료, 옵션 등 상세 견적을 작성하세요</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📤</span>
              <div className="feature-text">
                <h3>견적서 발송</h3>
                <p>작성한 견적서를 게스트에게 바로 전달하세요</p>
              </div>
            </div>
          </div>

          <button
            className="host-cta-btn"
            onClick={handleQuoteButtonClick}
            disabled={isAuthChecking}
          >
            견적서 등록하기
          </button>

          {!user && (
            <p className="host-login-hint">
              로그인 후 견적서를 등록할 수 있습니다
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
            navigate('/host/quotes');
          }}
        />
      )}
    </div>
  );
}

export default HostHome;
