import { AuthorSlugService } from '../services/authorSlugService';
import Author from '../models/Author';
import { connectTestDB, closeTestDB, clearTestDB } from './setup';

describe('AuthorSlugService', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('generateSlug', () => {
    it('should generate basic slug from name', async () => {
      const slug = await AuthorSlugService.generateSlug('John Doe');
      expect(slug).toBe('john-doe');
    });

    it('should handle special characters', async () => {
      const slug = await AuthorSlugService.generateSlug('María José O\'Connor');
      expect(slug).toBe('mara-jos-oconnor');
    });

    it('should handle multiple spaces and hyphens', async () => {
      const slug = await AuthorSlugService.generateSlug('John   Doe--Smith');
      expect(slug).toBe('john-doe-smith');
    });

    it('should trim leading and trailing spaces', async () => {
      const slug = await AuthorSlugService.generateSlug('  John Doe  ');
      expect(slug).toBe('john-doe');
    });

    it('should generate unique slug when duplicate exists', async () => {
      // Create an author with the base slug
      await Author.create({
        name: 'John Doe',
        slug: 'john-doe',
        email: 'john@test.com',
        role: 'Reporter'
      });

      const slug = await AuthorSlugService.generateSlug('John Doe');
      expect(slug).toBe('john-doe-1');
    });

    it('should generate incrementing unique slugs', async () => {
      // Create authors with base slug and first increment
      await Author.create([
        {
          name: 'John Doe',
          slug: 'john-doe',
          email: 'john1@test.com',
          role: 'Reporter'
        },
        {
          name: 'John Doe',
          slug: 'john-doe-1',
          email: 'john2@test.com',
          role: 'Reporter'
        }
      ]);

      const slug = await AuthorSlugService.generateSlug('John Doe');
      expect(slug).toBe('john-doe-2');
    });

    it('should exclude specific author ID when checking uniqueness', async () => {
      const author = await Author.create({
        name: 'John Doe',
        slug: 'john-doe',
        email: 'john@test.com',
        role: 'Reporter'
      });

      // Should return the same slug when excluding the author's own ID
      const slug = await AuthorSlugService.generateSlug('John Doe', author._id.toString());
      expect(slug).toBe('john-doe');
    });
  });

  describe('validateSlug', () => {
    it('should validate correct slug format', () => {
      expect(AuthorSlugService.validateSlug('john-doe')).toBe(true);
      expect(AuthorSlugService.validateSlug('john-doe-123')).toBe(true);
      expect(AuthorSlugService.validateSlug('a')).toBe(true);
    });

    it('should reject invalid slug formats', () => {
      expect(AuthorSlugService.validateSlug('John Doe')).toBe(false); // uppercase
      expect(AuthorSlugService.validateSlug('john_doe')).toBe(false); // underscore
      expect(AuthorSlugService.validateSlug('john.doe')).toBe(false); // period
      expect(AuthorSlugService.validateSlug('john@doe')).toBe(false); // special char
      expect(AuthorSlugService.validateSlug('')).toBe(false); // empty
      expect(AuthorSlugService.validateSlug('a'.repeat(101))).toBe(false); // too long
    });
  });

  describe('updateAuthorSlug', () => {
    it('should update author slug and return new slug', async () => {
      const author = await Author.create({
        name: 'John Doe',
        slug: 'john-doe',
        email: 'john@test.com',
        role: 'Reporter'
      });

      const newSlug = await AuthorSlugService.updateAuthorSlug(
        author._id.toString(),
        'John Smith'
      );

      expect(newSlug).toBe('john-smith');

      // Verify the author was updated
      const updatedAuthor = await Author.findById(author._id);
      expect(updatedAuthor?.slug).toBe('john-smith');
    });

    it('should handle slug conflicts during update', async () => {
      // Create two authors
      const author1 = await Author.create({
        name: 'John Doe',
        slug: 'john-doe',
        email: 'john1@test.com',
        role: 'Reporter'
      });

      await Author.create({
        name: 'John Smith',
        slug: 'john-smith',
        email: 'john2@test.com',
        role: 'Reporter'
      });

      // Try to update author1 to have the same name as author2
      const newSlug = await AuthorSlugService.updateAuthorSlug(
        author1._id.toString(),
        'John Smith'
      );

      expect(newSlug).toBe('john-smith-1');

      const updatedAuthor = await Author.findById(author1._id);
      expect(updatedAuthor?.slug).toBe('john-smith-1');
    });
  });

  describe('edge cases', () => {
    it('should handle names with only special characters', async () => {
      const slug = await AuthorSlugService.generateSlug('!@#$%^&*()');
      expect(slug).toBe('');
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(200) + ' ' + 'B'.repeat(200);
      const slug = await AuthorSlugService.generateSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(100);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle names with numbers', async () => {
      const slug = await AuthorSlugService.generateSlug('John Doe 123');
      expect(slug).toBe('john-doe-123');
    });

    it('should handle names with accented characters', async () => {
      const slug = await AuthorSlugService.generateSlug('José María Aznar');
      expect(slug).toBe('jos-mara-aznar');
    });

    it('should handle names starting or ending with hyphens', async () => {
      const slug = await AuthorSlugService.generateSlug('-John Doe-');
      expect(slug).toBe('john-doe');
    });
  });

  describe('performance', () => {
    it('should handle multiple concurrent slug generations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        AuthorSlugService.generateSlug(`John Doe ${i}`)
      );

      const slugs = await Promise.all(promises);
      
      // All slugs should be unique
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
      
      // All slugs should be valid
      slugs.forEach(slug => {
        expect(AuthorSlugService.validateSlug(slug)).toBe(true);
      });
    });

    it('should efficiently find next available slug with many conflicts', async () => {
      // Create many authors with similar names
      const authors = Array.from({ length: 50 }, (_, i) => ({
        name: `John Doe ${i}`,
        slug: i === 0 ? 'john-doe' : `john-doe-${i}`,
        email: `john${i}@test.com`,
        role: 'Reporter'
      }));

      await Author.create(authors);

      const startTime = Date.now();
      const slug = await AuthorSlugService.generateSlug('John Doe');
      const endTime = Date.now();

      expect(slug).toBe('john-doe-50');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});