// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'dominica-news');

// Create application user with read/write permissions
db.createUser({
  user: process.env.MONGO_APP_USERNAME || 'app_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_INITDB_DATABASE || 'dominica-news'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ displayOrder: 1 });
db.articles.createIndex({ slug: 1 }, { unique: true });
db.articles.createIndex({ status: 1 });
db.articles.createIndex({ publishedAt: -1 });
db.articles.createIndex({ category: 1 });
db.articles.createIndex({ author: 1 });
db.articles.createIndex({ title: 'text', content: 'text' });
db.images.createIndex({ filename: 1 }, { unique: true });
db.images.createIndex({ uploader: 1 });
db.images.createIndex({ createdAt: -1 });

print('Database initialization completed successfully');