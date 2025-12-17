import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HostHeader from './HostHeader';
import TemplateSettingsModal from './TemplateSettingsModal';
import './HostDashboard.css';

function HostDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [requests, setRequests] = useState([]);
  const [hostQuotes, setHostQuotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadData(session.user.id);
      } else {
        navigate('/host');
      }
      setIsAuthChecking(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/host');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async (userId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load quote requests assigned to this host
      const { data: requestsData, error: requestsError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('assigned_host_id', userId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Load host's quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('host_quotes')
        .select('*')
        .eq('host_id', userId);

      if (quotesError) throw quotesError;

      // Map quotes by quote_request_id for easy lookup
      const quotesMap = {};
      quotesData?.forEach((quote) => {
        quotesMap[quote.quote_request_id] = quote;
      });

      // Load host's template (don't throw if not found)
      const { data: templateData } = await supabase
        .from('host_quote_templates')
        .select('*')
        .eq('host_id', userId)
        .maybeSingle();

      setRequests(requestsData || []);
      setHostQuotes(quotesMap);
      setTemplate(templateData || null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`데이터를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (requestId) => {
    const quote = hostQuotes[requestId];
    if (!quote) {
      return <span className="status-badge pending">견적 대기</span>;
    }
    if (quote.status === 'sent') {
      return <span className="status-badge sent">발송 완료</span>;
    }
    if (quote.status === 'approved') {
      return <span className="status-badge approved">승인됨</span>;
    }
    // pending 상태일 때 결제 방식에 따라 다르게 표시
    if (quote.payment_method === 'online') {
      return <span className="status-badge waiting-admin">관리자 확인 중</span>;
    }
    return <span className="status-badge registered">등록 완료</span>;
  };

  if (isAuthChecking) {
    return (
      <div className="host-dashboard-container">
        <div className="loading-state">
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="host-dashboard-container">
      <HostHeader user={user} />

      <div className="dashboard-subheader">
        <h1>견적 요청 관리</h1>
        <button
          className="template-settings-btn"
          onClick={() => setShowTemplateModal(true)}
        >
          기본 견적서 설정
        </button>
      </div>

      <main className="dashboard-main">
        {isLoading ? (
          <div className="loading-state">
            <p>데이터를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => loadData(user.id)}>다시 시도</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>할당된 견적 요청이 없습니다</h2>
            <p>관리자가 견적 요청을 할당하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="card-header">
                  <span className="request-date">{formatDate(request.created_at)}</span>
                  {getStatusBadge(request.id)}
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="info-label">게스트 이메일</span>
                    <span className="info-value">{request.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">희망 날짜</span>
                    <span className="info-value">{request.desired_date || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">희망 시간</span>
                    <span className="info-value">{request.desired_time || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">인원</span>
                    <span className="info-value">{request.number_of_people}명</span>
                  </div>
                  {request.requests && (
                    <div className="info-row requests-row">
                      <span className="info-label">요청사항</span>
                      <span className="info-value">{request.requests}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {hostQuotes[request.id] ? (
                    <Link
                      to={`/host/quote/${request.id}`}
                      className="view-quote-btn"
                    >
                      견적 확인
                    </Link>
                  ) : (
                    <Link
                      to={`/host/quote/${request.id}`}
                      className="create-quote-btn"
                    >
                      견적 등록하기
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showTemplateModal && (
        <TemplateSettingsModal
          template={template}
          userId={user.id}
          onClose={() => setShowTemplateModal(false)}
          onSave={(newTemplate) => {
            setTemplate(newTemplate);
            setShowTemplateModal(false);
          }}
        />
      )}
    </div>
  );
}

export default HostDashboard;
