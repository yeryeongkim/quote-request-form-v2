import { t } from '../lib/countryConfig';
import './MigrationBanner.css';

function MigrationBanner({ onClick, country }) {
  // Debug: Log when component renders
  console.log('MigrationBanner rendering, country:', country);

  // Fallback texts in case translation fails
  const title = t(country, 'migrationBannerTitle') || 'Try our Booking & Payment Service!';
  const desc = t(country, 'migrationBannerDesc') || 'Start accepting online payments for your space';

  return (
    <div
      className="migration-banner"
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #4F00F8 0%, #3700B3 100%)',
        padding: '16px 32px',
        cursor: 'pointer',
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="migration-banner-content"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div className="migration-banner-icon" style={{ color: 'white', flexShrink: 0 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="migration-banner-text" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 4px 0' }}>
            {title}
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            {desc}
          </p>
        </div>
        <div className="migration-banner-arrow" style={{ color: 'white', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default MigrationBanner;
