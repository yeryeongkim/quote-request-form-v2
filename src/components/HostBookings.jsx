import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidCountry, DEFAULT_COUNTRY, getCountryConfig, t, formatDate as formatDateUtil, formatPrice } from '../lib/countryConfig';
import HostHeader from './HostHeader';
import MigrationBanner from './MigrationBanner';
import MigrationRequestModal from './MigrationRequestModal';
import './HostBookings.css';

function HostBookings() {
  const navigate = useNavigate();
  const { country } = useParams();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [bookings, setBookings] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const countryConfig = getCountryConfig(country);

  // 유효하지 않은 국가 코드인 경우 기본 국가로 리다이렉트
  useEffect(() => {
    if (!isValidCountry(country)) {
      navigate(`/host/${DEFAULT_COUNTRY}/dashboard`, { replace: true });
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
      // Load bookings for this host
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Load settlements for this host
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select('*, bookings(*)')
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (settlementsError) throw settlementsError;

      // Load host's quotes with space_name (for space selection in migration modal)
      const { data: spacesData, error: spacesError } = await supabase
        .from('host_quotes')
        .select('id, space_name, quote_request_id, created_at, quote_requests(id, email, desired_date)')
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (spacesError) throw spacesError;

      // Check if host already has a pending migration request
      let hasPending = false;
      const { data: existingRequest, error: migrationError } = await supabase
        .from('migration_requests')
        .select('id, status')
        .eq('host_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (migrationError) {
        // Table might not exist yet, that's OK - show banner anyway
        console.log('Migration request check skipped:', migrationError.message);
      } else {
        hasPending = !!existingRequest;
      }

      console.log('Setting hasPendingRequest to:', hasPending);
      setBookings(bookingsData || []);
      setSettlements(settlementsData || []);
      setSpaces(spacesData || []);
      setHasPendingRequest(hasPending);
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

  const formatCurrency = (amount, currency = countryConfig.currency) => {
    if (!amount) return '-';
    return formatPrice(amount, country);
  };

  const getBookingStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return t(country, 'confirmed');
      case 'cancelled': return t(country, 'cancelled');
      case 'completed': return t(country, 'completed');
      default: return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => booking.status === activeTab);

  const tabs = [
    { key: 'confirmed', label: t(country, 'confirmed') },
    { key: 'cancelled', label: t(country, 'cancelled') },
    { key: 'completed', label: t(country, 'completed') },
  ];

  if (isAuthChecking) {
    return (
      <div className="host-bookings-container">
        <div className="loading-state">
          <p>{t(country, 'authChecking')}</p>
        </div>
      </div>
    );
  }

  console.log('Rendering HostBookings, hasPendingRequest:', hasPendingRequest, 'shouldShowBanner:', !hasPendingRequest);

  return (
    <div className="host-bookings-container">
      <HostHeader user={user} country={country} />

      {/* Always render banner for debugging */}
      <MigrationBanner
        onClick={() => setShowMigrationModal(true)}
        country={country}
      />

      <main className="bookings-main">
        {/* 견적 예약 현황 */}
        <section className="bookings-section">
          <h2>{t(country, 'bookingStatus')}</h2>

          <div className="booking-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`booking-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">
                  {bookings.filter((b) => b.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="loading-state">
              <p>{t(country, 'loading')}</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => loadData(user.id)}>{t(country, 'retry')}</button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{t(country, 'noBookings')}</h3>
            </div>
          ) : (
            <div className="booking-cards">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-card-header">
                    <span className="booking-date">{formatDate(booking.booking_date)}</span>
                    <span className={`booking-status-badge ${booking.status}`}>
                      {getBookingStatusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="booking-card-body">
                    <div className="booking-info-row">
                      <span className="booking-label">{t(country, 'guest')}</span>
                      <span className="booking-value">{booking.guest_email}</span>
                    </div>
                    <div className="booking-info-row">
                      <span className="booking-label">{t(country, 'usageTime')}</span>
                      <span className="booking-value">{booking.booking_time || '-'}</span>
                    </div>
                    <div className="booking-info-row">
                      <span className="booking-label">{t(country, 'numberOfPeople')}</span>
                      <span className="booking-value">{booking.guest_count}{t(country, 'peopleUnit')}</span>
                    </div>
                    <div className="booking-info-row">
                      <span className="booking-label">{t(country, 'amount')}</span>
                      <span className="booking-value amount">
                        {formatCurrency(booking.total_amount, booking.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 정산 현황 */}
        <section className="settlements-section">
          <h2>{t(country, 'settlementStatus')}</h2>

          {isLoading ? (
            <div className="loading-state">
              <p>{t(country, 'loading')}</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3>{t(country, 'noSettlements')}</h3>
            </div>
          ) : (
            <div className="settlement-cards">
              {settlements.map((settlement) => (
                <div key={settlement.id} className="settlement-card">
                  <div className="settlement-card-header">
                    <span className={`settlement-badge ${settlement.status}`}>
                      {settlement.status === 'pending' ? t(country, 'settlementPending') : t(country, 'settlementCompleted')}
                    </span>
                    <span className="settlement-date">
                      {settlement.status === 'completed'
                        ? formatDate(settlement.completed_date)
                        : formatDate(settlement.scheduled_date)}
                    </span>
                  </div>
                  <div className="settlement-card-body">
                    <div className="settlement-amount">
                      {formatCurrency(settlement.amount, settlement.currency)}
                    </div>
                    {settlement.bookings && (
                      <div className="settlement-booking-info">
                        <span>{t(country, 'bookingDate')}: {formatDate(settlement.bookings.booking_date)}</span>
                        <span>{settlement.bookings.guest_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showMigrationModal && (
        <MigrationRequestModal
          user={user}
          spaces={spaces}
          country={country}
          onClose={() => setShowMigrationModal(false)}
          onSuccess={() => setHasPendingRequest(true)}
        />
      )}
    </div>
  );
}

export default HostBookings;
