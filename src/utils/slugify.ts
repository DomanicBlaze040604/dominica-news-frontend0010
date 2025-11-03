/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove all non-word chars except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove hyphens from start and end
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param baseSlug - The base slug to make unique
 * @param checkExists - Function to check if slug exists
 * @returns A unique slug
 */
export const generateUniqueSlug = async (
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};