import { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidCountry, DEFAULT_COUNTRY, getCountryConfig } from '../lib/countryConfig';
import './QuoteRequestForm.css';

// 국가별 전화번호 설정
const PHONE_CONFIG = {
  korea: { code: '+82', placeholder: '010-1234-5678', example: '010-1234-5678' },
  uk: { code: '+44', placeholder: '7700 900000', example: '7700 900000' },
  usa: { code: '+1', placeholder: '234 567 8900', example: '234 567 8900' },
  japan: { code: '+81', placeholder: '90-1234-5678', example: '90-1234-5678' },
  canada: { code: '+1', placeholder: '234 567 8900', example: '234 567 8900' },
};

// 30분 단위 시간 옵션 생성
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

function QuoteRequestForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { country } = useParams();
  const selectedSpaces = location.state?.selectedSpaces || [];

  const countryConfig = getCountryConfig(country);
  const phoneConfig = PHONE_CONFIG[country] || PHONE_CONFIG.korea;

  // 유효하지 않은 국가 코드인 경우 기본 국가로 리다이렉트
  useEffect(() => {
    if (!isValidCountry(country)) {
      navigate(`/${DEFAULT_COUNTRY}/quote`, { replace: true });
    }
  }, [country, navigate]);

  // UI 텍스트
  const uiText = {
    korea: {
      backLink: '← 공간 검색으로',
      title: '최종 견적 요청',
      description: '선택한 공간에 대한 견적을 요청합니다.',
      selectedSpaces: '선택된 공간',
      contactInfo: '연락처 정보',
      email: '이메일',
      phone: '연락처',
      usageInfo: '이용 정보',
      usageDate: '이용 날짜',
      datePlaceholder: '날짜 선택',
      startTime: '시작 시간',
      endTime: '종료 시간',
      timePlaceholder: '시간 선택',
      numberOfPeople: '인원 수',
      peoplePlaceholder: '예: 10',
      additionalRequests: '추가 요청사항',
      requests: '요청사항',
      requestsPlaceholder: '추가로 요청하실 사항이 있으시면 작성해주세요.',
      privacyConsent: '개인정보 수집 및 이용에 동의합니다.',
      privacyNotice: '수집된 개인정보는 견적 발송 및 상담 목적으로만 사용되며, 목적 달성 후 즉시 파기됩니다.',
      submitting: '제출 중...',
      submit: '견적 요청하기',
      successTitle: '견적 요청이 완료되었습니다!',
      successMessage: '입력하신 이메일로 견적서를 보내드리겠습니다.',
      newRequest: '새로운 견적 요청',
      errorEmail: '이메일을 입력해주세요.',
      errorEmailFormat: '올바른 이메일 형식을 입력해주세요.',
      errorPhone: '연락처를 입력해주세요.',
      errorPhoneFormat: '올바른 연락처 형식을 입력해주세요.',
      errorDate: '이용 날짜를 선택해주세요.',
      errorStartTime: '시작 시간을 선택해주세요.',
      errorEndTime: '종료 시간을 선택해주세요.',
      errorTimeOrder: '종료 시간은 시작 시간 이후여야 합니다.',
      errorPeople: '인원 수를 입력해주세요.',
      errorPeopleMin: '1명 이상 입력해주세요.',
      errorPrivacy: '개인정보 수집에 동의해주세요.',
      submitError: '제출 중 오류가 발생했습니다. 다시 시도해주세요.',
    },
    uk: {
      backLink: '← Back to Search',
      title: 'Request Quote',
      description: 'Request a quote for your selected spaces.',
      selectedSpaces: 'Selected Spaces',
      contactInfo: 'Contact Information',
      email: 'Email',
      phone: 'Phone',
      usageInfo: 'Booking Details',
      usageDate: 'Date',
      datePlaceholder: 'Select date',
      startTime: 'Start Time',
      endTime: 'End Time',
      timePlaceholder: 'Select time',
      numberOfPeople: 'Number of Guests',
      peoplePlaceholder: 'e.g. 10',
      additionalRequests: 'Additional Requests',
      requests: 'Requests',
      requestsPlaceholder: 'Please enter any additional requirements.',
      privacyConsent: 'I agree to the collection and use of my personal information.',
      privacyNotice: 'Your information will only be used for sending quotes and will be deleted after.',
      submitting: 'Submitting...',
      submit: 'Request Quote',
      successTitle: 'Quote Request Submitted!',
      successMessage: 'We\'ll send you a quote via email.',
      newRequest: 'New Request',
      errorEmail: 'Please enter your email.',
      errorEmailFormat: 'Please enter a valid email address.',
      errorPhone: 'Please enter your phone number.',
      errorPhoneFormat: 'Please enter a valid phone number.',
      errorDate: 'Please select a date.',
      errorStartTime: 'Please select a start time.',
      errorEndTime: 'Please select an end time.',
      errorTimeOrder: 'End time must be after start time.',
      errorPeople: 'Please enter the number of guests.',
      errorPeopleMin: 'Must be at least 1 person.',
      errorPrivacy: 'Please agree to the privacy policy.',
      submitError: 'An error occurred. Please try again.',
    },
    usa: {
      backLink: '← Back to Search',
      title: 'Request Quote',
      description: 'Request a quote for your selected spaces.',
      selectedSpaces: 'Selected Spaces',
      contactInfo: 'Contact Information',
      email: 'Email',
      phone: 'Phone',
      usageInfo: 'Booking Details',
      usageDate: 'Date',
      datePlaceholder: 'Select date',
      startTime: 'Start Time',
      endTime: 'End Time',
      timePlaceholder: 'Select time',
      numberOfPeople: 'Number of Guests',
      peoplePlaceholder: 'e.g. 10',
      additionalRequests: 'Additional Requests',
      requests: 'Requests',
      requestsPlaceholder: 'Please enter any additional requirements.',
      privacyConsent: 'I agree to the collection and use of my personal information.',
      privacyNotice: 'Your information will only be used for sending quotes and will be deleted after.',
      submitting: 'Submitting...',
      submit: 'Request Quote',
      successTitle: 'Quote Request Submitted!',
      successMessage: 'We\'ll send you a quote via email.',
      newRequest: 'New Request',
      errorEmail: 'Please enter your email.',
      errorEmailFormat: 'Please enter a valid email address.',
      errorPhone: 'Please enter your phone number.',
      errorPhoneFormat: 'Please enter a valid phone number.',
      errorDate: 'Please select a date.',
      errorStartTime: 'Please select a start time.',
      errorEndTime: 'Please select an end time.',
      errorTimeOrder: 'End time must be after start time.',
      errorPeople: 'Please enter the number of guests.',
      errorPeopleMin: 'Must be at least 1 person.',
      errorPrivacy: 'Please agree to the privacy policy.',
      submitError: 'An error occurred. Please try again.',
    },
    japan: {
      backLink: '← 検索に戻る',
      title: '見積依頼',
      description: '選択したスペースの見積を依頼します。',
      selectedSpaces: '選択したスペース',
      contactInfo: '連絡先情報',
      email: 'メールアドレス',
      phone: '電話番号',
      usageInfo: '利用情報',
      usageDate: '利用日',
      datePlaceholder: '日付を選択',
      startTime: '開始時間',
      endTime: '終了時間',
      timePlaceholder: '時間を選択',
      numberOfPeople: '人数',
      peoplePlaceholder: '例: 10',
      additionalRequests: '追加リクエスト',
      requests: 'リクエスト',
      requestsPlaceholder: '追加のリクエストがあればご記入ください。',
      privacyConsent: '個人情報の収集・利用に同意します。',
      privacyNotice: '収集された個人情報は見積送信のみに使用され、目的達成後すぐに削除されます。',
      submitting: '送信中...',
      submit: '見積依頼する',
      successTitle: '見積依頼が完了しました！',
      successMessage: 'ご入力のメールアドレスに見積書をお送りします。',
      newRequest: '新規見積依頼',
      errorEmail: 'メールアドレスを入力してください。',
      errorEmailFormat: '有効なメールアドレスを入力してください。',
      errorPhone: '電話番号を入力してください。',
      errorPhoneFormat: '有効な電話番号を入力してください。',
      errorDate: '日付を選択してください。',
      errorStartTime: '開始時間を選択してください。',
      errorEndTime: '終了時間を選択してください。',
      errorTimeOrder: '終了時間は開始時間より後にしてください。',
      errorPeople: '人数を入力してください。',
      errorPeopleMin: '1名以上を入力してください。',
      errorPrivacy: 'プライバシーポリシーに同意してください。',
      submitError: 'エラーが発生しました。もう一度お試しください。',
    },
    canada: {
      backLink: '← Back to Search',
      title: 'Request Quote',
      description: 'Request a quote for your selected spaces.',
      selectedSpaces: 'Selected Spaces',
      contactInfo: 'Contact Information',
      email: 'Email',
      phone: 'Phone',
      usageInfo: 'Booking Details',
      usageDate: 'Date',
      datePlaceholder: 'Select date',
      startTime: 'Start Time',
      endTime: 'End Time',
      timePlaceholder: 'Select time',
      numberOfPeople: 'Number of Guests',
      peoplePlaceholder: 'e.g. 10',
      additionalRequests: 'Additional Requests',
      requests: 'Requests',
      requestsPlaceholder: 'Please enter any additional requirements.',
      privacyConsent: 'I agree to the collection and use of my personal information.',
      privacyNotice: 'Your information will only be used for sending quotes and will be deleted after.',
      submitting: 'Submitting...',
      submit: 'Request Quote',
      successTitle: 'Quote Request Submitted!',
      successMessage: 'We\'ll send you a quote via email.',
      newRequest: 'New Request',
      errorEmail: 'Please enter your email.',
      errorEmailFormat: 'Please enter a valid email address.',
      errorPhone: 'Please enter your phone number.',
      errorPhoneFormat: 'Please enter a valid phone number.',
      errorDate: 'Please select a date.',
      errorStartTime: 'Please select a start time.',
      errorEndTime: 'Please select an end time.',
      errorTimeOrder: 'End time must be after start time.',
      errorPeople: 'Please enter the number of guests.',
      errorPeopleMin: 'Must be at least 1 person.',
      errorPrivacy: 'Please agree to the privacy policy.',
      submitError: 'An error occurred. Please try again.',
    },
  };

  const text = uiText[country] || uiText.korea;

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    desiredDate: '',
    startTime: '',
    endTime: '',
    numberOfPeople: '',
    requests: '',
    privacyConsent: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = text.errorEmail;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = text.errorEmailFormat;
    }

    if (!formData.phone) {
      newErrors.phone = text.errorPhone;
    } else if (!/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = text.errorPhoneFormat;
    }

    if (!formData.desiredDate) {
      newErrors.desiredDate = text.errorDate;
    }

    if (!formData.startTime) {
      newErrors.startTime = text.errorStartTime;
    }

    if (!formData.endTime) {
      newErrors.endTime = text.errorEndTime;
    }

    // 시작 시간이 종료 시간보다 이후인지 체크
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = text.errorTimeOrder;
    }

    if (!formData.numberOfPeople) {
      newErrors.numberOfPeople = text.errorPeople;
    } else if (formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = text.errorPeopleMin;
    }

    if (!formData.privacyConsent) {
      newErrors.privacyConsent = text.errorPrivacy;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      try {
        // 전화번호에 국가번호 추가
        const fullPhone = `${phoneConfig.code} ${formData.phone}`;

        // Supabase에 저장 (country 포함)
        const { error } = await supabase
          .from('quote_requests')
          .insert([
            {
              email: formData.email,
              phone: fullPhone,
              desired_date: formData.desiredDate,
              desired_time: `${formData.startTime} ~ ${formData.endTime}`,
              number_of_people: parseInt(formData.numberOfPeople),
              requests: formData.requests,
              selected_spaces: selectedSpaces.length > 0 ? JSON.stringify(selectedSpaces) : null,
              form_locale: country, // 폼 제출 국가/언어 (korea, uk, usa 등)
            },
          ]);

        if (error) {
          console.error('Supabase error details:', error.message, error.details, error.hint, error.code);
          throw error;
        }

        console.log('Form submitted to Supabase');
        setIsSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        alert(text.submitError);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="quote-form-container">
        <div className="success-message">
          <h2>{text.successTitle}</h2>
          <p>{text.successMessage}</p>
          <button
            className="submit-btn"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                email: '',
                phone: '',
                desiredDate: '',
                startTime: '',
                endTime: '',
                numberOfPeople: '',
                requests: '',
                privacyConsent: false,
              });
            }}
          >
            {text.newRequest}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-form-container">
      <div className="form-header">
        <Link to={`/${country}`} className="back-link">{text.backLink}</Link>
        <h1>{text.title}</h1>
        <p className="form-description">{text.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="quote-form">
        {selectedSpaces.length > 0 && (
          <div className="selected-spaces-section">
            <h3>{text.selectedSpaces} ({selectedSpaces.length})</h3>
            <div className="selected-spaces-list">
              {selectedSpaces.map((space) => (
                <div key={space.id} className="selected-space-item">
                  <span className="space-item-name">{space.name}</span>
                  <span className="space-item-details">
                    {space.region || space.country} · {space.capacity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>{text.contactInfo}</h3>

          <div className="form-group">
            <label htmlFor="email">{text.email} <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">{text.phone} <span className="required">*</span></label>
            <div className="phone-input-wrapper">
              <span className="country-code">{phoneConfig.code}</span>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={phoneConfig.placeholder}
              />
            </div>
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>{text.usageInfo}</h3>

          <div className="form-group">
            <label htmlFor="desiredDate">{text.usageDate} <span className="required">*</span></label>
            <input
              type="date"
              id="desiredDate"
              name="desiredDate"
              value={formData.desiredDate}
              onChange={handleChange}
            />
            {errors.desiredDate && <span className="error">{errors.desiredDate}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">{text.startTime} <span className="required">*</span></label>
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              >
                <option value="">{text.timePlaceholder}</option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
              {errors.startTime && <span className="error">{errors.startTime}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endTime">{text.endTime} <span className="required">*</span></label>
              <select
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              >
                <option value="">{text.timePlaceholder}</option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
              {errors.endTime && <span className="error">{errors.endTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="numberOfPeople">{text.numberOfPeople} <span className="required">*</span></label>
            <input
              type="number"
              id="numberOfPeople"
              name="numberOfPeople"
              value={formData.numberOfPeople}
              onChange={handleChange}
              min="1"
              placeholder={text.peoplePlaceholder}
            />
            {errors.numberOfPeople && <span className="error">{errors.numberOfPeople}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>{text.additionalRequests}</h3>

          <div className="form-group">
            <label htmlFor="requests">{text.requests}</label>
            <textarea
              id="requests"
              name="requests"
              value={formData.requests}
              onChange={handleChange}
              rows="4"
              placeholder={text.requestsPlaceholder}
            />
          </div>
        </div>

        <div className="form-section privacy-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="privacyConsent"
              name="privacyConsent"
              checked={formData.privacyConsent}
              onChange={handleChange}
            />
            <label htmlFor="privacyConsent">
              {text.privacyConsent} <span className="required">*</span>
            </label>
          </div>
          {errors.privacyConsent && <span className="error">{errors.privacyConsent}</span>}
          <p className="privacy-notice">
            {text.privacyNotice}
          </p>
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? text.submitting : text.submit}
        </button>
      </form>
    </div>
  );
}

export default QuoteRequestForm;
