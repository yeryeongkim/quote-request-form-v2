import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { parseSearchQuery } from '../lib/searchParser';
import { fetchSpaces, filterSpaces } from '../lib/spaces';
import { isValidCountry, DEFAULT_COUNTRY, getCountryConfig, t, COUNTRY_CONFIG } from '../lib/countryConfig';
import SpaceCard from './SpaceCard';
import './SpaceSearch.css';

// 국가 코드 <-> 데이터베이스 국가명 매핑
const COUNTRY_CODE_TO_DB = {
  korea: '한국 (KOR)',
  uk: '영국 (UK)',
  usa: '미국 (USA)',
  japan: '일본 (JPN)',
  canada: '캐나다 (CAN)',
};

const DB_TO_COUNTRY_CODE = {
  '한국 (KOR)': 'korea',
  '영국 (UK)': 'uk',
  '미국 (USA)': 'usa',
  '일본 (JPN)': 'japan',
  '캐나다 (CAN)': 'canada',
};

const SUGGESTED_QUERIES_BY_COUNTRY = {
  korea: [
    '서울 강남에서 20명 파티할 수 있는 곳 찾아줘.',
    '자연광 좋은 화이트 톤 스튜디오 있어?',
    '여의도에서 100명 수용 가능한 대형 홀 보여줘.',
    '종로에 조용한 스터디룸 추천해줘.',
  ],
  uk: [
    'Find a space for 30 people workshop in London.',
    'Looking for an industrial style space in Shoreditch.',
    'Show me venues for 50 person events.',
    'Modern meeting rooms available?',
  ],
  usa: [
    'Find a vintage bar in Brooklyn, New York.',
    'Cozy meeting room in California?',
    'Recommend a 50 person event hall.',
    'Show me nature-friendly spaces.',
  ],
  japan: [
    '東京渋谷で瞑想できるスペースを探して。',
    '禅スタイルの静かなスペースはある？',
    '10名の小規模ミーティングルームをおすすめして。',
    'ミニマルなスタジオを見せて。',
  ],
  canada: [
    'Find a cooking studio in Toronto.',
    'Nordic style space available?',
    'Recommend a place for 20 person workshop.',
    'Show me stylish interior spaces.',
  ],
};

function SpaceSearch() {
  const navigate = useNavigate();
  const { country } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [allSpaces, setAllSpaces] = useState([]);
  const [filteredSpaces, setFilteredSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [parsedFilters, setParsedFilters] = useState(null);
  const [error, setError] = useState('');
  const [selectedSpaces, setSelectedSpaces] = useState([]);

  const countryConfig = getCountryConfig(country);
  const dbCountryName = COUNTRY_CODE_TO_DB[country] || COUNTRY_CODE_TO_DB[DEFAULT_COUNTRY];

  // 유효하지 않은 국가 코드인 경우 기본 국가로 리다이렉트
  useEffect(() => {
    if (!isValidCountry(country)) {
      navigate(`/${DEFAULT_COUNTRY}`, { replace: true });
    }
  }, [country, navigate]);

  // Load all spaces on mount and filter by country
  useEffect(() => {
    async function loadSpaces() {
      setIsLoading(true);
      const spaces = await fetchSpaces();
      setAllSpaces(spaces);
      // Filter by URL country parameter
      if (dbCountryName) {
        setFilteredSpaces(spaces.filter(s => s.country === dbCountryName));
        setHasSearched(true);
      }
      setIsLoading(false);
    }
    loadSpaces();
  }, [dbCountryName]);

  const handleSearch = (query) => {
    if (!query.trim()) {
      setError(t(country, 'enterSearchQuery') || '검색어를 입력해주세요.');
      return;
    }

    setError('');
    setIsSearching(true);
    setHasSearched(true);

    // Parse the search query using keyword matching
    const filters = parseSearchQuery(query);
    setParsedFilters(filters);

    // Start with country-filtered spaces
    const baseSpaces = allSpaces.filter(s => s.country === dbCountryName);

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
    const newCountryCode = e.target.value;
    // Navigate to the new country URL
    navigate(`/${newCountryCode}`);
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
    // Navigate to country-specific quote request page
    navigate(`/${country}/quote`, { state: { selectedSpaces, country } });
  };

  // Get available countries for dropdown
  const availableCountries = Object.entries(COUNTRY_CONFIG).map(([code, config]) => ({
    code,
    name: config.nameEn,
  }));

  // UI 텍스트
  const uiText = {
    korea: {
      title: '공간 검색',
      description: '원하는 조건을 자연어로 입력하면 맞춤 공간을 추천해 드립니다.',
      countryLabel: '국가 선택',
      searchPlaceholder: '원하는 조건을 입력하세요',
      searching: '검색 중...',
      search: '검색',
      suggestedQueries: '추천 검색어:',
      results: '검색 결과',
      noResults: '조건에 맞는 공간이 없습니다.',
      noResultsHint: '다른 검색어로 시도해보세요.',
      selectedCount: '개 공간 선택됨',
      requestQuote: '최종 견적 요청',
      loading: '데이터를 불러오는 중...',
    },
    uk: {
      title: 'Space Search',
      description: 'Enter your requirements in natural language and we\'ll recommend matching spaces.',
      countryLabel: 'Select Country',
      searchPlaceholder: 'Enter your requirements',
      searching: 'Searching...',
      search: 'Search',
      suggestedQueries: 'Suggested:',
      results: 'Results',
      noResults: 'No spaces match your criteria.',
      noResultsHint: 'Try a different search.',
      selectedCount: ' spaces selected',
      requestQuote: 'Request Quote',
      loading: 'Loading...',
    },
    usa: {
      title: 'Space Search',
      description: 'Enter your requirements in natural language and we\'ll recommend matching spaces.',
      countryLabel: 'Select Country',
      searchPlaceholder: 'Enter your requirements',
      searching: 'Searching...',
      search: 'Search',
      suggestedQueries: 'Suggested:',
      results: 'Results',
      noResults: 'No spaces match your criteria.',
      noResultsHint: 'Try a different search.',
      selectedCount: ' spaces selected',
      requestQuote: 'Request Quote',
      loading: 'Loading...',
    },
    japan: {
      title: 'スペース検索',
      description: '希望条件を自然言語で入力すると、おすすめのスペースをご紹介します。',
      countryLabel: '国を選択',
      searchPlaceholder: '希望条件を入力してください',
      searching: '検索中...',
      search: '検索',
      suggestedQueries: 'おすすめ:',
      results: '検索結果',
      noResults: '条件に合うスペースがありません。',
      noResultsHint: '別の検索ワードをお試しください。',
      selectedCount: '件のスペースを選択',
      requestQuote: '見積依頼',
      loading: 'データを読み込み中...',
    },
    canada: {
      title: 'Space Search',
      description: 'Enter your requirements in natural language and we\'ll recommend matching spaces.',
      countryLabel: 'Select Country',
      searchPlaceholder: 'Enter your requirements',
      searching: 'Searching...',
      search: 'Search',
      suggestedQueries: 'Suggested:',
      results: 'Results',
      noResults: 'No spaces match your criteria.',
      noResultsHint: 'Try a different search.',
      selectedCount: ' spaces selected',
      requestQuote: 'Request Quote',
      loading: 'Loading...',
    },
  };

  const text = uiText[country] || uiText.korea;

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>{text.title}</h1>
        <p className="search-description">
          {text.description}
        </p>
      </div>

      <div className="country-filter">
        <label htmlFor="country-select" className="country-label">{text.countryLabel}</label>
        <select
          id="country-select"
          className="country-select"
          value={country}
          onChange={handleCountryChange}
          disabled={isLoading}
        >
          {availableCountries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-box">
          <div className="search-input-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={text.searchPlaceholder}
              className="search-input"
              disabled={isSearching || isLoading}
            />
            <button
              type="submit"
              className="search-btn"
              disabled={isSearching || isLoading}
            >
              {isSearching ? text.searching : text.search}
            </button>
          </div>
          <div className="suggestions-inside">
            <span className="suggestions-label">{text.suggestedQueries}</span>
            <div className="suggestion-tags">
              {(SUGGESTED_QUERIES_BY_COUNTRY[country] || SUGGESTED_QUERIES_BY_COUNTRY.korea).map((suggestion, index) => (
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
        </div>
        {error && <span className="search-error">{error}</span>}
      </form>

      {isLoading && (
        <div className="loading-state">{text.loading}</div>
      )}

      {!isLoading && hasSearched && (
        <div className="search-results">
          <div className="results-header">
            <h2>{text.results} ({filteredSpaces.length})</h2>
            {parsedFilters && (
              <div className="parsed-filters">
                {parsedFilters.region && (
                  <span className="filter-tag">{parsedFilters.region}</span>
                )}
                {parsedFilters.capacity && (
                  <span className="filter-tag">{parsedFilters.capacity}+</span>
                )}
                {parsedFilters.budget && (
                  <span className="filter-tag">{parsedFilters.budget}</span>
                )}
                {parsedFilters.spaceType && (
                  <span className="filter-tag">{parsedFilters.spaceType}</span>
                )}
                {parsedFilters.style && (
                  <span className="filter-tag">{parsedFilters.style}</span>
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
              <p>{text.noResults}</p>
              <p className="no-results-hint">{text.noResultsHint}</p>
            </div>
          )}
        </div>
      )}

      {selectedSpaces.length > 0 && (
        <div className="floating-bar">
          <div className="floating-bar-content">
            <span className="selected-count">{selectedSpaces.length}{text.selectedCount}</span>
            <button className="quote-request-btn" onClick={handleQuoteRequest}>
              {text.requestQuote}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpaceSearch;
