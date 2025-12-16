import { useState } from 'react';
import { Link } from 'react-router-dom';
import './QuoteRequestForm.css';

function QuoteRequestForm() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    desiredDate: '',
    desiredTime: '',
    numberOfPeople: '',
    requests: '',
    privacyConsent: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOSlbxs5HUbkHPIWv6nywpoCviMJoOAEjrSawpOYejo41vTnSOiQzAxkxDQZiuhZporw/exec';

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
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.phone) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 연락처 형식을 입력해주세요.';
    }

    if (!formData.desiredDate) {
      newErrors.desiredDate = '이용 날짜를 선택해주세요.';
    }

    if (!formData.desiredTime) {
      newErrors.desiredTime = '이용 시간을 선택해주세요.';
    }

    if (!formData.numberOfPeople) {
      newErrors.numberOfPeople = '인원 수를 입력해주세요.';
    } else if (formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = '1명 이상 입력해주세요.';
    }

    if (!formData.privacyConsent) {
      newErrors.privacyConsent = '개인정보 수집에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      try {
        // 구글 스프레드시트에 저장
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            desiredDate: formData.desiredDate,
            desiredTime: formData.desiredTime,
            numberOfPeople: formData.numberOfPeople,
            requests: formData.requests,
          }),
        });

        console.log('Form submitted to Google Sheets');
        setIsSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="quote-form-container">
        <div className="success-message">
          <h2>견적 요청이 완료되었습니다!</h2>
          <p>입력하신 이메일로 견적서를 보내드리겠습니다.</p>
          <button
            className="submit-btn"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                email: '',
                phone: '',
                desiredDate: '',
                desiredTime: '',
                numberOfPeople: '',
                requests: '',
                privacyConsent: false,
              });
            }}
          >
            새로운 견적 요청
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-form-container">
      <div className="form-header">
        <div>
          <h1>최종 견적 요청</h1>
          <p className="form-description">공간 후보 리스트에 대한 견적을 요청합니다.</p>
        </div>
        <Link to="/admin" className="admin-link">관리자</Link>
      </div>

      <form onSubmit={handleSubmit} className="quote-form">
        <div className="form-section">
          <h3>연락처 정보</h3>

          <div className="form-group">
            <label htmlFor="email">이메일 <span className="required">*</span></label>
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
            <label htmlFor="phone">연락처 <span className="required">*</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>이용 정보</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="desiredDate">이용 날짜 <span className="required">*</span></label>
              <input
                type="date"
                id="desiredDate"
                name="desiredDate"
                value={formData.desiredDate}
                onChange={handleChange}
              />
              {errors.desiredDate && <span className="error">{errors.desiredDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="desiredTime">이용 시간 <span className="required">*</span></label>
              <input
                type="time"
                id="desiredTime"
                name="desiredTime"
                value={formData.desiredTime}
                onChange={handleChange}
              />
              {errors.desiredTime && <span className="error">{errors.desiredTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="numberOfPeople">인원 수 <span className="required">*</span></label>
            <input
              type="number"
              id="numberOfPeople"
              name="numberOfPeople"
              value={formData.numberOfPeople}
              onChange={handleChange}
              min="1"
              placeholder="예: 10"
            />
            {errors.numberOfPeople && <span className="error">{errors.numberOfPeople}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>추가 요청사항</h3>

          <div className="form-group">
            <label htmlFor="requests">요청사항</label>
            <textarea
              id="requests"
              name="requests"
              value={formData.requests}
              onChange={handleChange}
              rows="4"
              placeholder="추가로 요청하실 사항이 있으시면 작성해주세요."
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
              개인정보 수집 및 이용에 동의합니다. <span className="required">*</span>
            </label>
          </div>
          {errors.privacyConsent && <span className="error">{errors.privacyConsent}</span>}
          <p className="privacy-notice">
            수집된 개인정보는 견적 발송 및 상담 목적으로만 사용되며, 목적 달성 후 즉시 파기됩니다.
          </p>
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? '제출 중...' : '견적 요청하기'}
        </button>
      </form>
    </div>
  );
}

export default QuoteRequestForm;
