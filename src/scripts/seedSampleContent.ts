import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../models/Article';
import Author from '../models/Author';
import { Category } from '../models/Category';
import { connectDatabase } from '../config/database';
import { getDominicanTime } from '../utils/timezone';

// Load environment variables
dotenv.config();

const categories = [
  {
    name: 'Politics',
    slug: 'politics',
    description: 'Political news and government updates from Dominica',
    displayOrder: 1
  },
  {
    name: 'Tourism',
    slug: 'tourism',
    description: 'Tourism news, attractions, and travel information',
    displayOrder: 2
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports news, events, and athlete profiles',
    displayOrder: 3
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Technology news, innovations, and digital developments',
    displayOrder: 4
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational news, school updates, and academic achievements',
    displayOrder: 5
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Lifestyle, culture, health, and community news',
    displayOrder: 6
  }
];

const authors = [
  {
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@dominicanews.com',
    bio: 'Senior Political Reporter with over 10 years of experience covering Dominican politics and government affairs.',
    specialization: ['Politics'],
    location: 'Roseau, Dominica'
  },
  {
    name: 'James Thompson',
    email: 'james.thompson@dominicanews.com',
    bio: 'Tourism and Travel Writer passionate about showcasing the natural beauty and attractions of Dominica.',
    specialization: ['Tourism'],
    location: 'Portsmouth, Dominica'
  },
  {
    name: 'Sarah Williams',
    email: 'sarah.williams@dominicanews.com',
    bio: 'Sports Journalist covering local and international sports events featuring Dominican athletes.',
    specialization: ['Sports'],
    location: 'Roseau, Dominica'
  },
  {
    name: 'David Chen',
    email: 'david.chen@dominicanews.com',
    bio: 'Technology Reporter focusing on digital innovation and tech developments in the Caribbean region.',
    specialization: ['Technology'],
    location: 'Roseau, Dominica'
  },
  {
    name: 'Lisa Martinez',
    email: 'lisa.martinez@dominicanews.com',
    bio: 'Education Correspondent covering schools, universities, and educational initiatives across Dominica.',
    specialization: ['Education'],
    location: 'Marigot, Dominica'
  },
  {
    name: 'Michael Joseph',
    email: 'michael.joseph@dominicanews.com',
    bio: 'Lifestyle and Culture Writer exploring Dominican traditions, health, and community stories.',
    specialization: ['Culture', 'Health', 'Entertainment'],
    location: 'Soufrière, Dominica'
  }
];

const sampleArticles = [
  // Politics
  {
    title: 'Prime Minister Announces New Infrastructure Development Plan',
    slug: 'pm-announces-infrastructure-development-plan',
    excerpt: 'The government unveils a comprehensive plan to improve roads, bridges, and public facilities across Dominica.',
    content: `<h2>Major Infrastructure Investment Announced</h2>
    <p>Prime Minister Roosevelt Skerrit announced today a comprehensive infrastructure development plan that will see significant improvements to roads, bridges, and public facilities across Dominica over the next five years.</p>
    
    <p>The plan, valued at EC$500 million, will focus on:</p>
    <ul>
      <li>Upgrading the island's road network</li>
      <li>Improving water and sewage systems</li>
      <li>Modernizing public buildings</li>
      <li>Enhancing telecommunications infrastructure</li>
    </ul>
    
    <p>"This investment represents our commitment to building a more resilient and modern Dominica," the Prime Minister stated during a press conference in Roseau.</p>
    
    <p>The project is expected to create over 2,000 jobs and will be funded through a combination of government resources and international partnerships.</p>`,
    category: 'politics',
    author: 'maria.rodriguez@dominicanews.com',
    status: 'published',
    location: 'Roseau, Dominica',
    isBreaking: true
  },
  
  // Tourism
  {
    title: 'Dominica Named Top Eco-Tourism Destination in Caribbean',
    slug: 'dominica-top-eco-tourism-destination-caribbean',
    excerpt: 'International travel magazine recognizes Dominica as the leading eco-tourism destination in the Caribbean region.',
    content: `<h2>International Recognition for Dominican Tourism</h2>
    <p>Dominica has been named the top eco-tourism destination in the Caribbean by <em>Caribbean Travel & Life</em> magazine, highlighting the island's commitment to sustainable tourism and environmental conservation.</p>
    
    <p>The award recognizes Dominica's unique offerings:</p>
    <ul>
      <li>Pristine rainforests and hiking trails</li>
      <li>World-class whale watching opportunities</li>
      <li>Sustainable tourism practices</li>
      <li>Rich biodiversity and protected areas</li>
    </ul>
    
    <blockquote>
      <p>"Dominica continues to set the standard for responsible tourism in the Caribbean, balancing visitor experiences with environmental protection."</p>
    </blockquote>
    
    <p>Tourism Minister Denise Charles expressed pride in the recognition, noting that it validates the country's approach to sustainable development.</p>`,
    category: 'tourism',
    author: 'james.thompson@dominicanews.com',
    status: 'published',
    location: 'Portsmouth, Dominica',
    isFeatured: true
  },
  
  // Sports
  {
    title: 'Dominican Athletes Prepare for Commonwealth Games',
    slug: 'dominican-athletes-commonwealth-games-preparation',
    excerpt: 'Local athletes intensify training as they prepare to represent Dominica at the upcoming Commonwealth Games.',
    content: `<h2>Commonwealth Games Preparation Underway</h2>
    <p>Dominican athletes are in the final stages of preparation for the Commonwealth Games, with several competitors showing promising form in recent training sessions and competitions.</p>
    
    <p>The Dominican team will compete in several disciplines:</p>
    <ul>
      <li><strong>Athletics:</strong> Sprints and middle-distance events</li>
      <li><strong>Swimming:</strong> Freestyle and butterfly events</li>
      <li><strong>Boxing:</strong> Multiple weight categories</li>
      <li><strong>Weightlifting:</strong> Men's and women's divisions</li>
    </ul>
    
    <p>National coach Patricia Williams expressed optimism about the team's chances: "Our athletes have been training hard and are in excellent condition. We're confident they will represent Dominica with pride."</p>
    
    <p>The games represent an important opportunity for Dominican athletes to compete on the international stage and gain valuable experience.</p>`,
    category: 'sports',
    author: 'sarah.williams@dominicanews.com',
    status: 'published',
    location: 'Roseau, Dominica'
  },
  
  // Technology
  {
    title: 'New High-Speed Internet Initiative Launched Across Dominica',
    slug: 'high-speed-internet-initiative-launched-dominica',
    excerpt: 'Government partners with telecommunications companies to bring high-speed internet access to rural communities.',
    content: `<h2>Digital Connectivity Expansion</h2>
    <p>The government of Dominica has launched a major initiative to expand high-speed internet access to rural and underserved communities across the island, partnering with leading telecommunications providers.</p>
    
    <p>The initiative includes:</p>
    <ul>
      <li>Installation of fiber optic cables in remote areas</li>
      <li>Establishment of community Wi-Fi hotspots</li>
      <li>Subsidized internet packages for low-income families</li>
      <li>Digital literacy training programs</li>
    </ul>
    
    <p>Minister of Information and Telecommunications, Kelver Darroux, emphasized the importance of digital inclusion: "Access to reliable internet is no longer a luxury—it's essential for education, business, and connecting with the world."</p>
    
    <p>The project is expected to be completed within 18 months and will benefit over 15,000 residents in previously underserved areas.</p>`,
    category: 'technology',
    author: 'david.chen@dominicanews.com',
    status: 'published',
    location: 'Roseau, Dominica'
  },
  
  // Education
  {
    title: 'New STEM Program Launched in Dominican Schools',
    slug: 'new-stem-program-launched-dominican-schools',
    excerpt: 'Ministry of Education introduces comprehensive STEM curriculum to prepare students for future careers in science and technology.',
    content: `<h2>Advancing STEM Education in Dominica</h2>
    <p>The Ministry of Education has officially launched a comprehensive Science, Technology, Engineering, and Mathematics (STEM) program across all secondary schools in Dominica, aimed at preparing students for careers in emerging fields.</p>
    
    <p>The program features:</p>
    <ul>
      <li>Updated laboratory equipment and technology</li>
      <li>Specialized teacher training workshops</li>
      <li>Partnerships with regional universities</li>
      <li>Student exchange programs</li>
    </ul>
    
    <p>Education Minister Octavia Alfred highlighted the program's importance: "We must equip our young people with the skills needed for the 21st century economy. This STEM initiative is a crucial step in that direction."</p>
    
    <p>The program will be implemented gradually over the next two years, with pilot schools already showing encouraging results in student engagement and performance.</p>`,
    category: 'education',
    author: 'lisa.martinez@dominicanews.com',
    status: 'published',
    location: 'Marigot, Dominica'
  },
  
  // Lifestyle
  {
    title: 'Traditional Dominican Cuisine Festival Celebrates Local Heritage',
    slug: 'traditional-dominican-cuisine-festival-celebrates-heritage',
    excerpt: 'Annual food festival showcases authentic Dominican dishes and culinary traditions passed down through generations.',
    content: `<h2>Celebrating Dominican Culinary Heritage</h2>
    <p>The annual Dominican Cuisine Festival brought together food enthusiasts, local chefs, and cultural preservationists to celebrate the rich culinary traditions that define Dominican culture.</p>
    
    <p>Festival highlights included:</p>
    <ul>
      <li><strong>Traditional Dishes:</strong> Callaloo, mountain chicken, and breadfruit preparations</li>
      <li><strong>Cooking Demonstrations:</strong> Master chefs sharing ancestral recipes</li>
      <li><strong>Cultural Performances:</strong> Traditional music and dance</li>
      <li><strong>Local Vendors:</strong> Fresh produce and artisanal products</li>
    </ul>
    
    <p>Festival organizer Margaret Charles emphasized the event's cultural significance: "Food is at the heart of our identity. This festival helps preserve our culinary heritage while introducing it to new generations."</p>
    
    <p>The festival also featured workshops on sustainable farming practices and the use of indigenous ingredients in modern cooking.</p>`,
    category: 'lifestyle',
    author: 'michael.joseph@dominicanews.com',
    status: 'published',
    location: 'Soufrière, Dominica',
    isFeatured: true
  }
];

async function seedSampleContent() {
  try {
    console.log('🌱 Starting sample content seeding...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Article.deleteMany({});
    await Author.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create authors
    console.log('👥 Creating authors...');
    const createdAuthors = await Author.insertMany(authors);
    console.log(`✅ Created ${createdAuthors.length} authors`);

    // Create category and author lookup maps
    const categoryMap = new Map();
    createdCategories.forEach(cat => categoryMap.set(cat.slug, cat._id));

    const authorMap = new Map();
    createdAuthors.forEach(author => authorMap.set(author.email, author._id));

    // Create articles
    console.log('📝 Creating sample articles...');
    const articlesToCreate = sampleArticles.map(article => ({
      ...article,
      category: categoryMap.get(article.category),
      author: authorMap.get(article.author),
      publishedAt: getDominicanTime()
    }));

    const createdArticles = await Article.insertMany(articlesToCreate);
    console.log(`✅ Created ${createdArticles.length} articles`);

    // Update author article counts
    console.log('📊 Updating author article counts...');
    for (const author of createdAuthors) {
      const articleCount = createdArticles.filter(article => 
        article.author.toString() === (author._id as any).toString()
      ).length;
      
      await Author.findByIdAndUpdate(author._id, { articlesCount: articleCount });
    }
    console.log('✅ Author article counts updated');

    console.log('\n🎉 Sample content seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Authors: ${createdAuthors.length}`);
    console.log(`   Articles: ${createdArticles.length}`);
    
    console.log('\n📂 Categories created:');
    createdCategories.forEach(cat => console.log(`   - ${cat.name} (${cat.slug})`));
    
    console.log('\n👥 Authors created:');
    createdAuthors.forEach(author => console.log(`   - ${author.name} (${author.specialization.join(', ')})`));
    
    console.log('\n📝 Articles created:');
    createdArticles.forEach(article => {
      const category = createdCategories.find(cat => (cat._id as any).toString() === article.category.toString());
      const author = createdAuthors.find(auth => (auth._id as any).toString() === article.author.toString());
      console.log(`   - ${article.title} by ${author?.name} in ${category?.name}`);
    });

  } catch (error) {
    console.error('❌ Error seeding sample content:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedSampleContent()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedSampleContent;