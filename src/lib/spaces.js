const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1zjWeHcaYDrJ4Bgtf2R0J4nqqODoyT8Cup950scDTFA8/export?format=csv';

// Parse CSV text into array of objects
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  const spaces = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 9) {
      // Clean area value (remove LaTeX formatting like "$70\text{ m}^2$" or "$350\text{ sq ft}$")
      const rawArea = values[11] || '';
      let cleanArea = rawArea
        .replace(/^\$/, '')           // Remove leading $
        .replace(/\$$/, '')           // Remove trailing $
        .replace(/\\text\{\s*/, ' ')  // Replace \text{ with space
        .replace(/\}/, '')            // Remove }
        .replace(/\^2/, '²')          // Replace ^2 with ²
        .trim();

      // Format: "70 m²" or "350 sq ft"
      cleanArea = cleanArea.replace(/\s+/g, ' ');

      const space = {
        id: i,
        hostEmail: values[0] || '',
        name: values[1] || '',
        minCapacity: parseInt(values[2]) || 1,
        capacity: parseInt(values[3]) || 0,
        price: values[4] || '',
        priceValue: extractPriceValue(values[4]),
        currency: values[5] || '',
        country: values[6] || '',
        region: values[7] || '',
        subRegion: values[8] || '',
        type: values[9] || '',
        style: values[10] || '',
        area: cleanArea || ''
      };

      // Only include spaces with valid data
      if (space.name && space.capacity > 0) {
        spaces.push(space);
      }
    }
  }

  return spaces;
}

// Extract numeric value from price string (e.g., "300 GBP" -> 300)
function extractPriceValue(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Fetch spaces from Google Sheets
export async function fetchSpaces() {
  try {
    // Add cache-busting parameter to prevent browser from serving stale data
    const cacheBuster = `&_t=${Date.now()}`;
    const response = await fetch(SHEETS_CSV_URL + cacheBuster);
    if (!response.ok) {
      throw new Error(`Failed to fetch spaces: ${response.status}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return [];
  }
}

// Filter spaces based on parsed search conditions
export function filterSpaces(spaces, filters) {
  if (!filters) return spaces;

  // Parse numeric filters to ensure they're numbers
  const capacityFilter = filters.capacity ? parseInt(filters.capacity) : null;
  const budgetFilter = filters.budget ? parseInt(filters.budget) : null;

  console.log('Applying filters:', { ...filters, capacityFilter, budgetFilter });

  // Normalize region name to match DB values
  const normalizeRegion = (region) => {
    if (!region) return '';
    const normalized = region.toLowerCase().trim();

    // Korean to DB region mapping
    const mapping = {
      // UK
      '런던': 'london',
      'london': 'london',
      '쇼디치': 'shoreditch',
      'shoreditch': 'shoreditch',
      '맨체스터': 'manchester',
      'manchester': 'manchester',
      '스코틀랜드': 'scotland',
      'scotland': 'scotland',
      '에든버러': 'edinburgh',
      'edinburgh': 'edinburgh',
      '코벤트가든': 'covent garden',
      '해크니': 'hackney',
      '소호': 'soho',
      // USA
      '뉴욕': 'new york',
      'new york': 'new york',
      '브루클린': 'brooklyn',
      'brooklyn': 'brooklyn',
      '캘리포니아': 'california',
      'california': 'california',
      '버클리': 'berkeley',
      'berkeley': 'berkeley',
      // Japan
      '도쿄': 'tokyo',
      'tokyo': 'tokyo',
      '시부야': 'shibuya',
      'shibuya': 'shibuya',
      // Canada
      '토론토': 'toronto',
      'toronto': 'toronto',
      // Korea
      '서울': '서울',
      '강남': '강남',
      '종로': '종로',
      '여의도': '여의도',
      '성남': '성남',
      '경기': '경기',
    };

    return mapping[normalized] || normalized;
  };

  return spaces.filter(space => {
    // Region filter (check region, subRegion)
    if (filters.region) {
      const searchRegion = normalizeRegion(filters.region);
      const spaceRegion = space.region.toLowerCase();
      const spaceSubRegion = space.subRegion.toLowerCase();

      console.log(`Region filter: search="${filters.region}" -> normalized="${searchRegion}", space="${spaceRegion}/${spaceSubRegion}"`);

      const regionMatch =
        spaceRegion === searchRegion ||
        spaceSubRegion === searchRegion ||
        spaceRegion.includes(searchRegion) ||
        spaceSubRegion.includes(searchRegion);

      if (!regionMatch) {
        console.log(`  -> No match, filtering out: ${space.name}`);
        return false;
      } else {
        console.log(`  -> Match found: ${space.name}`);
      }
    }

    // Capacity filter (space must accommodate at least this many people)
    if (capacityFilter && space.capacity < capacityFilter) {
      console.log(`Filtering out ${space.name}: capacity ${space.capacity} < required ${capacityFilter}`);
      return false;
    }

    // Budget filter (price must be within budget)
    if (budgetFilter && space.priceValue > budgetFilter) {
      return false;
    }

    // Space type filter
    if (filters.spaceType) {
      const searchType = filters.spaceType.toLowerCase();
      const typeMatch =
        space.type.toLowerCase().includes(searchType) ||
        space.name.toLowerCase().includes(searchType);
      if (!typeMatch) return false;
    }

    // Style filter (check style field and name)
    if (filters.style) {
      const searchStyle = filters.style.toLowerCase();
      const styleMatch =
        space.style.toLowerCase().includes(searchStyle) ||
        space.name.toLowerCase().includes(searchStyle) ||
        // Map Korean style keywords to English
        (searchStyle.includes('빈티지') && space.style.toLowerCase().includes('vintage')) ||
        (searchStyle.includes('화이트') && space.style.toLowerCase().includes('white')) ||
        (searchStyle.includes('자연광') && space.style.toLowerCase().includes('natural light')) ||
        (searchStyle.includes('인더스트리얼') && space.style.toLowerCase().includes('industrial')) ||
        (searchStyle.includes('모던') && space.style.toLowerCase().includes('modern')) ||
        (searchStyle.includes('미니멀') && space.style.toLowerCase().includes('minimal')) ||
        (searchStyle.includes('젠') && space.style.toLowerCase().includes('zen')) ||
        (searchStyle.includes('북유럽') && space.style.toLowerCase().includes('nordic')) ||
        (searchStyle.includes('아늑') && space.style.toLowerCase().includes('cozy')) ||
        (searchStyle.includes('루프탑') && space.style.toLowerCase().includes('rooftop'));
      if (!styleMatch) return false;
    }

    return true;
  });
}
