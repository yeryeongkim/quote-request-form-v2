import { t } from '../lib/countryConfig';
import './MigrationBanner.css';

function MigrationBanner({ onClick, country }) {
  const title = t(country, 'migrationBannerTitle') || 'Try our Booking & Payment Service!';
  const desc = t(country, 'migrationBannerDesc') || 'Start accepting online payments for your space';

  return (
    <div className="migration-banner" onClick={onClick}>
      <div className="migration-banner-content">
        <div className="migration-banner-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="migration-banner-text">
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
        <div className="migration-banner-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default MigrationBanner;
