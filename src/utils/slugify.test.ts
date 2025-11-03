import { slugify, generateUniqueSlug } from './slugify';

describe('Slugify Utilities', () => {
  describe('slugify', () => {
    it('should convert text to lowercase slug', () => {
      expect(slugify('Technology News')).toBe('technology-news');
      expect(slugify('SPORTS UPDATE')).toBe('sports-update');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('World News Today')).toBe('world-news-today');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should remove special characters', () => {
      expect(slugify('News & Updates!')).toBe('news-updates');
      expect(slugify('Tech@2024')).toBe('tech2024');
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('should handle multiple hyphens', () => {
      expect(slugify('News---Update')).toBe('news-update');
      expect(slugify('Tech--News--Today')).toBe('tech-news-today');
    });

    it('should trim hyphens from start and end', () => {
      expect(slugify('-News Update-')).toBe('news-update');
      expect(slugify('--Tech News--')).toBe('tech-news');
    });

    it('should handle empty and whitespace strings', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
      expect(slugify('\t\n')).toBe('');
    });

    it('should handle numbers and mixed content', () => {
      expect(slugify('Tech News 2024')).toBe('tech-news-2024');
      expect(slugify('COVID-19 Updates')).toBe('covid-19-updates');
    });

    it('should handle unicode characters', () => {
      expect(slugify('Café News')).toBe('caf-news');
      expect(slugify('Naïve Approach')).toBe('nave-approach');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should return original slug if not exists', async () => {
      const checkExists = jest.fn().mockResolvedValue(false);
      const result = await generateUniqueSlug('technology', checkExists);

      expect(result).toBe('technology');
      expect(checkExists).toHaveBeenCalledWith('technology');
      expect(checkExists).toHaveBeenCalledTimes(1);
    });

    it('should append number if slug exists', async () => {
      const checkExists = jest.fn()
        .mockResolvedValueOnce(true)  // 'technology' exists
        .mockResolvedValueOnce(false); // 'technology-1' doesn't exist

      const result = await generateUniqueSlug('technology', checkExists);

      expect(result).toBe('technology-1');
      expect(checkExists).toHaveBeenCalledWith('technology');
      expect(checkExists).toHaveBeenCalledWith('technology-1');
      expect(checkExists).toHaveBeenCalledTimes(2);
    });

    it('should increment number until unique slug found', async () => {
      const checkExists = jest.fn()
        .mockResolvedValueOnce(true)  // 'sports' exists
        .mockResolvedValueOnce(true)  // 'sports-1' exists
        .mockResolvedValueOnce(true)  // 'sports-2' exists
        .mockResolvedValueOnce(false); // 'sports-3' doesn't exist

      const result = await generateUniqueSlug('sports', checkExists);

      expect(result).toBe('sports-3');
      expect(checkExists).toHaveBeenCalledTimes(4);
    });

    it('should handle slug that already has numbers', async () => {
      const checkExists = jest.fn()
        .mockResolvedValueOnce(true)  // 'tech-2024' exists
        .mockResolvedValueOnce(false); // 'tech-2024-1' doesn't exist

      const result = await generateUniqueSlug('tech-2024', checkExists);

      expect(result).toBe('tech-2024-1');
      expect(checkExists).toHaveBeenCalledWith('tech-2024');
      expect(checkExists).toHaveBeenCalledWith('tech-2024-1');
    });

    it('should handle empty base slug', async () => {
      const checkExists = jest.fn().mockResolvedValue(false);
      const result = await generateUniqueSlug('', checkExists);

      expect(result).toBe('');
      expect(checkExists).toHaveBeenCalledWith('');
    });
  });

  describe('Integration tests', () => {
    it('should create unique slug from text', async () => {
      const existingSlugs = ['technology-news', 'technology-news-1'];
      const checkExists = jest.fn().mockImplementation((slug: string) => {
        return Promise.resolve(existingSlugs.includes(slug));
      });

      const baseSlug = slugify('Technology News');
      const uniqueSlug = await generateUniqueSlug(baseSlug, checkExists);

      expect(baseSlug).toBe('technology-news');
      expect(uniqueSlug).toBe('technology-news-2');
    });

    it('should handle complex text with special characters', async () => {
      const checkExists = jest.fn().mockResolvedValue(false);
      
      const text = 'Breaking News: COVID-19 Updates & Analysis!';
      const baseSlug = slugify(text);
      const uniqueSlug = await generateUniqueSlug(baseSlug, checkExists);

      expect(baseSlug).toBe('breaking-news-covid-19-updates-analysis');
      expect(uniqueSlug).toBe('breaking-news-covid-19-updates-analysis');
    });
  });
});