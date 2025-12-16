import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './HostQuoteForm.css';

function HostQuoteForm() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [quoteRequest, setQuoteRequest] = useState(null);
  const [existingQuote, setExistingQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasTemplate, setHasTemplate] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const [formData, setFormData] = useState({
    spacePhoto: null,
    spacePhotoPreview: '',
    price: '',
    currency: 'KRW',
    priceIncludes: '',
    paymentMethod: 'onsite',
  });

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/host');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requestId]);

  const loadData = async (userId) => {
    setIsLoading(true);
    setError('');

    try {
      // Load quote request
      const { data: requestData, error: requestError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', requestId)
        .eq('assigned_host_id', userId)
        .single();

      if (requestError) {
        if (requestError.code === 'PGRST116') {
          setError('접근 권한이 없거나 존재하지 않는 요청입니다.');
        } else {
          throw requestError;
        }
        return;
      }

      setQuoteRequest(requestData);

      // Check if quote already exists
      const { data: quoteData } = await supabase
        .from('host_quotes')
        .select('*')
        .eq('quote_request_id', requestId)
        .eq('host_id', userId)
        .single();

      if (quoteData) {
        setExistingQuote(quoteData);
        setFormData({
          spacePhoto: null,
          spacePhotoPreview: quoteData.space_photo_url || '',
          price: quoteData.price ? quoteData.price.toLocaleString() : '',
          currency: quoteData.currency || 'KRW',
          priceIncludes: quoteData.price_includes || '',
          paymentMethod: quoteData.payment_method || 'onsite',
        });
      }

      // Check if host has a template
      const { data: templateExists } = await supabase
        .from('host_quote_templates')
        .select('id')
        .eq('host_id', userId)
        .single();

      setHasTemplate(!!templateExists);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setFormData((prev) => ({ ...prev, price: formatted }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          spacePhoto: file,
          spacePhotoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${requestId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('space-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('space-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleLoadTemplate = async () => {
    setIsLoadingTemplate(true);
    setError('');

    try {
      const { data: template, error } = await supabase
        .from('host_quote_templates')
        .select('*')
        .eq('host_id', user.id)
        .single();

      if (error) throw error;

      if (template) {
        setFormData((prev) => ({
          ...prev,
          spacePhotoPreview: template.space_photo_url || prev.spacePhotoPreview,
          price: template.default_price ? template.default_price.toLocaleString() : prev.price,
          currency: template.currency || prev.currency,
          priceIncludes: template.price_includes || prev.priceIncludes,
          paymentMethod: template.payment_method || prev.paymentMethod,
        }));
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setError('템플릿을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!formData.price) {
      setError('견적 금액을 입력해주세요.');
      setIsSubmitting(false);
      return;
    }

    try {
      let photoUrl = existingQuote?.space_photo_url || formData.spacePhotoPreview || '';

      // Upload image if new one selected
      if (formData.spacePhoto) {
        photoUrl = await uploadImage(formData.spacePhoto);
      }

      const isOnsite = formData.paymentMethod === 'onsite';

      const quoteData = {
        quote_request_id: requestId,
        host_id: user.id,
        space_photo_url: photoUrl,
        price: parseInt(formData.price.replace(/,/g, '')),
        currency: formData.currency,
        price_includes: formData.priceIncludes,
        payment_method: formData.paymentMethod,
        status: isOnsite ? 'sent' : 'pending',
      };

      let savedQuoteId;

      if (existingQuote) {
        // Update existing quote
        const { error } = await supabase
          .from('host_quotes')
          .update(quoteData)
          .eq('id', existingQuote.id);

        if (error) throw error;
        savedQuoteId = existingQuote.id;
      } else {
        // Insert new quote
        const { data, error } = await supabase
          .from('host_quotes')
          .insert([quoteData])
          .select()
          .single();

        if (error) throw error;
        savedQuoteId = data.id;
      }

      // Update quote_requests status
      // 온라인결제: quote_registered (관리자가 나중에 발송)
      // 현장결제: quote_sent (아래에서 이메일 발송 후 업데이트)
      if (!isOnsite) {
        await supabase
          .from('quote_requests')
          .update({ status: 'quote_registered' })
          .eq('id', requestId);
      }

      // 현장결제인 경우 바로 이메일 발송
      if (isOnsite) {
        const spaceName = quoteRequest?.selectedSpaces?.[0]?.name || '공간';

        const response = await fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestEmail: quoteRequest.email,
            spaceName: spaceName,
            spacePhotoUrl: photoUrl,
            price: parseInt(formData.price.replace(/,/g, '')).toLocaleString(),
            currency: formData.currency,
            priceIncludes: formData.priceIncludes,
            paymentMethod: formData.paymentMethod,
            stripeLink: null,
            desiredDate: quoteRequest.desired_date,
            desiredTime: quoteRequest.desired_time,
          }),
        });

        if (!response.ok) {
          // 이메일 발송 실패 시 상태를 pending으로 되돌림
          await supabase
            .from('host_quotes')
            .update({ status: 'pending' })
            .eq('id', savedQuoteId);
          throw new Error('이메일 발송에 실패했습니다.');
        }

        // 현장결제 이메일 발송 성공 시 quote_requests status를 quote_sent로 업데이트
        await supabase
          .from('quote_requests')
          .update({ status: 'quote_sent' })
          .eq('id', requestId);
      }

      navigate('/host/quotes');
    } catch (err) {
      console.error('Error saving quote:', err);
      setError(err.message || '견적 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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

  if (isAuthChecking || isLoading) {
    return (
      <div className="host-quote-container">
        <div className="loading-state">
          <p>{isAuthChecking ? '인증 확인 중...' : '데이터 로딩 중...'}</p>
        </div>
      </div>
    );
  }

  if (error && !quoteRequest) {
    return (
      <div className="host-quote-container">
        <div className="error-state">
          <p>{error}</p>
          <Link to="/host/quotes" className="back-link-btn">견적 요청 목록으로</Link>
        </div>
      </div>
    );
  }

  const isSent = existingQuote?.status === 'sent';

  return (
    <div className="host-quote-container">
      <header className="quote-form-header">
        <Link to="/host/quotes" className="back-link">← 견적 요청 관리</Link>
        <h1>{isSent ? '발송 완료된 견적서' : existingQuote ? '견적서 등록' : '견적서 등록'}</h1>
        <p className="form-description">
          {isSent ? '이미 게스트에게 발송된 견적서입니다.' : '게스트 요청에 대한 견적을 작성하세요.'}
        </p>

        {hasTemplate && !existingQuote && (
          <button
            type="button"
            className="load-template-btn"
            onClick={handleLoadTemplate}
            disabled={isLoadingTemplate}
          >
            {isLoadingTemplate ? '불러오는 중...' : '템플릿 불러오기'}
          </button>
        )}
      </header>

      {error && <div className="form-error">{error}</div>}

      {/* Guest Request Info */}
      {quoteRequest && (
        <div className="guest-request-box">
          <h3>게스트 요청 정보</h3>
          <div className="request-info-grid">
            <div className="request-info-item">
              <span className="label">희망 날짜</span>
              <span className="value">{quoteRequest.desired_date || '-'}</span>
            </div>
            <div className="request-info-item">
              <span className="label">희망 시간</span>
              <span className="value">{quoteRequest.desired_time || '-'}</span>
            </div>
            <div className="request-info-item">
              <span className="label">인원</span>
              <span className="value">{quoteRequest.number_of_people}명</span>
            </div>
            <div className="request-info-item">
              <span className="label">요청일</span>
              <span className="value">{formatDate(quoteRequest.created_at)}</span>
            </div>
          </div>
          {quoteRequest.requests && (
            <div className="request-message">
              <span className="label">요청사항</span>
              <p>{quoteRequest.requests}</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="quote-form">
        <div className="form-section">
          <h3>공간 사진</h3>
          <div className="photo-upload-area">
            {formData.spacePhotoPreview ? (
              <div className="photo-preview">
                <img src={formData.spacePhotoPreview} alt="공간 미리보기" />
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    spacePhoto: null,
                    spacePhotoPreview: '',
                  }))}
                >
                  삭제
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
                <div className="upload-placeholder">
                  <span className="upload-icon">+</span>
                  <span>사진 업로드</span>
                  <span className="upload-hint">최대 5MB</span>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>견적 정보</h3>
          <div className="form-row">
            <div className="form-group flex-grow">
              <label htmlFor="price">견적 금액 <span className="required">*</span></label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handlePriceChange}
                placeholder="예: 100,000"
                required
              />
            </div>
            <div className="form-group currency-group">
              <label htmlFor="currency">통화</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="priceIncludes">가격 포함 항목</label>
            <textarea
              id="priceIncludes"
              name="priceIncludes"
              value={formData.priceIncludes}
              onChange={handleChange}
              rows="3"
              placeholder="예: 장소 대여, 음향 장비, 주차 2대 무료"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>결제 방식</h3>
          <div className="payment-options">
            <label className={`payment-option ${formData.paymentMethod === 'onsite' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="onsite"
                checked={formData.paymentMethod === 'onsite'}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-icon">💵</span>
                <span className="option-label">현장결제</span>
                <span className="option-desc">이용 당일 현장에서 결제</span>
              </div>
            </label>
            <label className={`payment-option ${formData.paymentMethod === 'online' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={formData.paymentMethod === 'online'}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-icon">💳</span>
                <span className="option-label">온라인결제</span>
                <span className="option-desc">관리자가 결제 링크를 생성합니다</span>
              </div>
            </label>
          </div>
        </div>

        {!isSent && (
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting
                ? (formData.paymentMethod === 'onsite' ? '발송 중...' : '저장 중...')
                : (formData.paymentMethod === 'onsite' ? '견적서 등록 및 발송' : '견적서 등록')
              }
            </button>
            {formData.paymentMethod === 'online' && !existingQuote && (
              <p className="submit-hint">온라인결제 선택 시 관리자가 결제링크 추가 후 게스트에게 발송합니다.</p>
            )}
          </div>
        )}

        {isSent && (
          <div className="sent-notice">
            <span className="sent-icon">✅</span>
            <p>이 견적서는 이미 게스트에게 발송되었습니다.</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default HostQuoteForm;
