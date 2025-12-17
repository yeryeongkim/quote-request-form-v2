import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './TemplateSettingsModal.css';

function TemplateSettingsModal({ template, userId, onClose, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    spacePhoto: null,
    spacePhotoPreview: template?.space_photo_url || '',
    defaultPrice: template?.default_price ? template.default_price.toLocaleString() : '',
    currency: template?.currency || 'KRW',
    priceIncludes: template?.price_includes || '',
    paymentMethod: template?.payment_method || 'onsite',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setFormData((prev) => ({ ...prev, defaultPrice: formatted }));
    setError('');
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
    const fileName = `${userId}/template/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('space-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('space-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let photoUrl = template?.space_photo_url || '';

      if (formData.spacePhoto) {
        photoUrl = await uploadImage(formData.spacePhoto);
      }

      const templateData = {
        host_id: userId,
        space_photo_url: photoUrl || null,
        default_price: formData.defaultPrice
          ? parseInt(formData.defaultPrice.replace(/,/g, ''))
          : null,
        currency: formData.currency,
        price_includes: formData.priceIncludes || null,
        payment_method: formData.paymentMethod,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('host_quote_templates')
        .upsert(templateData, { onConflict: 'host_id' })
        .select()
        .single();

      if (error) throw error;

      setSuccessMessage('템플릿이 저장되었습니다.');
      setTimeout(() => onSave(data), 1000);
    } catch (err) {
      console.error('Template save error:', err);
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="template-modal-backdrop" onClick={handleBackdropClick}>
      <div className="template-modal">
        <button className="template-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>기본 견적서 설정</h2>
        <p className="template-description">
          자주 사용하는 견적 정보를 미리 저장하세요.
        </p>

        {error && <div className="template-error">{error}</div>}
        {successMessage && <div className="template-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="template-form">
          {/* Photo Upload Section */}
          <div className="template-section">
            <label className="template-label">공간 사진</label>
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

          {/* Price Section */}
          <div className="template-section">
            <label className="template-label">기본 견적 금액</label>
            <div className="price-row">
              <input
                type="text"
                name="defaultPrice"
                value={formData.defaultPrice}
                onChange={handlePriceChange}
                placeholder="예: 100,000"
                className="price-input"
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="currency-select"
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Price Includes Section */}
          <div className="template-section">
            <label className="template-label">가격 포함 항목</label>
            <textarea
              name="priceIncludes"
              value={formData.priceIncludes}
              onChange={handleChange}
              rows="3"
              placeholder="예: 장소 대여, 음향 장비, 주차 2대 무료"
            />
          </div>

          {/* Payment Method Section */}
          <div className="template-section">
            <label className="template-label">결제 방식</label>
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

          <button type="submit" className="template-submit-btn" disabled={isLoading}>
            {isLoading ? '저장 중...' : '템플릿 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TemplateSettingsModal;
