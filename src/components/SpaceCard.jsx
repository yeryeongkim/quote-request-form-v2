import './SpaceCard.css';

function SpaceCard({ space, isSelected, onSelect, selectable = false }) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(space);
    }
  };

  return (
    <div
      className={`space-card ${selectable ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      {selectable && (
        <div className="space-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <h3 className="space-name">{space.name}</h3>
      <div className="space-details">
        <div className="space-detail">
          <span className="detail-icon">📍</span>
          <span className="detail-text">
            {space.region}{space.subRegion ? `, ${space.subRegion}` : ''}
          </span>
        </div>
        <div className="space-detail">
          <span className="detail-icon">👥</span>
          <span className="detail-text">{space.minCapacity}~{space.capacity}명</span>
        </div>
        {space.type && (
          <div className="space-detail">
            <span className="detail-icon">🏢</span>
            <span className="detail-text">{space.type}</span>
          </div>
        )}
        {space.area && (
          <div className="space-detail">
            <span className="detail-icon">📐</span>
            <span className="detail-text">{space.area}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpaceCard;
