import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Admin.css';

const HOST_HOME_URL = 'https://quote-request-form-five.vercel.app/host';

// 상태 정의
const STATUS_OPTIONS = [
  { value: 'waiting', label: '대기', color: '#6b7280' },
  { value: 'in_progress', label: '호스트 소통 진행 중', color: '#f59e0b' },
  { value: 'rejected', label: '호스트 거절', color: '#ef4444' },
  { value: 'quote_registered', label: '견적서 등록 완료', color: '#3b82f6' },
  { value: 'quote_sent', label: '견적서 발송 완료', color: '#10b981' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'online', label: '온라인결제' },
  { value: 'onsite', label: '현장결제' },
];

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [hostQuote, setHostQuote] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingEmail, setSendingEmail] = useState({});
  const [stripeLink, setStripeLink] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadData();
      } else {
        navigate('/admin/login');
      }
      setIsAuthChecking(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/admin/login');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load quote requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      const mapped = requestsData.map((item) => ({
        id: item.id,
        email: item.email,
        phone: item.phone,
        desiredDate: item.desired_date,
        desiredTime: item.desired_time,
        numberOfPeople: item.number_of_people,
        requests: item.requests,
        submittedAt: item.created_at,
        assignedHostId: item.assigned_host_id,
        selectedSpaces: item.selected_spaces ? JSON.parse(item.selected_spaces) : [],
        status: item.status || 'waiting',
      }));

      setRequests(mapped);

      // Load hosts from profiles table
      const { data: hostsData } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('created_at', { ascending: false });

      setHosts(hostsData || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHostQuote = async (requestId) => {
    try {
      const { data, error } = await supabase
        .from('host_quotes')
        .select('*')
        .eq('quote_request_id', requestId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setHostQuote(data || null);
      setStripeLink(data?.stripe_link || '');
    } catch (err) {
      console.error('Error loading host quote:', err);
      setHostQuote(null);
    }
  };

  const handleSelectRequest = async (req) => {
    setSelectedRequest(req);
    setHostQuote(null);
    setStripeLink('');
    await loadHostQuote(req.id);
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));
      }

      alert('상태가 변경되었습니다.');
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`상태 변경 오류: ${err.message}`);
    }
  };

  // 필터링된 요청 목록
  const filteredRequests = requests.filter(req => {
    // 상태 필터
    if (statusFilter !== 'all' && req.status !== statusFilter) {
      return false;
    }
    // 결제수단 필터는 hostQuote 정보가 필요하므로 서버에서 처리하거나 로컬에서 처리
    // 일단은 기본 필터만 적용
    return true;
  });

  const getStatusLabel = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : '대기';
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.color : '#6b7280';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const assignHost = async (requestId, hostId) => {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (hostId && !uuidRegex.test(hostId)) {
        alert('올바른 호스트 ID 형식이 아닙니다. (UUID 형식 필요)');
        return;
      }

      const { error } = await supabase
        .from('quote_requests')
        .update({ assigned_host_id: hostId || null })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, assignedHostId: hostId } : req
      ));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, assignedHostId: hostId }));
      }

      alert('호스트가 연결되었습니다.');
    } catch (err) {
      console.error('Error assigning host:', err);
      alert(`호스트 연결 오류: ${err.message}`);
    }
  };

  const updateStripeLink = async () => {
    if (!hostQuote) return;

    try {
      const { error } = await supabase
        .from('host_quotes')
        .update({ stripe_link: stripeLink })
        .eq('id', hostQuote.id);

      if (error) throw error;

      setHostQuote(prev => ({ ...prev, stripe_link: stripeLink }));
      alert('Stripe 링크가 저장되었습니다.');
    } catch (err) {
      console.error('Error updating stripe link:', err);
      alert('Stripe 링크 저장 중 오류가 발생했습니다.');
    }
  };

  const sendQuoteToGuest = async () => {
    if (!hostQuote || !selectedRequest) return;

    // Check if online payment requires stripe link
    if (hostQuote.payment_method === 'online' && !stripeLink) {
      alert('온라인결제 선택 시 Stripe 링크가 필요합니다.');
      return;
    }

    setIsSendingQuote(true);

    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestEmail: selectedRequest.email,
          spaceName: selectedRequest.selectedSpaces?.[0]?.name || '공간',
          spacePhotoUrl: hostQuote.space_photo_url,
          price: hostQuote.price?.toLocaleString(),
          currency: hostQuote.currency,
          priceIncludes: hostQuote.price_includes,
          paymentMethod: hostQuote.payment_method,
          stripeLink: hostQuote.payment_method === 'online' ? stripeLink : null,
          desiredDate: selectedRequest.desiredDate,
          desiredTime: selectedRequest.desiredTime,
        }),
      });

      if (!response.ok) {
        throw new Error('견적서 발송 실패');
      }

      // Update quote status
      await supabase
        .from('host_quotes')
        .update({ status: 'sent' })
        .eq('id', hostQuote.id);

      // Update quote_requests status to 'quote_sent'
      await supabase
        .from('quote_requests')
        .update({ status: 'quote_sent' })
        .eq('id', selectedRequest.id);

      setHostQuote(prev => ({ ...prev, status: 'sent' }));

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === selectedRequest.id ? { ...req, status: 'quote_sent' } : req
      ));
      setSelectedRequest(prev => ({ ...prev, status: 'quote_sent' }));

      alert('게스트에게 견적서가 발송되었습니다.');
    } catch (err) {
      console.error('Error sending quote:', err);
      alert('견적서 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  const sendEmailToHost = async (space, guestInfo) => {
    if (!space.hostEmail) {
      alert('호스트 이메일이 없습니다.');
      return;
    }

    const emailKey = `${selectedRequest.id}-${space.id}`;
    setSendingEmail((prev) => ({ ...prev, [emailKey]: true }));

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: space.hostEmail,
          spaceName: space.name,
          guestEmail: guestInfo.email,
          guestPhone: guestInfo.phone,
          desiredDate: guestInfo.desiredDate,
          desiredTime: guestInfo.desiredTime,
          numberOfPeople: guestInfo.numberOfPeople,
          guestRequests: guestInfo.requests,
          hostHomeUrl: HOST_HOME_URL,
        }),
      });

      if (!response.ok) {
        throw new Error('이메일 발송 실패');
      }

      alert(`${space.hostEmail}로 이메일이 발송되었습니다.`);
    } catch (err) {
      console.error('Email send error:', err);
      alert('이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setSendingEmail((prev) => ({ ...prev, [emailKey]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price, currency) => {
    if (!price) return '-';
    const symbols = { KRW: '원', USD: '$', GBP: '£', JPY: '¥', EUR: '€' };
    const symbol = symbols[currency] || currency;
    return currency === 'KRW' ? `${price.toLocaleString()}${symbol}` : `${symbol}${price.toLocaleString()}`;
  };

  if (isAuthChecking) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>견적 요청 관리</h1>
        <div className="header-actions">
          <span className="user-info">{user.user_metadata?.name || user.email}</span>
          <button className="refresh-btn" onClick={loadData} disabled={isLoading}>
            {isLoading ? '로딩 중...' : '새로고침'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="requests-list">
          <div className="list-header">
            <h2>요청 목록 ({filteredRequests.length}건)</h2>
          </div>

          <div className="filter-section">
            <div className="filter-group">
              <label>상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">전체</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>결제수단</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="filter-select"
              >
                {PAYMENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadData}>다시 시도</button>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <p>아직 견적 요청이 없습니다.</p>
            </div>
          ) : (
            <ul className="request-items">
              {filteredRequests.map((req) => (
                <li
                  key={req.id}
                  className={`request-item ${selectedRequest?.id === req.id ? 'active' : ''}`}
                  onClick={() => handleSelectRequest(req)}
                >
                  <div className="request-summary">
                    <span className="request-email">{req.email}</span>
                    <span className="request-date">{formatDate(req.submittedAt)}</span>
                  </div>
                  <div className="request-info">
                    <span>{req.desiredDate} {req.desiredTime}</span>
                    <span>{req.numberOfPeople}명</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(req.status), color: '#fff' }}
                    >
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="request-detail">
          {selectedRequest ? (
            <>
              <div className="detail-header">
                <h2>상세 정보</h2>
              </div>

              <div className="detail-content">
                {/* 상태 관리 섹션 */}
                <div className="detail-section status-management">
                  <h3>견적 현황</h3>
                  <div className="status-change-row">
                    <select
                      className="status-select"
                      value={selectedRequest.status || 'waiting'}
                      onChange={(e) => {
                        setSelectedRequest(prev => ({ ...prev, status: e.target.value }));
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      className="status-change-btn"
                      onClick={() => updateRequestStatus(selectedRequest.id, selectedRequest.status)}
                    >
                      상태 변경
                    </button>
                  </div>
                  <div className="current-status">
                    현재 상태:
                    <span
                      className="status-badge-large"
                      style={{ backgroundColor: getStatusColor(selectedRequest.status || 'waiting') }}
                    >
                      {getStatusLabel(selectedRequest.status || 'waiting')}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>연락처 정보</h3>
                  <div className="detail-row">
                    <label>이메일</label>
                    <span>{selectedRequest.email}</span>
                  </div>
                  <div className="detail-row">
                    <label>연락처</label>
                    <span>{selectedRequest.phone}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>이용 정보</h3>
                  <div className="detail-row">
                    <label>이용 날짜</label>
                    <span>{selectedRequest.desiredDate}</span>
                  </div>
                  <div className="detail-row">
                    <label>이용 시간</label>
                    <span>{selectedRequest.desiredTime}</span>
                  </div>
                  <div className="detail-row">
                    <label>인원 수</label>
                    <span>{selectedRequest.numberOfPeople}명</span>
                  </div>
                </div>

                {selectedRequest.requests && (
                  <div className="detail-section">
                    <h3>요청사항</h3>
                    <p className="request-text">{selectedRequest.requests}</p>
                  </div>
                )}

                {/* Host Assignment Section */}
                <div className="detail-section">
                  <h3>호스트 연결</h3>
                  <div className="host-assignment">
                    <select
                      className="host-select"
                      value={selectedRequest.assignedHostId || ''}
                      onChange={(e) => {
                        setSelectedRequest(prev => ({ ...prev, assignedHostId: e.target.value }));
                      }}
                    >
                      <option value="">호스트 선택</option>
                      {hosts.map((host) => (
                        <option key={host.id} value={host.id}>
                          {host.email}{host.name ? ` (${host.name})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      className="assign-btn"
                      onClick={() => assignHost(selectedRequest.id, selectedRequest.assignedHostId)}
                    >
                      연결
                    </button>
                  </div>
                  {hosts.length === 0 && (
                    <p className="hint-text">등록된 호스트가 없습니다. 호스트가 먼저 가입해야 합니다.</p>
                  )}
                </div>

                {/* Host Quote Section */}
                {hostQuote && (
                  <div className="detail-section host-quote-section">
                    <h3>
                      호스트 견적
                      {hostQuote.status === 'sent' && <span className="sent-badge">발송완료</span>}
                      {hostQuote.status === 'pending' && hostQuote.payment_method === 'online' && (
                        <span className="waiting-badge">결제링크 대기</span>
                      )}
                    </h3>

                    {hostQuote.space_photo_url && (
                      <div className="quote-photo">
                        <img src={hostQuote.space_photo_url} alt="공간 사진" />
                      </div>
                    )}

                    <div className="quote-info">
                      <div className="detail-row">
                        <label>견적 금액</label>
                        <span className="price">{formatPrice(hostQuote.price, hostQuote.currency)}</span>
                      </div>
                      <div className="detail-row">
                        <label>결제 방식</label>
                        <span>{hostQuote.payment_method === 'online' ? '온라인결제' : '현장결제'}</span>
                      </div>
                      {hostQuote.price_includes && (
                        <div className="detail-row">
                          <label>포함 항목</label>
                          <span>{hostQuote.price_includes}</span>
                        </div>
                      )}
                    </div>

                    {/* 현장결제: 호스트가 이미 발송했으므로 상태만 표시 */}
                    {hostQuote.payment_method === 'onsite' && hostQuote.status === 'sent' && (
                      <div className="onsite-sent-notice">
                        호스트가 게스트에게 견적서를 발송했습니다.
                      </div>
                    )}

                    {/* 온라인결제: 관리자가 결제링크 추가 후 발송 */}
                    {hostQuote.payment_method === 'online' && hostQuote.status !== 'sent' && (
                      <>
                        <div className="stripe-section">
                          <label>Stripe Payment Link</label>
                          <div className="stripe-input-row">
                            <input
                              type="url"
                              placeholder="https://buy.stripe.com/..."
                              value={stripeLink}
                              onChange={(e) => setStripeLink(e.target.value)}
                              className="stripe-input"
                            />
                            <button className="save-stripe-btn" onClick={updateStripeLink}>
                              저장
                            </button>
                          </div>
                        </div>

                        <button
                          className="send-quote-btn"
                          onClick={sendQuoteToGuest}
                          disabled={isSendingQuote || !stripeLink}
                        >
                          {isSendingQuote ? '발송 중...' : '게스트에게 견적서 발송'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {selectedRequest.selectedSpaces?.length > 0 && (
                  <div className="detail-section">
                    <h3>선택된 공간 ({selectedRequest.selectedSpaces.length}개)</h3>
                    <div className="selected-spaces-list">
                      {selectedRequest.selectedSpaces.map((space, index) => {
                        const emailKey = `${selectedRequest.id}-${space.id}`;
                        const isSending = sendingEmail[emailKey];
                        return (
                          <div key={index} className="space-item">
                            <div className="space-info">
                              <span className="space-name">{space.name}</span>
                              <span className="space-details">
                                {space.region} · {space.capacity}명 · {space.price}
                              </span>
                              <span className="host-email">
                                호스트: {space.hostEmail || '이메일 없음'}
                              </span>
                            </div>
                            <button
                              className="email-btn"
                              onClick={() => sendEmailToHost(space, selectedRequest)}
                              disabled={!space.hostEmail || isSending}
                            >
                              {isSending ? '발송 중...' : '호스트에게 알림'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h3>요청 일시</h3>
                  <span>{formatDate(selectedRequest.submittedAt)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <p>요청을 선택하면 상세 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
