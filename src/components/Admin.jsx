import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Admin.css';

const HOST_HOME_URL = 'https://quote-request-form-five.vercel.app/host';

// DB 국가명 -> 국가 코드 매핑
const DB_TO_COUNTRY_CODE = {
  '한국 (KOR)': 'korea',
  '영국 (UK)': 'uk',
  '미국 (USA)': 'usa',
  '일본 (JPN)': 'japan',
  '캐나다 (CAN)': 'canada',
};

// 상태 정의
const STATUS_OPTIONS = [
  { value: 'waiting', label: '대기', color: '#6b7280' },
  { value: 'in_progress', label: '호스트 소통 진행 중', color: '#f59e0b' },
  { value: 'rejected', label: '호스트 거절', color: '#ef4444' },
  { value: 'quote_registered', label: '견적서 등록 완료', color: '#3b82f6' },
  { value: 'quote_sent', label: '견적서 발송 완료', color: '#10b981' },
  { value: 'booking_confirmed', label: '예약확정', color: '#8b5cf6' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'online', label: '온라인결제' },
  { value: 'onsite', label: '현장결제' },
];

// 이관 신청 상태 정의
const MIGRATION_STATUS_OPTIONS = [
  { value: 'pending', label: '대기 중', color: '#f59e0b' },
  { value: 'approved', label: '승인', color: '#10b981' },
  { value: 'rejected', label: '거절', color: '#ef4444' },
];

// 정산 상태 정의
const SETTLEMENT_STATUS_OPTIONS = [
  { value: 'pending', label: '정산 대기', color: '#f59e0b' },
  { value: 'completed', label: '정산 완료', color: '#10b981' },
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
  const [adminMemo, setAdminMemo] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // 탭 상태
  const [activeTab, setActiveTab] = useState('quotes'); // 'quotes' or 'migrations'

  // 이관 신청 상태
  const [migrationRequests, setMigrationRequests] = useState([]);
  const [selectedMigration, setSelectedMigration] = useState(null);
  const [migrationStatusFilter, setMigrationStatusFilter] = useState('all');

  // 예약/정산 상태
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('all');

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

      // Load host_quotes for payment_method and space_name mapping
      const { data: quotesData } = await supabase
        .from('host_quotes')
        .select('quote_request_id, payment_method, space_name');

      // Load hosts from profiles table
      const { data: hostsData } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('created_at', { ascending: false });

      const hostsList = hostsData || [];
      setHosts(hostsList);

      // Map requests and auto-assign hosts
      const mapped = await Promise.all(requestsData.map(async (item) => {
        const hostQuote = quotesData?.find(q => q.quote_request_id === item.id);
        const selectedSpaces = item.selected_spaces ? JSON.parse(item.selected_spaces) : [];

        let assignedHostId = item.assigned_host_id;
        let status = item.status || 'waiting';
        let autoAssigned = false;

        // 호스트가 아직 연결되지 않은 경우, 선택된 공간의 호스트 이메일로 자동 연결 시도
        let spaceCountry = item.country; // 기존 country 값 유지
        if (!assignedHostId && selectedSpaces.length > 0) {
          for (const space of selectedSpaces) {
            if (space.hostEmail) {
              const matchedHost = hostsList.find(
                h => h.email?.toLowerCase() === space.hostEmail.toLowerCase()
              );
              if (matchedHost) {
                // 선택된 공간의 국가 코드 추출
                const countryCode = DB_TO_COUNTRY_CODE[space.country] || 'korea';

                // DB에 자동 연결 + 국가 코드 업데이트
                const { error: updateError } = await supabase
                  .from('quote_requests')
                  .update({
                    assigned_host_id: matchedHost.id,
                    status: status === 'waiting' ? 'in_progress' : status,
                    country: countryCode
                  })
                  .eq('id', item.id);

                if (!updateError) {
                  assignedHostId = matchedHost.id;
                  status = status === 'waiting' ? 'in_progress' : status;
                  spaceCountry = countryCode;
                  autoAssigned = true;
                  console.log(`Auto-assigned host ${matchedHost.email} to request ${item.id} (country: ${countryCode})`);
                }
                break; // 첫 번째 매칭된 호스트로 연결
              }
            }
          }
        }

        // 선택된 공간이 있으면 항상 공간의 국가로 country 업데이트
        if (selectedSpaces.length > 0 && selectedSpaces[0].country) {
          const expectedCountry = DB_TO_COUNTRY_CODE[selectedSpaces[0].country] || 'korea';
          // 현재 country와 다르면 업데이트
          if (spaceCountry !== expectedCountry) {
            await supabase
              .from('quote_requests')
              .update({ country: expectedCountry })
              .eq('id', item.id);
            spaceCountry = expectedCountry;
            console.log(`Updated country to ${expectedCountry} for request ${item.id}`);
          }
        }

        return {
          id: item.id,
          email: item.email,
          phone: item.phone,
          desiredDate: item.desired_date,
          desiredTime: item.desired_time,
          numberOfPeople: item.number_of_people,
          requests: item.requests,
          submittedAt: item.created_at,
          assignedHostId: assignedHostId,
          selectedSpaces: selectedSpaces,
          status: status,
          paymentMethod: hostQuote?.payment_method || null,
          spaceName: hostQuote?.space_name || null,
          adminMemo: item.admin_memo || '',
          autoAssigned: autoAssigned,
          country: spaceCountry,
        };
      }));

      setRequests(mapped);

      // Load migration requests
      try {
        const { data: migrationsData, error: migrationsError } = await supabase
          .from('migration_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!migrationsError && migrationsData) {
          setMigrationRequests(migrationsData);
        }
      } catch (migrationErr) {
        console.log('Migration requests table may not exist:', migrationErr);
      }

      // Load bookings with settlements
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*, settlements(*)')
          .order('created_at', { ascending: false });

        if (!bookingsError && bookingsData) {
          // Map bookings with settlement info
          const mappedBookings = bookingsData.map(booking => ({
            ...booking,
            settlement: booking.settlements?.[0] || null,
          }));
          setBookings(mappedBookings);
        }
      } catch (bookingErr) {
        console.log('Bookings table may not exist:', bookingErr);
      }

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
    setAdminMemo(req.adminMemo || '');
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

  const toggleRejected = async (requestId, isRejected) => {
    const newStatus = isRejected ? 'rejected' : 'waiting';
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error toggling rejected:', err);
      alert(`상태 변경 오류: ${err.message}`);
    }
  };

  const saveAdminMemo = async () => {
    if (!selectedRequest) return;

    setIsSavingMemo(true);
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ admin_memo: adminMemo })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setRequests(prev => prev.map(req =>
        req.id === selectedRequest.id ? { ...req, adminMemo } : req
      ));
      setSelectedRequest(prev => ({ ...prev, adminMemo }));

      alert('메모가 저장되었습니다.');
    } catch (err) {
      console.error('Error saving memo:', err);
      alert(`메모 저장 오류: ${err.message}`);
    } finally {
      setIsSavingMemo(false);
    }
  };

  // 필터링된 요청 목록
  const filteredRequests = requests.filter(req => {
    // 상태 필터
    if (statusFilter !== 'all' && req.status !== statusFilter) {
      return false;
    }
    // 결제수단 필터
    if (paymentFilter !== 'all') {
      // 견적이 없는 경우 필터링에서 제외
      if (!req.paymentMethod) return false;
      if (req.paymentMethod !== paymentFilter) return false;
    }
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

      // Update both assigned_host_id and status to 'in_progress'
      const { error } = await supabase
        .from('quote_requests')
        .update({
          assigned_host_id: hostId || null,
          status: hostId ? 'in_progress' : 'waiting'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      const newStatus = hostId ? 'in_progress' : 'waiting';
      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, assignedHostId: hostId, status: newStatus } : req
      ));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, assignedHostId: hostId, status: newStatus }));
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

  // 온라인결제 예약확정 (결제 완료 확인 후)
  const confirmBooking = async () => {
    if (!hostQuote || !selectedRequest) return;

    if (!confirm('게스트 결제가 완료되었나요? 예약을 확정하시겠습니까?')) {
      return;
    }

    setIsConfirmingBooking(true);

    try {
      // 1. quote_requests status를 booking_confirmed로 업데이트
      await supabase
        .from('quote_requests')
        .update({ status: 'booking_confirmed' })
        .eq('id', selectedRequest.id);

      // 2. bookings 테이블에 예약 추가
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          host_id: selectedRequest.assignedHostId,
          quote_request_id: selectedRequest.id,
          host_quote_id: hostQuote.id,
          status: 'confirmed',
          booking_date: selectedRequest.desiredDate,
          booking_time: selectedRequest.desiredTime,
          guest_email: selectedRequest.email,
          guest_count: selectedRequest.numberOfPeople,
          total_amount: hostQuote.price,
          currency: hostQuote.currency,
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 3. 정산 예정 레코드 생성 (예약일 기준 7일 후 정산 예정)
      const scheduledDate = new Date(selectedRequest.desiredDate);
      scheduledDate.setDate(scheduledDate.getDate() + 7);

      await supabase
        .from('settlements')
        .insert([{
          host_id: selectedRequest.assignedHostId,
          booking_id: bookingData.id,
          amount: hostQuote.price,
          currency: hostQuote.currency,
          status: 'pending',
          scheduled_date: scheduledDate.toISOString().split('T')[0],
        }]);

      // 4. 로컬 상태 업데이트
      setRequests(prev => prev.map(req =>
        req.id === selectedRequest.id ? { ...req, status: 'booking_confirmed' } : req
      ));
      setSelectedRequest(prev => ({ ...prev, status: 'booking_confirmed' }));

      alert('예약이 확정되었습니다.');
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert(`예약 확정 오류: ${err.message}`);
    } finally {
      setIsConfirmingBooking(false);
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

      // 상태를 '호스트 소통 진행 중'으로 변경
      const { error: statusError } = await supabase
        .from('quote_requests')
        .update({ status: 'in_progress' })
        .eq('id', selectedRequest.id);

      if (statusError) {
        console.error('Status update error:', statusError);
      } else {
        // Update local state
        setRequests(prev => prev.map(req =>
          req.id === selectedRequest.id ? { ...req, status: 'in_progress' } : req
        ));
        setSelectedRequest(prev => ({ ...prev, status: 'in_progress' }));
      }

      alert(`${space.hostEmail}로 이메일이 발송되었습니다.`);
    } catch (err) {
      console.error('Email send error:', err);
      alert('이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setSendingEmail((prev) => ({ ...prev, [emailKey]: false }));
    }
  };

  // 이관 신청 상태 업데이트
  const updateMigrationStatus = async (migrationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('migration_requests')
        .update({ status: newStatus })
        .eq('id', migrationId);

      if (error) throw error;

      setMigrationRequests(prev => prev.map(m =>
        m.id === migrationId ? { ...m, status: newStatus } : m
      ));

      if (selectedMigration?.id === migrationId) {
        setSelectedMigration(prev => ({ ...prev, status: newStatus }));
      }

      alert('상태가 변경되었습니다.');
    } catch (err) {
      console.error('Error updating migration status:', err);
      alert(`상태 변경 오류: ${err.message}`);
    }
  };

  // 이관 신청 필터링
  const filteredMigrations = migrationRequests.filter(m => {
    if (migrationStatusFilter !== 'all' && m.status !== migrationStatusFilter) {
      return false;
    }
    return true;
  });

  const getMigrationStatusLabel = (status) => {
    const option = MIGRATION_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : '대기 중';
  };

  const getMigrationStatusColor = (status) => {
    const option = MIGRATION_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.color : '#f59e0b';
  };

  // 정산 상태 업데이트
  const updateSettlementStatus = async (settlementId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('settlements')
        .update(updateData)
        .eq('id', settlementId);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(b => {
        if (b.settlement?.id === settlementId) {
          return {
            ...b,
            settlement: { ...b.settlement, status: newStatus, ...updateData }
          };
        }
        return b;
      }));

      if (selectedBooking?.settlement?.id === settlementId) {
        setSelectedBooking(prev => ({
          ...prev,
          settlement: { ...prev.settlement, status: newStatus, ...updateData }
        }));
      }

      alert('정산 상태가 변경되었습니다.');
    } catch (err) {
      console.error('Error updating settlement status:', err);
      alert(`상태 변경 오류: ${err.message}`);
    }
  };

  // 예약 필터링
  const filteredBookings = bookings.filter(b => {
    if (settlementStatusFilter !== 'all') {
      const settlementStatus = b.settlement?.status || 'pending';
      if (settlementStatus !== settlementStatusFilter) {
        return false;
      }
    }
    return true;
  });

  const getSettlementStatusLabel = (status) => {
    const option = SETTLEMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : '정산 대기';
  };

  const getSettlementStatusColor = (status) => {
    const option = SETTLEMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.color : '#f59e0b';
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
        <h1>관리자</h1>
        <div className="header-actions">
          <span className="user-info">{user.user_metadata?.name || user.email}</span>
          <button className="refresh-btn" onClick={loadData} disabled={isLoading}>
            {isLoading ? '로딩 중...' : '새로고침'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('quotes'); setSelectedMigration(null); setSelectedBooking(null); }}
        >
          견적 요청
          <span className="tab-count">{requests.length}</span>
        </button>
        <button
          className={`admin-tab ${activeTab === 'migrations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('migrations'); setSelectedRequest(null); setSelectedBooking(null); }}
        >
          이관 신청
          <span className="tab-count">{migrationRequests.length}</span>
        </button>
        <button
          className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('bookings'); setSelectedRequest(null); setSelectedMigration(null); }}
        >
          예약/정산
          <span className="tab-count">{bookings.length}</span>
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'quotes' ? (
        <>
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
                    {req.spaceName && (
                      <span className="space-name-badge">{req.spaceName}</span>
                    )}
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(req.status), color: '#fff' }}
                    >
                      {getStatusLabel(req.status)}
                    </span>
                    {req.paymentMethod && (
                      <span className={`payment-badge ${req.paymentMethod}`}>
                        {req.paymentMethod === 'online' ? '온라인' : '현장'}
                      </span>
                    )}
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
                  <div className="current-status">
                    현재 상태:
                    <span
                      className="status-badge-large"
                      style={{ backgroundColor: getStatusColor(selectedRequest.status || 'waiting') }}
                    >
                      {getStatusLabel(selectedRequest.status || 'waiting')}
                    </span>
                  </div>
                  {!selectedRequest.autoAssigned && (
                    <label className="rejected-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRequest.status === 'rejected'}
                        onChange={(e) => toggleRejected(selectedRequest.id, e.target.checked)}
                      />
                      호스트 거절
                    </label>
                  )}
                </div>

                {/* 관리자 메모 섹션 */}
                <div className="detail-section memo-section">
                  <h3>관리자 메모</h3>
                  <textarea
                    className="admin-memo-textarea"
                    placeholder="호스트와 소통한 내용을 기록하세요..."
                    value={adminMemo}
                    onChange={(e) => setAdminMemo(e.target.value)}
                    rows={4}
                  />
                  <button
                    className="save-memo-btn"
                    onClick={saveAdminMemo}
                    disabled={isSavingMemo}
                  >
                    {isSavingMemo ? '저장 중...' : '메모 저장'}
                  </button>
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

                {/* Selected Spaces Section */}
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

                {/* Host Assignment Section */}
                <div className="detail-section">
                  <h3>
                    호스트 연결
                    {selectedRequest.autoAssigned && (
                      <span className="auto-badge">자동 연결됨</span>
                    )}
                  </h3>
                  {selectedRequest.assignedHostId ? (
                    <div className="host-assigned-info">
                      <span className="assigned-host">
                        {hosts.find(h => h.id === selectedRequest.assignedHostId)?.email || '연결된 호스트'}
                        {hosts.find(h => h.id === selectedRequest.assignedHostId)?.name &&
                          ` (${hosts.find(h => h.id === selectedRequest.assignedHostId).name})`
                        }
                      </span>
                      <button
                        className="unassign-btn"
                        onClick={() => assignHost(selectedRequest.id, null)}
                      >
                        연결 해제
                      </button>
                    </div>
                  ) : (
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
                  )}
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
                      {hostQuote.space_name && (
                        <div className="detail-row">
                          <label>공간명</label>
                          <span className="space-name">{hostQuote.space_name}</span>
                        </div>
                      )}
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
                        호스트가 게스트에게 견적서를 발송했습니다. (현장결제 - 예약확정)
                      </div>
                    )}

                    {/* 온라인결제: 발송 완료 후 결제 확인되면 예약확정 */}
                    {hostQuote.payment_method === 'online' && hostQuote.status === 'sent' && selectedRequest.status !== 'booking_confirmed' && (
                      <div className="booking-confirm-section">
                        <p className="confirm-hint">게스트 결제 완료 확인 후 예약을 확정하세요.</p>
                        <button
                          className="confirm-booking-btn"
                          onClick={confirmBooking}
                          disabled={isConfirmingBooking}
                        >
                          {isConfirmingBooking ? '처리 중...' : '예약확정'}
                        </button>
                      </div>
                    )}

                    {/* 예약확정 완료 */}
                    {selectedRequest.status === 'booking_confirmed' && (
                      <div className="booking-confirmed-notice">
                        예약이 확정되었습니다.
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
        </>
        ) : activeTab === 'migrations' ? (
        <>
        {/* 이관 신청 목록 */}
        <div className="requests-list">
          <div className="list-header">
            <h2>이관 신청 목록 ({filteredMigrations.length}건)</h2>
          </div>

          <div className="filter-section">
            <div className="filter-group">
              <label>상태</label>
              <select
                value={migrationStatusFilter}
                onChange={(e) => setMigrationStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">전체</option>
                {MIGRATION_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : migrationRequests.length === 0 ? (
            <div className="empty-state">
              <p>아직 이관 신청이 없습니다.</p>
            </div>
          ) : (
            <ul className="request-items">
              {filteredMigrations.map((migration) => (
                <li
                  key={migration.id}
                  className={`request-item ${selectedMigration?.id === migration.id ? 'active' : ''}`}
                  onClick={() => setSelectedMigration(migration)}
                >
                  <div className="request-summary">
                    <span className="request-email">{migration.host_name || migration.host_email}</span>
                    <span className="request-date">{formatDate(migration.created_at)}</span>
                  </div>
                  <div className="request-info">
                    <span>{migration.host_email}</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getMigrationStatusColor(migration.status), color: '#fff' }}
                    >
                      {getMigrationStatusLabel(migration.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 이관 신청 상세 */}
        <div className="request-detail">
          {selectedMigration ? (
            <>
              <div className="detail-header">
                <h2>이관 신청 상세</h2>
              </div>

              <div className="detail-content">
                {/* 상태 관리 */}
                <div className="detail-section status-management">
                  <h3>상태 관리</h3>
                  <div className="current-status">
                    현재 상태:
                    <span
                      className="status-badge-large"
                      style={{ backgroundColor: getMigrationStatusColor(selectedMigration.status) }}
                    >
                      {getMigrationStatusLabel(selectedMigration.status)}
                    </span>
                  </div>
                  <div className="status-actions">
                    <select
                      className="status-select"
                      value={selectedMigration.status}
                      onChange={(e) => updateMigrationStatus(selectedMigration.id, e.target.value)}
                    >
                      {MIGRATION_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 호스트 정보 */}
                <div className="detail-section">
                  <h3>호스트 정보</h3>
                  <div className="detail-row">
                    <label>이름</label>
                    <span>{selectedMigration.host_name || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>이메일</label>
                    <span>{selectedMigration.host_email}</span>
                  </div>
                  <div className="detail-row">
                    <label>연락처</label>
                    <span>{selectedMigration.host_phone || '-'}</span>
                  </div>
                </div>

                {/* 선택된 공간 */}
                <div className="detail-section">
                  <h3>이관 요청 공간</h3>
                  {selectedMigration.space_ids ? (
                    <div className="migration-spaces">
                      {JSON.parse(selectedMigration.space_ids).map((spaceId, idx) => (
                        <span key={idx} className="space-id-badge">{spaceId}</span>
                      ))}
                    </div>
                  ) : (
                    <p>선택된 공간 없음</p>
                  )}
                </div>

                {/* 신청 일시 */}
                <div className="detail-section">
                  <h3>신청 일시</h3>
                  <span>{formatDate(selectedMigration.created_at)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <p>신청을 선택하면 상세 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
        </>
        ) : activeTab === 'bookings' ? (
        <>
        {/* 예약/정산 목록 */}
        <div className="requests-list">
          <div className="list-header">
            <h2>예약/정산 목록 ({filteredBookings.length}건)</h2>
          </div>

          <div className="filter-section">
            <div className="filter-group">
              <label>정산 상태</label>
              <select
                value={settlementStatusFilter}
                onChange={(e) => setSettlementStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">전체</option>
                {SETTLEMENT_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p>아직 예약이 없습니다.</p>
            </div>
          ) : (
            <ul className="request-items">
              {filteredBookings.map((booking) => (
                <li
                  key={booking.id}
                  className={`request-item ${selectedBooking?.id === booking.id ? 'active' : ''}`}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="request-summary">
                    <span className="request-email">{booking.guest_email}</span>
                    <span className="request-date">{formatDate(booking.created_at)}</span>
                  </div>
                  <div className="request-info">
                    <span>{booking.booking_date}</span>
                    <span>{formatPrice(booking.total_amount, booking.currency)}</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getSettlementStatusColor(booking.settlement?.status || 'pending'), color: '#fff' }}
                    >
                      {getSettlementStatusLabel(booking.settlement?.status || 'pending')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 예약/정산 상세 */}
        <div className="request-detail">
          {selectedBooking ? (
            <>
              <div className="detail-header">
                <h2>예약/정산 상세</h2>
              </div>

              <div className="detail-content">
                {/* 예약 정보 */}
                <div className="detail-section">
                  <h3>예약 정보</h3>
                  <div className="detail-row">
                    <label>예약일</label>
                    <span>{selectedBooking.booking_date}</span>
                  </div>
                  <div className="detail-row">
                    <label>이용 시간</label>
                    <span>{selectedBooking.booking_time || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>게스트 이메일</label>
                    <span>{selectedBooking.guest_email}</span>
                  </div>
                  <div className="detail-row">
                    <label>인원</label>
                    <span>{selectedBooking.guest_count}명</span>
                  </div>
                  <div className="detail-row">
                    <label>예약 금액</label>
                    <span className="price">{formatPrice(selectedBooking.total_amount, selectedBooking.currency)}</span>
                  </div>
                  <div className="detail-row">
                    <label>예약 상태</label>
                    <span>{selectedBooking.status === 'confirmed' ? '예약 확정' : selectedBooking.status}</span>
                  </div>
                </div>

                {/* 정산 정보 */}
                {selectedBooking.settlement && (
                  <div className="detail-section">
                    <h3>정산 정보</h3>
                    <div className="detail-row">
                      <label>정산 금액</label>
                      <span className="price">{formatPrice(selectedBooking.settlement.amount, selectedBooking.settlement.currency)}</span>
                    </div>
                    <div className="detail-row">
                      <label>정산 예정일</label>
                      <span>{selectedBooking.settlement.scheduled_date || '-'}</span>
                    </div>
                    {selectedBooking.settlement.completed_date && (
                      <div className="detail-row">
                        <label>정산 완료일</label>
                        <span>{selectedBooking.settlement.completed_date}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <label>정산 상태</label>
                      <span
                        className="status-badge-large"
                        style={{ backgroundColor: getSettlementStatusColor(selectedBooking.settlement.status) }}
                      >
                        {getSettlementStatusLabel(selectedBooking.settlement.status)}
                      </span>
                    </div>

                    {/* 정산 상태 변경 */}
                    <div className="status-actions" style={{ marginTop: '16px' }}>
                      <label style={{ marginRight: '8px' }}>상태 변경:</label>
                      <select
                        className="status-select"
                        value={selectedBooking.settlement.status}
                        onChange={(e) => updateSettlementStatus(selectedBooking.settlement.id, e.target.value)}
                      >
                        {SETTLEMENT_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {!selectedBooking.settlement && (
                  <div className="detail-section">
                    <h3>정산 정보</h3>
                    <p>정산 정보가 없습니다.</p>
                  </div>
                )}

                {/* 예약 일시 */}
                <div className="detail-section">
                  <h3>예약 생성 일시</h3>
                  <span>{formatDate(selectedBooking.created_at)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <p>예약을 선택하면 상세 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
        </>
        ) : null}
      </div>
    </div>
  );
}

export default Admin;
