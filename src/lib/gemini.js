const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function parseSearchQuery(query) {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not found');
    return null;
  }

  const prompt = `You are a search query parser for a space rental platform in Korea. Parse the following natural language search query and extract structured filters.

User query: "${query}"

Extract the following fields (return null for any field not mentioned):
- region: The location/area mentioned. ALWAYS return in ENGLISH regardless of input language.
  Examples: "런던" -> "London", "강남" -> "Gangnam", "쇼디치" -> "Shoreditch", "브루클린" -> "Brooklyn", "도쿄" -> "Tokyo", "시부야" -> "Shibuya", "뉴욕" -> "New York"
- capacity: Number of people (integer only)
- budget: Maximum price (integer only, without currency symbol)
- spaceType: Type of space in KOREAN. Map to one of these: 파티룸, 스터디룸, 워크숍 공간, 스튜디오, 이벤트 홀, 대형 홀, 쿠킹 스튜디오, 명상실, 소규모 모임실
- style: Space style keywords like: 빈티지, 화이트 톤, 자연광, 인더스트리얼, 모던, 미니멀, 젠, 북유럽, 아늑한, 루프탑

Mapping examples:
- "회의실" or "meeting room" → null (search by name instead)
- "파티할 수 있는 곳" → "파티룸"
- "워크숍" → "워크숍 공간"
- "댄스" or "dance studio" → "스튜디오"
- "명상" → "명상실"
- "요리" or "cooking" → "쿠킹 스튜디오"

IMPORTANT: Return ONLY valid JSON, no explanation or markdown. Example:
{"region": "강남", "capacity": 20, "budget": null, "spaceType": "파티룸", "style": null}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error details:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return null;
    }

    // Clean up the response (remove markdown code blocks if present)
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error parsing search query:', error);
    return null;
  }
}
