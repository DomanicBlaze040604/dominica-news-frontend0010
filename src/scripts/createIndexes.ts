import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Article } from '../models/Article';
import { Image } from '../models/Image';

async function createOptimizedIndexes(): Promise<void> {
  try {
    console.log('Creating optimized database indexes...');
    
    await connectDatabase();

    // User indexes
    console.log('Creating User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });

    // Category indexes
    console.log('Creating Category indexes...');
    await Category.collection.createIndex({ slug: 1 }, { unique: true });
    await Category.collection.createIndex({ name: 1 }, { unique: true });
    await Category.collection.createIndex({ displayOrder: 1 });
    await Category.collection.createIndex({ createdAt: -1 });

    // Article indexes
    console.log('Creating Article indexes...');
    await Article.collection.createIndex({ slug: 1 }, { unique: true });
    await Article.collection.createIndex({ status: 1 });
    await Article.collection.createIndex({ publishedAt: -1 });
    await Article.collection.createIndex({ categoryId: 1 });
    await Article.collection.createIndex({ authorId: 1 });
    await Article.collection.createIndex({ createdAt: -1 });
    await Article.collection.createIndex({ updatedAt: -1 });
    
    // Compound indexes for common queries
    await Article.collection.createIndex({ status: 1, publishedAt: -1 });
    await Article.collection.createIndex({ categoryId: 1, status: 1, publishedAt: -1 });
    await Article.collection.createIndex({ authorId: 1, status: 1, publishedAt: -1 });
    
    // Text search index
    await Article.collection.createIndex(
      { title: 'text', content: 'text', excerpt: 'text' },
      { 
        weights: { title: 10, excerpt: 5, content: 1 },
        name: 'article_text_search'
      }
    );

    // Image indexes
    console.log('Creating Image indexes...');
    await Image.collection.createIndex({ filename: 1 }, { unique: true });
    await Image.collection.createIndex({ uploader: 1 });
    await Image.collection.createIndex({ createdAt: -1 });
    await Image.collection.createIndex({ fileSize: 1 });
    await Image.collection.createIndex({ mimetype: 1 });

    console.log('All indexes created successfully!');

    // Display index information
    const collections = [
      { name: 'users', model: User },
      { name: 'categories', model: Category },
      { name: 'articles', model: Article },
      { name: 'images', model: Image }
    ];

    for (const collection of collections) {
      const indexes = await collection.model.collection.listIndexes().toArray();
      console.log(`\n${collection.name.toUpperCase()} INDEXES:`);
      indexes.forEach((index, i) => {
        console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }

  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run index creation if this file is executed directly
if (require.main === module) {
  createOptimizedIndexes()
    .then(() => {
      console.log('Index creation completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index creation failed:', error);
      process.exit(1);
    });
}

export { createOptimizedIndexes };