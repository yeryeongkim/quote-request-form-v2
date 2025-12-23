import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidCountry, DEFAULT_COUNTRY, getCountryConfig, t, formatDate as formatDateUtil } from '../lib/countryConfig';
import HostHeader from './HostHeader';
import TemplateSettingsModal from './TemplateSettingsModal';
import './HostDashboard.css';

function HostDashboard() {
  const navigate = useNavigate();
  const { country } = useParams();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [requests, setRequests] = useState([]);
  const [hostQuotes, setHostQuotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState(null);

  // 유효하지 않은 국가 코드인 경우 기본 국가로 리다이렉트
  useEffect(() => {
    if (!isValidCountry(country)) {
      navigate(`/host/${DEFAULT_COUNTRY}/quotes`, { replace: true });
    }
  }, [country, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadData(session.user.id);
      } else {
        navigate(`/host/${country || DEFAULT_COUNTRY}`);
      }
      setIsAuthChecking(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate(`/host/${country || DEFAULT_COUNTRY}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, country]);

  const loadData = async (userId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load quote requests assigned to this host and filtered by country
      const { data: requestsData, error: requestsError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('assigned_host_id', userId)
        .eq('country', country)
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
      setError(`${t(country, 'loadDataError')}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateUtil(dateString, country);
  };

  const getStatusBadge = (requestId) => {
    const quote = hostQuotes[requestId];
    if (!quote) {
      return <span className="status-badge pending">{t(country, 'statusPending')}</span>;
    }
    if (quote.status === 'sent') {
      return <span className="status-badge sent">{t(country, 'statusSent')}</span>;
    }
    if (quote.status === 'approved') {
      return <span className="status-badge approved">{t(country, 'statusApproved')}</span>;
    }
    // pending 상태일 때 결제 방식에 따라 다르게 표시
    if (quote.payment_method === 'online') {
      return <span className="status-badge waiting-admin">{t(country, 'statusWaitingAdmin')}</span>;
    }
    return <span className="status-badge registered">{t(country, 'statusRegistered')}</span>;
  };

  if (isAuthChecking) {
    return (
      <div className="host-dashboard-container">
        <div className="loading-state">
          <p>{t(country, 'authChecking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="host-dashboard-container">
      <HostHeader user={user} country={country} />

      <div className="dashboard-subheader">
        <h1>{t(country, 'quoteRequestManagement')}</h1>
        <button
          className="template-settings-btn"
          onClick={() => setShowTemplateModal(true)}
        >
          {t(country, 'templateSettings')}
        </button>
      </div>

      <main className="dashboard-main">
        {isLoading ? (
          <div className="loading-state">
            <p>{t(country, 'loading')}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => loadData(user.id)}>{t(country, 'retry')}</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>{t(country, 'noAssignedRequests')}</h2>
            <p>{t(country, 'noAssignedRequestsDesc')}</p>
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
                    <span className="info-label">{t(country, 'guestEmail')}</span>
                    <span className="info-value">{request.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t(country, 'desiredDate')}</span>
                    <span className="info-value">{request.desired_date || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t(country, 'desiredTime')}</span>
                    <span className="info-value">{request.desired_time || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t(country, 'numberOfPeople')}</span>
                    <span className="info-value">{request.number_of_people}{t(country, 'peopleUnit')}</span>
                  </div>
                  {request.requests && (
                    <div className="info-row requests-row">
                      <span className="info-label">{t(country, 'specialRequests')}</span>
                      <span className="info-value">{request.requests}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {hostQuotes[request.id] ? (
                    <Link
                      to={`/host/${country}/quote/${request.id}`}
                      className="view-quote-btn"
                    >
                      {t(country, 'viewQuote')}
                    </Link>
                  ) : (
                    <Link
                      to={`/host/${country}/quote/${request.id}`}
                      className="create-quote-btn"
                    >
                      {t(country, 'createQuote')}
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
          country={country}
        />
      )}
    </div>
  );
}

export default HostDashboard;
