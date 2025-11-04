const mongoose = require('mongoose');
require('dotenv').config();

async function debugDatabaseContent() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Check articles
    const Article = mongoose.model('Article', new mongoose.Schema({}, { strict: false }));
    const articles = await Article.find({}).limit(5);
    console.log(`\n📝 Articles in database: ${articles.length}`);
    if (articles.length > 0) {
      console.log('Sample article:', {
        title: articles[0].title,
        status: articles[0].status,
        slug: articles[0].slug,
        author: articles[0].author,
        category: articles[0].category
      });
    }

    // Check categories
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const categories = await Category.find({}).limit(5);
    console.log(`\n📂 Categories in database: ${categories.length}`);
    if (categories.length > 0) {
      console.log('Sample category:', {
        name: categories[0].name,
        slug: categories[0].slug
      });
    }

    // Check authors
    const Author = mongoose.model('Author', new mongoose.Schema({}, { strict: false }));
    const authors = await Author.find({}).limit(5);
    console.log(`\n👥 Authors in database: ${authors.length}`);
    if (authors.length > 0) {
      console.log('Sample author:', {
        name: authors[0].name,
        email: authors[0].email
      });
    }

    // Check admin user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({});
    console.log(`\n🔐 Users in database: ${users.length}`);
    if (users.length > 0) {
      console.log('Sample user:', {
        email: users[0].email,
        role: users[0].role
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
}

debugDatabaseContent();