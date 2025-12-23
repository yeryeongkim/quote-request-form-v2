import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { t, formatDate } from '../lib/countryConfig';
import './MigrationRequestModal.css';

function MigrationRequestModal({ user, spaces, country, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    hostName: user?.user_metadata?.name || user?.user_metadata?.full_name || '',
    hostEmail: user?.email || '',
    hostPhone: '',
    selectedSpaceIds: [],
    consentDataMigration: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const toggleSpace = (spaceId) => {
    setFormData((prev) => ({
      ...prev,
      selectedSpaceIds: prev.selectedSpaceIds.includes(spaceId)
        ? prev.selectedSpaceIds.filter((id) => id !== spaceId)
        : [...prev.selectedSpaceIds, spaceId],
    }));
    setError('');
  };

  const handleConsentChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      consentDataMigration: e.target.checked,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('migration_requests')
        .insert({
          host_id: user.id,
          host_name: formData.hostName,
          host_email: formData.hostEmail,
          host_phone: formData.hostPhone || null,
          selected_space_ids: formData.selectedSpaceIds,
          consent_data_migration: formData.consentDataMigration,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccessMessage(t(country, 'migrationRequestSuccess'));
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Migration request error:', err);
      setError(err.message || t(country, 'migrationRequestError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isFormValid =
    formData.hostName.trim() !== '' &&
    formData.selectedSpaceIds.length > 0 &&
    formData.consentDataMigration;

  return (
    <div className="migration-modal-backdrop" onClick={handleBackdropClick}>
      <div className="migration-modal">
        <button className="migration-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>{t(country, 'migrationModalTitle')}</h2>
        <p className="migration-modal-description">
          {t(country, 'migrationModalDesc')}
        </p>

        {error && <div className="migration-error">{error}</div>}
        {successMessage && <div className="migration-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="migration-form">
          {/* Host Name */}
          <div className="migration-section">
            <label className="migration-label">
              {t(country, 'hostName')} <span className="required">*</span>
            </label>
            <input
              type="text"
              name="hostName"
              value={formData.hostName}
              onChange={handleChange}
              required
              className="migration-input"
            />
          </div>

          {/* Host Email - Read Only */}
          <div className="migration-section">
            <label className="migration-label">{t(country, 'hostEmail')}</label>
            <input
              type="email"
              name="hostEmail"
              value={formData.hostEmail}
              readOnly
              className="migration-input readonly"
            />
          </div>

          {/* Host Phone */}
          <div className="migration-section">
            <label className="migration-label">{t(country, 'hostPhone')}</label>
            <input
              type="tel"
              name="hostPhone"
              value={formData.hostPhone}
              onChange={handleChange}
              className="migration-input"
            />
          </div>

          {/* Space Selection */}
          <div className="migration-section">
            <label className="migration-label">
              {t(country, 'selectSpaces')} <span className="required">*</span>
            </label>
            {spaces && spaces.length > 0 ? (
              <div className="space-selection-list">
                {spaces.map((space) => (
                  <label key={space.id} className="space-checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.selectedSpaceIds.includes(space.id)}
                      onChange={() => toggleSpace(space.id)}
                    />
                    <span className="space-info">
                      <span className="space-name">{space.space_name || t(country, 'unnamedSpace')}</span>
                      <span className="space-date">
                        {formatDate(space.quote_requests?.desired_date || space.created_at, country)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="no-spaces-message">
                {t(country, 'noSpacesAvailable')}
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="migration-section consent-section">
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={formData.consentDataMigration}
                onChange={handleConsentChange}
                required
              />
              <span>{t(country, 'consentText')}</span>
            </label>
          </div>

          <button
            type="submit"
            className="migration-submit-btn"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? t(country, 'submitting') : t(country, 'submitMigrationRequest')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MigrationRequestModal;
