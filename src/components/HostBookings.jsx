import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HostHeader from './HostHeader';
import './HostBookings.css';

function HostBookings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
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

  if (isAuthChecking) {
    return (
      <div className="host-bookings-container">
        <div className="loading-state">
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="host-bookings-container">
      <HostHeader user={user} />

      <main className="bookings-main">
        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h2>예약/정산 관리</h2>
          <p>곧 서비스가 오픈될 예정입니다.</p>
        </div>
      </main>
    </div>
  );
}

export default HostBookings;
