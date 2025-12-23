import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidCountry, DEFAULT_COUNTRY, getCountryConfig, t, formatDate as formatDateUtil } from '../lib/countryConfig';
import './HostQuoteForm.css';

function HostQuoteForm() {
  const navigate = useNavigate();
  const { requestId, country } = useParams();
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [quoteRequest, setQuoteRequest] = useState(null);
  const [existingQuote, setExistingQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasTemplate, setHasTemplate] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const countryConfig = getCountryConfig(country);

  // 호스트 수수료 결제 링크
  const HOST_FEE_PAYMENT_LINK = 'https://buy.stripe.com/test_14AeVd9n5csEbPA6Q0dUY04';

  // 수수료 결제 상태
  const [feePaid, setFeePaid] = useState(false);

  // 화폐는 국가별로 고정
  const [formData, setFormData] = useState({
    spaceName: '',
    spacePhoto: null,
    spacePhotoPreview: '',
    price: '',
    priceIncludes: '',
    paymentMethod: 'onsite',
  });

  // 유효하지 않은 국가 코드인 경우 기본 국가로 리다이렉트
  useEffect(() => {
    if (!isValidCountry(country)) {
      navigate(`/host/${DEFAULT_COUNTRY}/quote/${requestId}`, { replace: true });
    }
  }, [country, navigate, requestId]);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate(`/host/${country || DEFAULT_COUNTRY}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requestId, country]);

  // 창이 다시 활성화될 때 수수료 결제 상태 자동 확인
  useEffect(() => {
    if (!user || feePaid || formData.paymentMethod !== 'onsite') return;

    const checkFeeOnFocus = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('fee_paid')
          .eq('id', user.id)
          .single();

        if (profileData?.fee_paid) {
          setFeePaid(true);
        }
      } catch (err) {
        console.error('Error checking fee status:', err);
      }
    };

    // 브라우저 탭이 다시 활성화될 때
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFeeOnFocus();
      }
    };

    // 창이 포커스될 때
    const handleFocus = () => {
      checkFeeOnFocus();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, feePaid, formData.paymentMethod]);

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
          setError(t(country, 'accessDenied'));
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
          spaceName: quoteData.space_name || '',
          spacePhoto: null,
          spacePhotoPreview: quoteData.space_photo_url || '',
          price: quoteData.price ? quoteData.price.toLocaleString() : '',
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

      // Check if host has paid the fee
      const { data: profileData } = await supabase
        .from('profiles')
        .select('fee_paid')
        .eq('id', userId)
        .single();

      setFeePaid(profileData?.fee_paid || false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t(country, 'loadDataError'));
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
        setError(t(country, 'fileSizeError'));
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
          priceIncludes: template.price_includes || prev.priceIncludes,
          paymentMethod: template.payment_method || prev.paymentMethod,
        }));
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setError(t(country, 'loadTemplateError'));
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!formData.spaceName || !formData.price) {
      setError(t(country, 'enterQuoteAmount'));
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
        space_name: formData.spaceName,
        space_photo_url: photoUrl,
        price: parseInt(formData.price.replace(/,/g, '')),
        currency: countryConfig.currency, // 국가별 고정 화폐
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
      if (!isOnsite) {
        await supabase
          .from('quote_requests')
          .update({ status: 'quote_registered' })
          .eq('id', requestId);
      }

      // 현장결제인 경우 바로 이메일 발송
      if (isOnsite) {
        const spaceName = quoteRequest?.selectedSpaces?.[0]?.name || 'Space';

        const response = await fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestEmail: quoteRequest.email,
            spaceName: spaceName,
            spacePhotoUrl: photoUrl,
            price: parseInt(formData.price.replace(/,/g, '')).toLocaleString(),
            currency: countryConfig.currency,
            priceIncludes: formData.priceIncludes,
            paymentMethod: formData.paymentMethod,
            stripeLink: null,
            desiredDate: quoteRequest.desired_date,
            desiredTime: quoteRequest.desired_time,
          }),
        });

        if (!response.ok) {
          await supabase
            .from('host_quotes')
            .update({ status: 'pending' })
            .eq('id', savedQuoteId);
          throw new Error(t(country, 'saveError'));
        }

        await supabase
          .from('quote_requests')
          .update({ status: 'booking_confirmed' })
          .eq('id', requestId);

        const priceValue = parseInt(formData.price.replace(/,/g, ''));
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert([{
            host_id: user.id,
            quote_request_id: requestId,
            host_quote_id: savedQuoteId,
            status: 'confirmed',
            booking_date: quoteRequest.desired_date,
            booking_time: quoteRequest.desired_time,
            guest_email: quoteRequest.email,
            guest_count: quoteRequest.number_of_people,
            total_amount: priceValue,
            currency: countryConfig.currency,
          }])
          .select()
          .single();

        if (bookingError) {
          console.error('Booking creation error:', bookingError);
        } else {
          const scheduledDate = new Date(quoteRequest.desired_date);
          scheduledDate.setDate(scheduledDate.getDate() + 7);

          await supabase
            .from('settlements')
            .insert([{
              host_id: user.id,
              booking_id: bookingData.id,
              amount: priceValue,
              currency: countryConfig.currency,
              status: 'pending',
              scheduled_date: scheduledDate.toISOString().split('T')[0],
            }]);
        }
      }

      navigate(`/host/${country}/quotes`);
    } catch (err) {
      console.error('Error saving quote:', err);
      setError(err.message || t(country, 'saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthChecking || isLoading) {
    return (
      <div className="host-quote-container">
        <div className="loading-state">
          <p>{isAuthChecking ? t(country, 'authChecking') : t(country, 'loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !quoteRequest) {
    return (
      <div className="host-quote-container">
        <div className="error-state">
          <p>{error}</p>
          <Link to={`/host/${country}/quotes`} className="back-link-btn">{t(country, 'backToListBtn')}</Link>
        </div>
      </div>
    );
  }

  const isSent = existingQuote?.status === 'sent';

  return (
    <div className="host-quote-container">
      <header className="quote-form-header">
        <Link to={`/host/${country}/quotes`} className="back-link">{t(country, 'backToList')}</Link>
        <h1>{isSent ? t(country, 'sentQuoteTitle') : t(country, 'quoteFormTitle')}</h1>
        <p className="form-description">
          {isSent ? t(country, 'sentQuoteDesc') : t(country, 'quoteFormDesc')}
        </p>

        {hasTemplate && !existingQuote && (
          <button
            type="button"
            className="load-template-btn"
            onClick={handleLoadTemplate}
            disabled={isLoadingTemplate}
          >
            {isLoadingTemplate ? t(country, 'loadingTemplate') : t(country, 'loadTemplate')}
          </button>
        )}
      </header>

      {error && <div className="form-error">{error}</div>}

      {/* Guest Request Info */}
      {quoteRequest && (
        <div className="guest-request-box">
          <h3>{t(country, 'guestRequestInfo')}</h3>
          <div className="request-info-grid">
            <div className="request-info-item">
              <span className="label">{t(country, 'desiredDate')}</span>
              <span className="value">{quoteRequest.desired_date || '-'}</span>
            </div>
            <div className="request-info-item">
              <span className="label">{t(country, 'desiredTime')}</span>
              <span className="value">{quoteRequest.desired_time || '-'}</span>
            </div>
            <div className="request-info-item">
              <span className="label">{t(country, 'numberOfPeople')}</span>
              <span className="value">{quoteRequest.number_of_people}{t(country, 'peopleUnit')}</span>
            </div>
            <div className="request-info-item">
              <span className="label">{t(country, 'requestDate')}</span>
              <span className="value">{formatDateUtil(quoteRequest.created_at, country)}</span>
            </div>
          </div>
          {quoteRequest.requests && (
            <div className="request-message">
              <span className="label">{t(country, 'specialRequests')}</span>
              <p>{quoteRequest.requests}</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="quote-form">
        <div className="form-section">
          <h3>{t(country, 'spacePhoto')}</h3>
          <div className="photo-upload-area">
            {formData.spacePhotoPreview ? (
              <div className="photo-preview">
                <img src={formData.spacePhotoPreview} alt="Space preview" />
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    spacePhoto: null,
                    spacePhotoPreview: '',
                  }))}
                >
                  {t(country, 'delete')}
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
                  <span>{t(country, 'uploadPhoto')}</span>
                  <span className="upload-hint">{t(country, 'maxFileSize')}</span>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>{t(country, 'quoteInfo')}</h3>
          <div className="form-group">
            <label htmlFor="spaceName">{t(country, 'spaceName')} <span className="required">{t(country, 'required')}</span></label>
            <input
              type="text"
              id="spaceName"
              name="spaceName"
              value={formData.spaceName}
              onChange={handleChange}
              placeholder={t(country, 'spaceNamePlaceholder')}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group flex-grow">
              <label htmlFor="price">{t(country, 'quoteAmount')} <span className="required">{t(country, 'required')}</span></label>
              <div className="price-input-wrapper">
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="100,000"
                  required
                />
                <span className="currency-fixed">{countryConfig.currency} ({countryConfig.currencySymbol})</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="priceIncludes">{t(country, 'priceIncludes')}</label>
            <textarea
              id="priceIncludes"
              name="priceIncludes"
              value={formData.priceIncludes}
              onChange={handleChange}
              rows="3"
              placeholder={t(country, 'priceIncludesPlaceholder')}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>{t(country, 'paymentMethod')}</h3>
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
                <span className="option-label">{t(country, 'onsitePayment')}</span>
                <span className="option-desc">{t(country, 'onsitePaymentDesc')}</span>
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
                <span className="option-label">{t(country, 'onlinePayment')}</span>
                <span className="option-desc">{t(country, 'onlinePaymentDesc')}</span>
              </div>
            </label>
          </div>
        </div>

        {/* 현장결제 선택 시 수수료 결제 안내 */}
        {formData.paymentMethod === 'onsite' && !isSent && (
          <div className="form-section fee-section">
            <h3>{t(country, 'serviceFee')}</h3>
            {feePaid ? (
              <div className="fee-paid-notice">
                <span className="fee-paid-icon">✅</span>
                <p>{t(country, 'feePaidMessage')}</p>
              </div>
            ) : (
              <div className="fee-required-notice">
                <p className="fee-notice-text">
                  {t(country, 'feeRequiredMessage')}
                </p>
                <a
                  href={HOST_FEE_PAYMENT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pay-fee-btn"
                >
                  {t(country, 'payFeeButton')}
                </a>
              </div>
            )}
          </div>
        )}

        {!isSent && (
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || (formData.paymentMethod === 'onsite' && !feePaid)}
            >
              {isSubmitting
                ? (formData.paymentMethod === 'onsite' ? t(country, 'submitting') : t(country, 'saving'))
                : (formData.paymentMethod === 'onsite' ? t(country, 'submitAndSend') : t(country, 'submitOnly'))
              }
            </button>
            {formData.paymentMethod === 'online' && !existingQuote && (
              <p className="submit-hint">{t(country, 'onlinePaymentHint')}</p>
            )}
            {formData.paymentMethod === 'onsite' && !feePaid && (
              <p className="submit-hint fee-warning">{t(country, 'feeRequiredHint')}</p>
            )}
          </div>
        )}

        {isSent && (
          <div className="sent-notice">
            <span className="sent-icon">✅</span>
            <p>{t(country, 'alreadySent')}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default HostQuoteForm;
