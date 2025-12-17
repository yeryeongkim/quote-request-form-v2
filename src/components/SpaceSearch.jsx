import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseSearchQuery } from '../lib/searchParser';
import { fetchSpaces, filterSpaces } from '../lib/spaces';
import SpaceCard from './SpaceCard';
import './SpaceSearch.css';

const SUGGESTED_QUERIES_BY_COUNTRY = {
  '': [
    '20명이 세미나할 수 있는 공간 찾아줘.',
    '자연광 좋은 화이트 톤 스튜디오 있어?',
    '50명 워크숍 가능한 곳 추천해줘.',
    '빈티지 분위기 이벤트 홀 보여줘.',
  ],
  '한국 (KOR)': [
    '서울 강남에서 20명 파티할 수 있는 곳 찾아줘.',
    '자연광 좋은 화이트 톤 스튜디오 있어?',
    '여의도에서 100명 수용 가능한 대형 홀 보여줘.',
    '종로에 조용한 스터디룸 추천해줘.',
  ],
  '영국 (UK)': [
    '런던에서 30명 워크숍할 수 있는 공간 찾아줘.',
    '쇼디치에 힙한 인더스트리얼 스타일 공간 있어?',
    '50명 이벤트 가능한 곳 추천해줘.',
    '모던한 분위기의 회의실 보여줘.',
  ],
  '미국 (USA)': [
    '뉴욕에 있는 브루클린 빈티지 바를 찾아줘.',
    '캘리포니아에 아늑한 모임실 있어?',
    '50명 이벤트 홀 추천해줘.',
    '자연 친화적인 공간 보여줘.',
  ],
  '일본 (JPN)': [
    '도쿄 시부야에 명상할 수 있는 공간 찾아줘.',
    '젠 스타일의 조용한 공간 있어?',
    '10명 소규모 모임실 추천해줘.',
    '미니멀한 스튜디오 보여줘.',
  ],
  '캐나다 (CAN)': [
    '토론토에 쿠킹 스튜디오 찾아줘.',
    '북유럽 스타일 공간 있어?',
    '20명 워크숍 가능한 곳 추천해줘.',
    '감각적인 인테리어 공간 보여줘.',
  ],
};

function SpaceSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allSpaces, setAllSpaces] = useState([]);
  const [filteredSpaces, setFilteredSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [parsedFilters, setParsedFilters] = useState(null);
  const [error, setError] = useState('');
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('영국 (UK)');

  // Extract unique countries from loaded spaces
  const countries = [...new Set(allSpaces.map(s => s.country).filter(Boolean))].sort();

  // Load all spaces on mount
  useEffect(() => {
    async function loadSpaces() {
      setIsLoading(true);
      const spaces = await fetchSpaces();
      setAllSpaces(spaces);
      // Filter by default country on initial load
      if (selectedCountry) {
        setFilteredSpaces(spaces.filter(s => s.country === selectedCountry));
        setHasSearched(true);
      }
      setIsLoading(false);
    }
    loadSpaces();
  }, []);

  const handleSearch = (query) => {
    if (!query.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setError('');
    setIsSearching(true);
    setHasSearched(true);

    // Parse the search query using keyword matching
    const filters = parseSearchQuery(query);
    setParsedFilters(filters);

    // Start with country-filtered spaces if a country is selected
    const baseSpaces = selectedCountry
      ? allSpaces.filter(s => s.country === selectedCountry)
      : allSpaces;

    if (filters) {
      // Filter spaces based on parsed conditions
      const results = filterSpaces(baseSpaces, filters);
      setFilteredSpaces(results);
    } else {
      // If no filters parsed, do text search on space names
      const lowerQuery = query.toLowerCase();
      const results = baseSpaces.filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.type.toLowerCase().includes(lowerQuery) ||
        s.style.toLowerCase().includes(lowerQuery) ||
        s.region.toLowerCase().includes(lowerQuery)
      );
      setFilteredSpaces(results.length > 0 ? results : baseSpaces);
    }

    setIsSearching(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setHasSearched(true);
    setSearchQuery('');
    setParsedFilters(null);

    if (country) {
      setFilteredSpaces(allSpaces.filter(s => s.country === country));
    } else {
      setFilteredSpaces(allSpaces);
    }
  };

  const handleSpaceSelect = (space) => {
    setSelectedSpaces((prev) => {
      const isAlreadySelected = prev.some((s) => s.id === space.id);
      if (isAlreadySelected) {
        return prev.filter((s) => s.id !== space.id);
      } else {
        return [...prev, space];
      }
    });
  };

  const handleQuoteRequest = () => {
    navigate('/quote', { state: { selectedSpaces } });
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>공간 검색</h1>
        <p className="search-description">
          원하는 조건을 자연어로 입력하면 맞춤 공간을 추천해 드립니다.
        </p>
      </div>

      <div className="country-filter">
        <label htmlFor="country-select" className="country-label">국가 선택 <span className="required">*</span></label>
        <select
          id="country-select"
          className="country-select"
          value={selectedCountry}
          onChange={handleCountryChange}
          disabled={isLoading}
        >
          <option value="" disabled>국가를 선택하세요</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      {!selectedCountry && (
        <div className="country-required-message">
          국가를 먼저 선택해주세요.
        </div>
      )}

      {selectedCountry && (
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="원하는 조건을 입력하세요"
              className="search-input"
              disabled={isSearching || isLoading}
            />
            <button
              type="submit"
              className="search-btn"
              disabled={isSearching || isLoading}
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </div>
          {error && <span className="search-error">{error}</span>}
        </form>
      )}

      {selectedCountry && (
        <div className="suggestions">
          <span className="suggestions-label">추천 검색어:</span>
          <div className="suggestion-tags">
            {(SUGGESTED_QUERIES_BY_COUNTRY[selectedCountry] || SUGGESTED_QUERIES_BY_COUNTRY['']).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="suggestion-tag"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isSearching || isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading-state">데이터를 불러오는 중...</div>
      )}

      {!isLoading && hasSearched && (
        <div className="search-results">
          <div className="results-header">
            <h2>검색 결과 ({filteredSpaces.length}개)</h2>
            {parsedFilters && (
              <div className="parsed-filters">
                {parsedFilters.region && (
                  <span className="filter-tag">지역: {parsedFilters.region}</span>
                )}
                {parsedFilters.capacity && (
                  <span className="filter-tag">인원: {parsedFilters.capacity}명+</span>
                )}
                {parsedFilters.budget && (
                  <span className="filter-tag">예산: {parsedFilters.budget} 이하</span>
                )}
                {parsedFilters.spaceType && (
                  <span className="filter-tag">유형: {parsedFilters.spaceType}</span>
                )}
                {parsedFilters.style && (
                  <span className="filter-tag">스타일: {parsedFilters.style}</span>
                )}
              </div>
            )}
          </div>

          {filteredSpaces.length > 0 ? (
            <div className="spaces-grid">
              {filteredSpaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  selectable={true}
                  isSelected={selectedSpaces.some((s) => s.id === space.id)}
                  onSelect={handleSpaceSelect}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>조건에 맞는 공간이 없습니다.</p>
              <p className="no-results-hint">다른 검색어로 시도해보세요.</p>
            </div>
          )}
        </div>
      )}

      {selectedSpaces.length > 0 && (
        <div className="floating-bar">
          <div className="floating-bar-content">
            <span className="selected-count">{selectedSpaces.length}개 공간 선택됨</span>
            <button className="quote-request-btn" onClick={handleQuoteRequest}>
              최종 견적 요청
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpaceSearch;
