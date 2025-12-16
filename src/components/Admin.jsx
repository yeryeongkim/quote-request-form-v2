import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFxfeFkiou8EvgWGPVRCHhF7A4Ujo9PLhUdTuPBkKt5frMnU2b71lAZORjei9EZCoOxg/exec';

function Admin() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        redirect: 'follow',
      });

      const text = await response.text();
      console.log('Response:', text);

      const data = JSON.parse(text);

      if (data.error) {
        throw new Error(data.error);
      }

      // 최신순 정렬
      const sorted = Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : [];
      setRequests(sorted);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('데이터를 불러오는데 실패했습니다. 콘솔을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return String(dateString);
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>견적 요청 관리</h1>
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadRequests} disabled={isLoading}>
            {isLoading ? '로딩 중...' : '새로고침'}
          </button>
          <Link to="/" className="back-link">← 견적 폼으로 돌아가기</Link>
        </div>
      </header>

      <div className="admin-content">
        <div className="requests-list">
          <div className="list-header">
            <h2>요청 목록 ({requests.length}건)</h2>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadRequests}>다시 시도</button>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <p>아직 견적 요청이 없습니다.</p>
            </div>
          ) : (
            <ul className="request-items">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className={`request-item ${selectedRequest?.id === req.id ? 'active' : ''}`}
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="request-summary">
                    <span className="request-email">{req.email}</span>
                    <span className="request-date">{formatDate(req.submittedAt)}</span>
                  </div>
                  <div className="request-info">
                    <span>{req.desiredDate} {req.desiredTime}</span>
                    <span>{req.numberOfPeople}명</span>
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
