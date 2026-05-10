// Translation utility using MyMemory API (free, no key required)
// Caches translations in sessionStorage to avoid repeated API calls

const CACHE_PREFIX = 'trans_';

export async function translateToChinese(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  // Check cache first
  const cacheKey = CACHE_PREFIX + btoa(encodeURIComponent(text)).slice(0, 50);
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      sessionStorage.setItem(cacheKey, translated);
      return translated;
    }
    return text;
  } catch (error) {
    console.warn('Translation failed, using original:', error);
    return text;
  }
}

export async function translateDescriptions<T extends { description: string }>(items: T[]): Promise<T[]> {
  const results = await Promise.all(
    items.map(async (item) => {
      const translatedDescription = await translateToChinese(item.description);
      return { ...item, description: translatedDescription };
    })
  );
  return results;
}
