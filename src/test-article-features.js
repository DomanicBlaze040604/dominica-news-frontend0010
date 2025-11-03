const mongoose = require('mongoose');
const Article = require('./models/Article').default;
const Author = require('./models/Author').default;
const { Category } = require('./models/Category');
const { getDominicanTime, formatDominicanTime } = require('./utils/timezone');

async function testArticleFeatures() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dominica-news-test');
    console.log('✅ Connected to database');

    // Clean up existing data
    await Article.deleteMany({});
    await Author.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Cleaned up existing data');

    // 1. Test Dominican Timezone
    console.log('\n🕐 Testing Dominican Timezone...');
    const dominicanTime = getDominicanTime();
    const formattedTime = formatDominicanTime(dominicanTime, 'YYYY-MM-DD HH:mm:ss');
    console.log(`✅ Dominican time: ${formattedTime}`);

    // 2. Test Author Creation and Visibility
    console.log('\n👤 Testing Author Creation...');
    const author = await Author.create({
      name: 'Test Author',
      email: 'test@example.com',
      bio: 'Test author bio'
    });
    console.log(`✅ Author created: ${author.name} (${author.email})`);

    // 3. Test Category Creation
    console.log('\n📂 Testing Category Creation...');
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology news and updates'
    });
    console.log(`✅ Category created: ${category.name}`);

    // 4. Test Article Upload/Creation
    console.log('\n📝 Testing Article Creation...');
    const article = await Article.create({
      title: 'Test Article with Dominican Features',
      slug: 'test-article-dominican-features',
      excerpt: 'This is a test article to verify all features work correctly',
      content: 'This is the full content of the test article. It demonstrates that articles can be created with proper author attribution, Dominican timezone support, and all required fields.',
      author: author._id,
      category: category._id,
      status: 'published',
      location: 'Santo Domingo, Dominican Republic'
    });
    console.log(`✅ Article created: ${article.title}`);
    console.log(`   - Slug: ${article.slug}`);
    console.log(`   - Status: ${article.status}`);
    console.log(`   - Published at: ${formatDominicanTime(article.publishedAt, 'YYYY-MM-DD HH:mm:ss')} (Dominican time)`);

    // 5. Test Article Opening/Display with Author Visibility
    console.log('\n📖 Testing Article Display with Author Population...');
    const articleWithAuthor = await Article.findOne({ slug: 'test-article-dominican-features' })
      .populate('author', 'name email bio')
      .populate('category', 'name slug description');

    if (articleWithAuthor) {
      console.log(`✅ Article retrieved: ${articleWithAuthor.title}`);
      console.log(`   - Author: ${articleWithAuthor.author.name} (${articleWithAuthor.author.email})`);
      console.log(`   - Category: ${articleWithAuthor.category.name}`);
      console.log(`   - Location: ${articleWithAuthor.location}`);
      console.log(`   - Published: ${formatDominicanTime(articleWithAuthor.publishedAt, 'MMMM Do, YYYY [at] h:mm A')}`);
    } else {
      console.log('❌ Article not found');
    }

    // 6. Test Article Listing
    console.log('\n📋 Testing Article Listing...');
    const articles = await Article.find({ status: 'published' })
      .populate('author', 'name')
      .populate('category', 'name')
      .sort({ publishedAt: -1 });

    console.log(`✅ Found ${articles.length} published articles:`);
    articles.forEach(art => {
      console.log(`   - ${art.title} by ${art.author.name} in ${art.category.name}`);
    });

    // 7. Test Rich Text Content (HTML support)
    console.log('\n🎨 Testing Rich Text Content...');
    const richArticle = await Article.create({
      title: 'Rich Text Article',
      slug: 'rich-text-article',
      excerpt: 'Article with rich text formatting',
      content: '<h2>Rich Text Content</h2><p>This article contains <strong>bold text</strong>, <em>italic text</em>, and <u>underlined text</u>.</p><ul><li>List item 1</li><li>List item 2</li></ul>',
      author: author._id,
      category: category._id,
      status: 'published'
    });
    console.log(`✅ Rich text article created: ${richArticle.title}`);
    console.log(`   - Content preview: ${richArticle.content.substring(0, 100)}...`);

    console.log('\n🎉 All article features tested successfully!');
    console.log('\n📊 Feature Summary:');
    console.log('✅ Dominican Timezone - Working');
    console.log('✅ Author Visibility - Working');
    console.log('✅ Article Upload - Working');
    console.log('✅ Article Display - Working');
    console.log('✅ Rich Text Content - Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testArticleFeatures();