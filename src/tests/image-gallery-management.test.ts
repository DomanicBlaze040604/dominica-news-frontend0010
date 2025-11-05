import { describe, it, expect } from '@jest/globals';

describe('Image Gallery Management', () => {
  describe('Image Search and Filtering', () => {
    it('should filter images by search query', () => {
      const images = [
        { id: '1', originalName: 'sunset-beach.jpg', altText: 'Beautiful sunset at the beach', tags: ['sunset', 'beach'] },
        { id: '2', originalName: 'mountain-view.jpg', altText: 'Mountain landscape view', tags: ['mountain', 'landscape'] },
        { id: '3', originalName: 'city-night.jpg', altText: 'City lights at night', tags: ['city', 'night'] }
      ];

      const searchQuery = 'beach';
      const filteredImages = images.filter(image => 
        image.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.altText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      expect(filteredImages).toHaveLength(1);
      expect(filteredImages[0].originalName).toBe('sunset-beach.jpg');
    });

    it('should sort images by different criteria', () => {
      const images = [
        { id: '1', originalName: 'z-image.jpg', uploadedAt: '2024-01-01T10:00:00Z', fileSize: 1000000 },
        { id: '2', originalName: 'a-image.jpg', uploadedAt: '2024-01-03T10:00:00Z', fileSize: 500000 },
        { id: '3', originalName: 'm-image.jpg', uploadedAt: '2024-01-02T10:00:00Z', fileSize: 2000000 }
      ];

      // Sort by name ascending
      const sortedByName = [...images].sort((a, b) => a.originalName.localeCompare(b.originalName));
      expect(sortedByName[0].originalName).toBe('a-image.jpg');
      expect(sortedByName[2].originalName).toBe('z-image.jpg');

      // Sort by date descending
      const sortedByDate = [...images].sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      expect(sortedByDate[0].id).toBe('2'); // Most recent
      expect(sortedByDate[2].id).toBe('1'); // Oldest

      // Sort by size ascending
      const sortedBySize = [...images].sort((a, b) => a.fileSize - b.fileSize);
      expect(sortedBySize[0].fileSize).toBe(500000);
      expect(sortedBySize[2].fileSize).toBe(2000000);
    });

    it('should filter images by optimization status', () => {
      const images = [
        { id: '1', processing: { compressionRatio: '75%' }, variants: {} },
        { id: '2', processing: null, variants: null },
        { id: '3', processing: { compressionRatio: '80%' }, variants: {} }
      ];

      const optimizedImages = images.filter(img => img.processing && img.variants);
      const originalImages = images.filter(img => !img.processing);

      expect(optimizedImages).toHaveLength(2);
      expect(originalImages).toHaveLength(1);
    });
  });

  describe('Image Metadata Management', () => {
    it('should validate metadata updates', () => {
      const validateMetadata = (metadata: any) => {
        const errors = [];

        if (!metadata.altText || metadata.altText.trim().length < 3) {
          errors.push('Alt text is required and must be at least 3 characters');
        }

        if (metadata.tags && !Array.isArray(metadata.tags)) {
          errors.push('Tags must be an array');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Valid metadata
      const validMetadata = {
        altText: 'Valid alt text',
        title: 'Test Image',
        tags: ['tag1', 'tag2']
      };
      expect(validateMetadata(validMetadata).isValid).toBe(true);

      // Invalid metadata - short alt text
      const invalidMetadata = {
        altText: 'Hi',
        title: 'Test Image'
      };
      expect(validateMetadata(invalidMetadata).isValid).toBe(false);
      expect(validateMetadata(invalidMetadata).errors).toContain('Alt text is required and must be at least 3 characters');
    });

    it('should parse tags from comma-separated string', () => {
      const parseTagsString = (tagsString: string): string[] => {
        return tagsString
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      };

      expect(parseTagsString('tag1, tag2, tag3')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(parseTagsString('tag1,tag2,tag3')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(parseTagsString('tag1, , tag3')).toEqual(['tag1', 'tag3']);
      expect(parseTagsString('')).toEqual([]);
      expect(parseTagsString('  ')).toEqual([]);
    });

    it('should handle metadata field updates', () => {
      const originalMetadata = {
        altText: 'Original alt text',
        title: 'Original title',
        description: 'Original description',
        tags: ['old', 'tags']
      };

      const updates = {
        altText: 'Updated alt text',
        tags: ['new', 'tags']
      };

      const updatedMetadata = { ...originalMetadata, ...updates };

      expect(updatedMetadata.altText).toBe('Updated alt text');
      expect(updatedMetadata.title).toBe('Original title'); // Unchanged
      expect(updatedMetadata.description).toBe('Original description'); // Unchanged
      expect(updatedMetadata.tags).toEqual(['new', 'tags']);
    });
  });

  describe('Image Reference Checking', () => {
    it('should identify image references in content', () => {
      const checkImageReferences = (imageId: string, content: any[]) => {
        const references = [];

        for (const item of content) {
          if (item.type === 'article' && item.content.includes(imageId)) {
            references.push({
              type: 'article',
              id: item.id,
              title: item.title,
              url: `/articles/${item.slug}`
            });
          }
          
          if (item.type === 'author' && item.avatar === imageId) {
            references.push({
              type: 'author',
              id: item.id,
              title: item.name,
              url: `/authors/${item.slug}`
            });
          }
        }

        return {
          references,
          canDelete: references.length === 0
        };
      };

      const mockContent = [
        {
          type: 'article',
          id: 'article-1',
          title: 'Test Article',
          slug: 'test-article',
          content: 'Article content with image-123 reference'
        },
        {
          type: 'author',
          id: 'author-1',
          name: 'John Doe',
          slug: 'john-doe',
          avatar: 'image-456'
        }
      ];

      // Image with references
      const referencedImage = checkImageReferences('image-123', mockContent);
      expect(referencedImage.canDelete).toBe(false);
      expect(referencedImage.references).toHaveLength(1);
      expect(referencedImage.references[0].type).toBe('article');

      // Image without references
      const unreferencedImage = checkImageReferences('image-999', mockContent);
      expect(unreferencedImage.canDelete).toBe(true);
      expect(unreferencedImage.references).toHaveLength(0);
    });

    it('should prevent deletion of referenced images', () => {
      const canDeleteImage = (references: any[]) => {
        return references.length === 0;
      };

      const referencedImage = [
        { type: 'article', id: 'article-1', title: 'Test Article' }
      ];
      const unreferencedImage: any[] = [];

      expect(canDeleteImage(referencedImage)).toBe(false);
      expect(canDeleteImage(unreferencedImage)).toBe(true);
    });

    it('should provide reference details for user confirmation', () => {
      const formatReferenceMessage = (references: any[]) => {
        if (references.length === 0) {
          return 'Image can be safely deleted';
        }

        const types = references.reduce((acc, ref) => {
          acc[ref.type] = (acc[ref.type] || 0) + 1;
          return acc;
        }, {});

        const typeMessages = Object.entries(types).map(([type, count]) => 
          `${count} ${type}${count > 1 ? 's' : ''}`
        );

        return `Image is used in ${typeMessages.join(', ')}`;
      };

      const noReferences = formatReferenceMessage([]);
      expect(noReferences).toBe('Image can be safely deleted');

      const multipleReferences = formatReferenceMessage([
        { type: 'article', id: '1' },
        { type: 'article', id: '2' },
        { type: 'author', id: '3' }
      ]);
      expect(multipleReferences).toBe('Image is used in 2 articles, 1 author');
    });
  });

  describe('Image Organization Features', () => {
    it('should handle bulk operations', () => {
      const selectedImages = new Set(['img-1', 'img-2', 'img-3']);
      
      // Bulk selection management
      expect(selectedImages.size).toBe(3);
      
      // Add to selection
      selectedImages.add('img-4');
      expect(selectedImages.size).toBe(4);
      
      // Remove from selection
      selectedImages.delete('img-2');
      expect(selectedImages.size).toBe(3);
      expect(selectedImages.has('img-2')).toBe(false);
      
      // Clear selection
      selectedImages.clear();
      expect(selectedImages.size).toBe(0);
    });

    it('should validate bulk operations', () => {
      const validateBulkOperation = (selectedIds: string[], operation: string) => {
        if (selectedIds.length === 0) {
          return { valid: false, message: 'No images selected' };
        }

        if (operation === 'delete' && selectedIds.length > 10) {
          return { valid: false, message: 'Cannot delete more than 10 images at once' };
        }

        return { valid: true, message: `Ready to ${operation} ${selectedIds.length} images` };
      };

      expect(validateBulkOperation([], 'delete').valid).toBe(false);
      expect(validateBulkOperation(['img-1', 'img-2'], 'delete').valid).toBe(true);
      expect(validateBulkOperation(Array.from({length: 15}, (_, i) => `img-${i}`), 'delete').valid).toBe(false);
    });

    it('should organize images by categories', () => {
      const images = [
        { id: '1', tags: ['article', 'news'], uploadedAt: '2024-01-01' },
        { id: '2', tags: ['author', 'profile'], uploadedAt: '2024-01-02' },
        { id: '3', tags: ['article', 'sports'], uploadedAt: '2024-01-03' }
      ];

      const organizeByTags = (images: any[]) => {
        const categories: { [key: string]: any[] } = {};
        
        images.forEach(image => {
          image.tags.forEach((tag: string) => {
            if (!categories[tag]) {
              categories[tag] = [];
            }
            categories[tag].push(image);
          });
        });

        return categories;
      };

      const organized = organizeByTags(images);
      
      expect(organized.article).toHaveLength(2);
      expect(organized.author).toHaveLength(1);
      expect(organized.news).toHaveLength(1);
      expect(organized.sports).toHaveLength(1);
    });
  });

  describe('Image Gallery Performance', () => {
    it('should implement pagination correctly', () => {
      const totalImages = 150;
      const pageSize = 20;
      const currentPage = 3;

      const calculatePagination = (total: number, size: number, page: number) => {
        const totalPages = Math.ceil(total / size);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        const startIndex = (page - 1) * size;
        const endIndex = Math.min(startIndex + size, total);

        return {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNextPage,
          hasPrevPage,
          startIndex,
          endIndex,
          itemsOnPage: endIndex - startIndex
        };
      };

      const pagination = calculatePagination(totalImages, pageSize, currentPage);

      expect(pagination.totalPages).toBe(8);
      expect(pagination.hasNextPage).toBe(true);
      expect(pagination.hasPrevPage).toBe(true);
      expect(pagination.startIndex).toBe(40);
      expect(pagination.endIndex).toBe(60);
      expect(pagination.itemsOnPage).toBe(20);
    });

    it('should handle empty search results', () => {
      const images = [
        { id: '1', originalName: 'image1.jpg', altText: 'First image' },
        { id: '2', originalName: 'image2.jpg', altText: 'Second image' }
      ];

      const searchQuery = 'nonexistent';
      const filteredImages = images.filter(image => 
        image.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.altText.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filteredImages).toHaveLength(0);
    });

    it('should optimize search performance with indexing simulation', () => {
      // Simulate search index for better performance
      const createSearchIndex = (images: any[]) => {
        const index: { [key: string]: string[] } = {};
        
        images.forEach(image => {
          const searchableText = [
            image.originalName,
            image.altText,
            ...(image.tags || [])
          ].join(' ').toLowerCase();

          const words = searchableText.split(/\s+/);
          words.forEach(word => {
            if (word.length > 2) { // Index words longer than 2 characters
              if (!index[word]) {
                index[word] = [];
              }
              index[word].push(image.id);
            }
          });
        });

        return index;
      };

      const images = [
        { id: '1', originalName: 'beach-sunset.jpg', altText: 'Beautiful beach sunset', tags: ['beach', 'sunset'] },
        { id: '2', originalName: 'mountain-view.jpg', altText: 'Mountain landscape', tags: ['mountain', 'landscape'] }
      ];

      const searchIndex = createSearchIndex(images);
      
      expect(searchIndex.beach).toContain('1');
      expect(searchIndex.mountain).toContain('2');
      expect(searchIndex.beautiful).toContain('1');
    });
  });

  describe('Image Metadata Validation', () => {
    it('should validate required metadata fields', () => {
      const validateImageMetadata = (metadata: any) => {
        const errors = [];

        if (!metadata.altText || metadata.altText.trim().length < 3) {
          errors.push('Alt text is required and must be at least 3 characters');
        }

        if (metadata.tags && !Array.isArray(metadata.tags)) {
          errors.push('Tags must be an array');
        }

        if (metadata.title && metadata.title.trim().length === 0) {
          errors.push('Title cannot be empty if provided');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Valid metadata
      const validMetadata = {
        altText: 'Valid description',
        title: 'Valid Title',
        tags: ['tag1', 'tag2']
      };
      expect(validateImageMetadata(validMetadata).isValid).toBe(true);

      // Invalid metadata
      const invalidMetadata = {
        altText: 'Hi', // Too short
        title: '', // Empty
        tags: 'not-an-array' // Wrong type
      };
      const validation = validateImageMetadata(invalidMetadata);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);
    });

    it('should sanitize metadata input', () => {
      const sanitizeMetadata = (metadata: any) => {
        return {
          altText: metadata.altText?.trim() || '',
          title: metadata.title?.trim() || '',
          description: metadata.description?.trim() || '',
          caption: metadata.caption?.trim() || '',
          credit: metadata.credit?.trim() || '',
          copyright: metadata.copyright?.trim() || '',
          tags: Array.isArray(metadata.tags) 
            ? metadata.tags.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
            : []
        };
      };

      const dirtyMetadata = {
        altText: '  Dirty alt text  ',
        title: '  Dirty title  ',
        tags: ['  tag1  ', '', '  tag2  ', '   ']
      };

      const cleanMetadata = sanitizeMetadata(dirtyMetadata);

      expect(cleanMetadata.altText).toBe('Dirty alt text');
      expect(cleanMetadata.title).toBe('Dirty title');
      expect(cleanMetadata.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Image Reference Tracking', () => {
    it('should track image usage across different content types', () => {
      const trackImageUsage = (imageId: string, contentItems: any[]) => {
        const usage = {
          articles: 0,
          authors: 0,
          categories: 0,
          staticPages: 0,
          total: 0
        };

        contentItems.forEach(item => {
          let isUsed = false;

          switch (item.type) {
            case 'article':
              if (item.featuredImage === imageId || 
                  item.content.includes(imageId) || 
                  item.gallery?.includes(imageId)) {
                usage.articles++;
                isUsed = true;
              }
              break;
            case 'author':
              if (item.avatar === imageId) {
                usage.authors++;
                isUsed = true;
              }
              break;
            case 'category':
              if (item.image === imageId) {
                usage.categories++;
                isUsed = true;
              }
              break;
            case 'static-page':
              if (item.content.includes(imageId)) {
                usage.staticPages++;
                isUsed = true;
              }
              break;
          }

          if (isUsed) {
            usage.total++;
          }
        });

        return usage;
      };

      const mockContent = [
        { type: 'article', id: '1', featuredImage: 'img-123', content: '', gallery: [] },
        { type: 'article', id: '2', featuredImage: '', content: 'Content with img-123', gallery: [] },
        { type: 'author', id: '3', avatar: 'img-123' },
        { type: 'article', id: '4', featuredImage: 'img-456', content: '', gallery: [] }
      ];

      const usage = trackImageUsage('img-123', mockContent);

      expect(usage.articles).toBe(2);
      expect(usage.authors).toBe(1);
      expect(usage.categories).toBe(0);
      expect(usage.total).toBe(3);
    });

    it('should generate reference warnings', () => {
      const generateReferenceWarning = (references: any[]) => {
        if (references.length === 0) {
          return {
            level: 'info',
            message: 'This image is not used anywhere and can be safely deleted.',
            canProceed: true
          };
        }

        const typeCount = references.reduce((acc, ref) => {
          acc[ref.type] = (acc[ref.type] || 0) + 1;
          return acc;
        }, {});

        const typeMessages = Object.entries(typeCount).map(([type, count]) => 
          `${count} ${type}${count > 1 ? 's' : ''}`
        );

        return {
          level: 'warning',
          message: `This image is used in ${typeMessages.join(', ')}. Deleting it will break these references.`,
          canProceed: false
        };
      };

      const noReferences = generateReferenceWarning([]);
      expect(noReferences.level).toBe('info');
      expect(noReferences.canProceed).toBe(true);

      const withReferences = generateReferenceWarning([
        { type: 'article', id: '1' },
        { type: 'article', id: '2' },
        { type: 'author', id: '3' }
      ]);
      expect(withReferences.level).toBe('warning');
      expect(withReferences.canProceed).toBe(false);
      expect(withReferences.message).toContain('2 articles, 1 author');
    });
  });
});