// Keyword-based search query parser (replaces Gemini AI)

// Region keywords mapping (Korean -> English for DB matching)
const REGION_KEYWORDS = {
  // Korea
  '서울': 'Seoul', '강남': 'Gangnam', '종로': 'Jongno', '여의도': 'Yeouido', '성남': 'Seongnam',
  '홍대': 'Hongdae', '이태원': 'Itaewon', '신촌': 'Sinchon',
  // UK
  '런던': 'London', 'london': 'London', '쇼디치': 'Shoreditch', 'shoreditch': 'Shoreditch',
  '해크니': 'Hackney', 'hackney': 'Hackney', '소호': 'Soho', 'soho': 'Soho',
  '코벤트가든': 'Covent Garden', '맨체스터': 'Manchester', 'manchester': 'Manchester',
  // USA
  '뉴욕': 'New York', 'new york': 'New York', '브루클린': 'Brooklyn', 'brooklyn': 'Brooklyn',
  '캘리포니아': 'California', 'california': 'California', '버클리': 'Berkeley', 'berkeley': 'Berkeley',
  '로스앤젤레스': 'Los Angeles', 'la': 'Los Angeles',
  // Japan
  '도쿄': 'Tokyo', 'tokyo': 'Tokyo', '시부야': 'Shibuya', 'shibuya': 'Shibuya',
  '신주쿠': 'Shinjuku', '롯폰기': 'Roppongi',
  // Canada
  '토론토': 'Toronto', 'toronto': 'Toronto', '밴쿠버': 'Vancouver', 'vancouver': 'Vancouver',
};

// Space type keywords
const SPACE_TYPE_KEYWORDS = {
  '파티': '파티룸', '파티룸': '파티룸', 'party': '파티룸',
  '스터디': '스터디룸', '스터디룸': '스터디룸', 'study': '스터디룸',
  '워크숍': '워크숍 공간', 'workshop': '워크숍 공간',
  '스튜디오': '스튜디오', 'studio': '스튜디오', '댄스': '스튜디오',
  '이벤트': '이벤트 홀', 'event': '이벤트 홀',
  '대형': '대형 홀', '홀': '대형 홀',
  '쿠킹': '쿠킹 스튜디오', '요리': '쿠킹 스튜디오', 'cooking': '쿠킹 스튜디오',
  '명상': '명상실', 'meditation': '명상실',
  '모임': '소규모 모임실', '회의': '소규모 모임실', 'meeting': '소규모 모임실',
  '세미나': '워크숍 공간', 'seminar': '워크숍 공간',
};

// Style keywords
const STYLE_KEYWORDS = [
  '빈티지', 'vintage',
  '화이트', 'white', '화이트 톤',
  '자연광', 'natural light',
  '인더스트리얼', 'industrial',
  '모던', 'modern',
  '미니멀', 'minimal',
  '젠', 'zen',
  '북유럽', 'nordic', 'scandinavian',
  '아늑', 'cozy',
  '루프탑', 'rooftop',
  '힙한', 'hipster',
  '감각적', '조용한',
];

export function parseSearchQuery(query) {
  if (!query || !query.trim()) {
    return null;
  }

  const lowerQuery = query.toLowerCase();
  const filters = {
    region: null,
    capacity: null,
    budget: null,
    spaceType: null,
    style: null,
  };

  // Extract region
  for (const [keyword, region] of Object.entries(REGION_KEYWORDS)) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      filters.region = region;
      break;
    }
  }

  // Extract capacity (number followed by "명" or standalone numbers near people-related words)
  const capacityMatch = query.match(/(\d+)\s*명/);
  if (capacityMatch) {
    filters.capacity = parseInt(capacityMatch[1]);
  } else {
    // Try to find numbers near capacity-related words
    const numberMatch = query.match(/(\d+)\s*(인|people|person|사람)/i);
    if (numberMatch) {
      filters.capacity = parseInt(numberMatch[1]);
    }
  }

  // Extract budget (number followed by currency or "원", "이하")
  const budgetMatch = query.match(/(\d+)\s*(원|만원|won|usd|gbp|달러|파운드)?\s*(이하|까지|미만)?/i);
  if (budgetMatch && (budgetMatch[2] || budgetMatch[3])) {
    let budget = parseInt(budgetMatch[1]);
    if (budgetMatch[2] === '만원') {
      budget *= 10000;
    }
    filters.budget = budget;
  }

  // Extract space type
  for (const [keyword, spaceType] of Object.entries(SPACE_TYPE_KEYWORDS)) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      filters.spaceType = spaceType;
      break;
    }
  }

  // Extract style
  for (const keyword of STYLE_KEYWORDS) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      filters.style = keyword;
      break;
    }
  }

  // Check if any filter was found
  const hasFilters = Object.values(filters).some(v => v !== null);
  return hasFilters ? filters : null;
}
