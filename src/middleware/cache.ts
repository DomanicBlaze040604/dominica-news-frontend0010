import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

// Cache middleware
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req: Request) => `${req.method}:${req.originalUrl}`,
    condition = (req: Request, res: Response) => req.method === 'GET' && res.statusCode === 200
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyGenerator(req);
    const now = Date.now();

    // Check if we have cached data
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
      console.log(`Cache HIT: ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', Math.floor((cached.ttl * 1000 - (now - cached.timestamp)) / 1000));
      res.json(cached.data);
      return;
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache if condition is met
      if (condition(req, res)) {
        console.log(`Cache SET: ${cacheKey}`);
        cache.set(cacheKey, {
          data,
          timestamp: now,
          ttl
        });
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-TTL', ttl);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation
export const invalidateCache = (pattern?: string) => {
  if (!pattern) {
    // Clear all cache
    cache.clear();
    console.log('Cache cleared: ALL');
    return;
  }

  // Clear cache entries matching pattern
  const regex = new RegExp(pattern);
  const keysToDelete: string[] = [];
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Cache cleared: ${keysToDelete.length} entries matching "${pattern}"`);
};

// Cache stats
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, value] of cache.entries()) {
    if ((now - value.timestamp) < (value.ttl * 1000)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
    memoryUsage: process.memoryUsage()
  };
};

// Cleanup expired entries
export const cleanupExpiredCache = () => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, value] of cache.entries()) {
    if ((now - value.timestamp) >= (value.ttl * 1000)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Cache cleanup: Removed ${keysToDelete.length} expired entries`);
  
  return keysToDelete.length;
};

// Schedule periodic cleanup
setInterval(cleanupExpiredCache, 5 * 60 * 1000); // Every 5 minutes

// Cache middleware for different types of content
export const publicContentCache = cacheMiddleware({
  ttl: 300, // 5 minutes for public content
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200 && !req.headers.authorization
});

export const articleCache = cacheMiddleware({
  ttl: 600, // 10 minutes for articles
  keyGenerator: (req) => `article:${req.params.slug || req.originalUrl}`,
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200
});

export const categoryCache = cacheMiddleware({
  ttl: 900, // 15 minutes for categories (they change less frequently)
  keyGenerator: (req) => `category:${req.params.slug || req.originalUrl}`,
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200
});

export const imageCache = cacheMiddleware({
  ttl: 3600, // 1 hour for images
  keyGenerator: (req) => `image:${req.params.filename || req.originalUrl}`,
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200
});