import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/config';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Article } from '../models/Article';

// Default categories for Dominica News
const defaultCategories = [
  {
    name: 'World',
    slug: 'world',
    description: 'International news and global events',
    displayOrder: 1
  },
  {
    name: 'Dominica',
    slug: 'dominica',
    description: 'Local news from the Nature Island of the Caribbean',
    displayOrder: 2
  },
  {
    name: 'Economy',
    slug: 'economy',
    description: 'Economic news and business developments',
    displayOrder: 3
  },
  {
    name: 'Agriculture',
    slug: 'agriculture',
    description: 'Agricultural news and farming updates',
    displayOrder: 4
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational news and academic developments',
    displayOrder: 5
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Entertainment news and cultural events',
    displayOrder: 6
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Lifestyle, health, and wellness news',
    displayOrder: 7
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports news and athletic achievements',
    displayOrder: 8
  }
];

// Sample articles for demonstration
const sampleArticles = [
  {
    title: 'Welcome to Dominica News',
    slug: 'welcome-to-dominica-news',
    content: `<p>Welcome to Dominica News, your trusted source for news from the Nature Island of the Caribbean and around the world.</p>
    
    <p>We are committed to bringing you accurate, timely, and comprehensive coverage of the events that matter most to our community. From local developments in Dominica to international news that affects us all, we strive to keep you informed and engaged.</p>
    
    <p>Our team of dedicated journalists and contributors work tirelessly to ensure that you have access to the information you need to stay connected with your community and the world at large.</p>
    
    <p>Thank you for choosing Dominica News as your source for reliable journalism.</p>`,
    excerpt: 'Welcome to Dominica News, your trusted source for news from the Nature Island of the Caribbean and around the world.',
    status: 'published' as const,
    publishedAt: new Date(),
    categoryName: 'Dominica'
  },
  {
    title: 'Dominica\'s Tourism Industry Shows Strong Recovery',
    slug: 'dominica-tourism-industry-strong-recovery',
    content: `<p>The tourism industry in Dominica is showing remarkable signs of recovery following the challenges of recent years. According to the latest statistics from the Discover Dominica Authority, visitor arrivals have increased by 35% compared to the same period last year.</p>
    
    <p>The Nature Island's unique eco-tourism offerings, including whale watching, hiking trails, and pristine natural attractions, continue to draw visitors from around the world. The government's investment in sustainable tourism infrastructure has played a crucial role in this recovery.</p>
    
    <p>"We are seeing increased interest from travelers seeking authentic, nature-based experiences," said Tourism Minister Sarah Johnson. "Dominica's commitment to sustainable tourism practices positions us well for continued growth."</p>
    
    <p>The recovery has had positive impacts on local businesses, with hotels, restaurants, and tour operators reporting improved bookings and revenue.</p>`,
    excerpt: 'Dominica\'s tourism industry shows strong recovery with 35% increase in visitor arrivals, driven by eco-tourism and sustainable practices.',
    status: 'published' as const,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    categoryName: 'Economy'
  },
  {
    title: 'New Agricultural Initiative Supports Local Farmers',
    slug: 'new-agricultural-initiative-supports-local-farmers',
    content: `<p>The Ministry of Agriculture has launched a new initiative aimed at supporting local farmers and promoting sustainable agricultural practices across Dominica.</p>
    
    <p>The "Grow Dominica" program provides farmers with access to modern farming techniques, quality seeds, and financial assistance to help increase crop yields and improve food security on the island.</p>
    
    <p>Minister of Agriculture, Dr. Michael Roberts, announced that the program will initially focus on supporting the cultivation of traditional crops such as bananas, plantains, and root vegetables, while also encouraging diversification into new crops.</p>
    
    <p>"This initiative represents our commitment to ensuring food security and supporting our farming communities," Dr. Roberts stated during the program launch.</p>
    
    <p>The program is expected to benefit over 500 farmers across the island and contribute to reducing food import dependency.</p>`,
    excerpt: 'New "Grow Dominica" agricultural initiative launched to support local farmers with modern techniques and financial assistance.',
    status: 'published' as const,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    categoryName: 'Agriculture'
  },
  {
    title: 'Education Ministry Announces New Digital Learning Program',
    slug: 'education-ministry-announces-digital-learning-program',
    content: `<p>The Ministry of Education has announced the launch of a comprehensive digital learning program designed to enhance educational opportunities for students across Dominica.</p>
    
    <p>The "Digital Dominica Education" initiative will provide students and teachers with access to modern technology and online learning resources, ensuring that education remains accessible and effective.</p>
    
    <p>Education Minister Dr. Patricia Williams explained that the program includes the distribution of tablets to students, teacher training on digital tools, and the development of locally relevant digital content.</p>
    
    <p>"We are committed to preparing our students for the digital age while ensuring that no child is left behind," Dr. Williams said.</p>
    
    <p>The program is being implemented in phases, starting with secondary schools and gradually expanding to primary schools across the island.</p>`,
    excerpt: 'Ministry of Education launches "Digital Dominica Education" program to enhance learning with technology and online resources.',
    status: 'published' as const,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    categoryName: 'Education'
  }
];

async function seedCategories(): Promise<void> {
  console.log('Seeding categories...');
  
  for (const categoryData of defaultCategories) {
    const existingCategory = await Category.findOne({ name: categoryData.name });
    
    if (!existingCategory) {
      const category = new Category(categoryData);
      await category.save();
      console.log(`Created category: ${categoryData.name}`);
    } else {
      console.log(`Category already exists: ${categoryData.name}`);
    }
  }
}

async function seedAdminUser(): Promise<void> {
  console.log('Seeding admin user...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dominica-news.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password';
  const adminName = process.env.ADMIN_NAME || 'Admin User';
  
  const existingAdmin = await User.findOne({ email: adminEmail });
  
  if (!existingAdmin) {
    const adminUser = new User({
      fullName: adminName,
      email: adminEmail,
      passwordHash: adminPassword, // The pre-save hook will hash this
      role: 'admin'
    });
    
    await adminUser.save();
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

async function seedSampleArticles(): Promise<void> {
  console.log('Seeding sample articles...');
  
  // Get the admin user to use as author
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.log('No admin user found. Skipping article seeding.');
    return;
  }
  
  for (const articleData of sampleArticles) {
    const existingArticle = await Article.findOne({ title: articleData.title });
    
    if (!existingArticle) {
      // Find the category
      const category = await Category.findOne({ name: articleData.categoryName });
      if (!category) {
        console.log(`Category not found: ${articleData.categoryName}. Skipping article: ${articleData.title}`);
        continue;
      }
      
      const article = new Article({
        title: articleData.title,
        slug: articleData.slug,
        content: articleData.content,
        excerpt: articleData.excerpt,
        status: articleData.status,
        publishedAt: articleData.publishedAt,
        categoryId: category._id,
        authorId: adminUser._id
      });
      
      await article.save();
      console.log(`Created article: ${articleData.title}`);
    } else {
      console.log(`Article already exists: ${articleData.title}`);
    }
  }
}

async function seedDatabase(): Promise<void> {
  try {
    console.log('Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    
    // Seed data in order
    await seedCategories();
    await seedAdminUser();
    await seedSampleArticles();
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase, seedCategories, seedAdminUser, seedSampleArticles };