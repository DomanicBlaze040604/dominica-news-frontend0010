import Author from '../models/Author';

export class AuthorSlugService {
  /**
   * Generate a unique slug from author name
   */
  static async generateSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = this.createBaseSlug(name);
    return await this.ensureUniqueSlug(baseSlug, excludeId);
  }

  /**
   * Create base slug from name
   */
  private static createBaseSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by checking database and adding counter if needed
   */
  private static async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Check if slug already exists in database
   */
  private static async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query: any = { slug };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingAuthor = await Author.findOne(query);
    return !!existingAuthor;
  }

  /**
   * Validate slug format
   */
  static validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
  }

  /**
   * Update author slug and return the new slug
   */
  static async updateAuthorSlug(authorId: string, newName: string): Promise<string> {
    const newSlug = await this.generateSlug(newName, authorId);
    
    await Author.findByIdAndUpdate(authorId, { slug: newSlug });
    
    return newSlug;
  }
}