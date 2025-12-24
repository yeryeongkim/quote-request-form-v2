import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCountryConfig, DEFAULT_COUNTRY, t } from '../lib/countryConfig';
import './TemplateSettingsModal.css';

function TemplateSettingsModal({ template, userId, onClose, onSave, country = DEFAULT_COUNTRY }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const countryConfig = getCountryConfig(country);

  // 화폐는 국가별로 고정
  const existingSettlementInfo = template?.settlement_info || {};
  const [formData, setFormData] = useState({
    spacePhoto: null,
    spacePhotoPreview: template?.space_photo_url || '',
    defaultPrice: template?.default_price ? template.default_price.toLocaleString() : '',
    priceIncludes: template?.price_includes || '',
    paymentMethod: template?.payment_method || 'onsite',
    settlementInfo: {
      bankName: existingSettlementInfo.bankName || '',
      accountNumber: existingSettlementInfo.accountNumber || '',
      accountHolder: existingSettlementInfo.accountHolder || '',
      sortCode: existingSettlementInfo.sortCode || '',
      routingNumber: existingSettlementInfo.routingNumber || '',
      branchName: existingSettlementInfo.branchName || '',
      transitNumber: existingSettlementInfo.transitNumber || '',
      institutionNumber: existingSettlementInfo.institutionNumber || '',
    }
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

  const handleSettlementInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      settlementInfo: {
        ...prev.settlementInfo,
        [name]: value,
      }
    }));
    setError('');
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
        currency: countryConfig.currency, // 국가별 고정 화폐
        price_includes: formData.priceIncludes || null,
        payment_method: formData.paymentMethod,
        settlement_info: formData.paymentMethod === 'online' ? formData.settlementInfo : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('host_quote_templates')
        .upsert(templateData, { onConflict: 'host_id' })
        .select()
        .single();

      if (error) throw error;

      setSuccessMessage(t(country, 'templateSaved'));
      setTimeout(() => onSave(data), 1000);
    } catch (err) {
      console.error('Template save error:', err);
      setError(err.message || t(country, 'templateSaveError'));
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

        <h2>{t(country, 'templateTitle')}</h2>
        <p className="template-description">
          {t(country, 'templateDesc')}
        </p>

        {error && <div className="template-error">{error}</div>}
        {successMessage && <div className="template-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="template-form">
          {/* Photo Upload Section */}
          <div className="template-section">
            <label className="template-label">{t(country, 'spacePhoto')}</label>
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

          {/* Price Section */}
          <div className="template-section">
            <label className="template-label">{t(country, 'defaultPrice')}</label>
            <div className="price-row">
              <input
                type="text"
                name="defaultPrice"
                value={formData.defaultPrice}
                onChange={handlePriceChange}
                placeholder="100,000"
                className="price-input"
              />
              <span className="currency-fixed-display">
                {countryConfig.currency} ({countryConfig.currencySymbol})
              </span>
            </div>
          </div>

          {/* Price Includes Section */}
          <div className="template-section">
            <label className="template-label">{t(country, 'priceIncludes')}</label>
            <textarea
              name="priceIncludes"
              value={formData.priceIncludes}
              onChange={handleChange}
              rows="3"
              placeholder={t(country, 'priceIncludesPlaceholder')}
            />
          </div>

          {/* Payment Method Section */}
          <div className="template-section">
            <label className="template-label">{t(country, 'paymentMethod')}</label>
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

          {/* 온라인결제 선택 시 정산 정보 입력 */}
          {formData.paymentMethod === 'online' && (
            <div className="template-section settlement-section">
              <label className="template-label">{t(country, 'settlementInfo')}</label>
              <p className="settlement-desc">{t(country, 'settlementInfoDesc')}</p>

              <div className="settlement-fields">
                {/* 공통 필드: 은행명 */}
                <div className="settlement-field">
                  <label>{t(country, 'bankName')}</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.settlementInfo.bankName}
                    onChange={handleSettlementInfoChange}
                    placeholder={t(country, 'bankNamePlaceholder')}
                  />
                </div>

                {/* Japan: 지점명 */}
                {country === 'japan' && (
                  <div className="settlement-field">
                    <label>{t(country, 'branchName')}</label>
                    <input
                      type="text"
                      name="branchName"
                      value={formData.settlementInfo.branchName}
                      onChange={handleSettlementInfoChange}
                      placeholder={t(country, 'branchNamePlaceholder')}
                    />
                  </div>
                )}

                {/* UK: Sort Code */}
                {country === 'uk' && (
                  <div className="settlement-field">
                    <label>{t(country, 'sortCode')}</label>
                    <input
                      type="text"
                      name="sortCode"
                      value={formData.settlementInfo.sortCode}
                      onChange={handleSettlementInfoChange}
                      placeholder={t(country, 'sortCodePlaceholder')}
                      maxLength={8}
                    />
                  </div>
                )}

                {/* USA: Routing Number */}
                {country === 'usa' && (
                  <div className="settlement-field">
                    <label>{t(country, 'routingNumber')}</label>
                    <input
                      type="text"
                      name="routingNumber"
                      value={formData.settlementInfo.routingNumber}
                      onChange={handleSettlementInfoChange}
                      placeholder={t(country, 'routingNumberPlaceholder')}
                      maxLength={9}
                    />
                  </div>
                )}

                {/* Canada: Transit Number + Institution Number */}
                {country === 'canada' && (
                  <div className="settlement-row">
                    <div className="settlement-field">
                      <label>{t(country, 'transitNumber')}</label>
                      <input
                        type="text"
                        name="transitNumber"
                        value={formData.settlementInfo.transitNumber}
                        onChange={handleSettlementInfoChange}
                        placeholder={t(country, 'transitNumberPlaceholder')}
                        maxLength={5}
                      />
                    </div>
                    <div className="settlement-field">
                      <label>{t(country, 'institutionNumber')}</label>
                      <input
                        type="text"
                        name="institutionNumber"
                        value={formData.settlementInfo.institutionNumber}
                        onChange={handleSettlementInfoChange}
                        placeholder={t(country, 'institutionNumberPlaceholder')}
                        maxLength={3}
                      />
                    </div>
                  </div>
                )}

                {/* 공통 필드: 계좌번호 */}
                <div className="settlement-field">
                  <label>{t(country, 'accountNumber')}</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.settlementInfo.accountNumber}
                    onChange={handleSettlementInfoChange}
                    placeholder={t(country, 'accountNumberPlaceholder')}
                  />
                </div>

                {/* 공통 필드: 예금주 */}
                <div className="settlement-field">
                  <label>{t(country, 'accountHolder')}</label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={formData.settlementInfo.accountHolder}
                    onChange={handleSettlementInfoChange}
                    placeholder={t(country, 'accountHolderPlaceholder')}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="template-submit-btn" disabled={isLoading}>
            {isLoading ? t(country, 'savingTemplate') : t(country, 'saveTemplate')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TemplateSettingsModal;
