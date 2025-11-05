import mongoose from 'mongoose';
import { Category } from '../models/Category';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredCategories = [
  {
    name: 'Weather',
    slug: 'weather',
    description: 'Weather updates and forecasts for Dominica',
    displayOrder: 1,
    color: '#3B82F6', // Blue
    icon: 'cloud'
  },
  {
    name: 'News',
    slug: 'news',
    description: 'General news and current events',
    displayOrder: 2,
    color: '#EF4444', // Red
    icon: 'newspaper'
  },
  {
    name: 'World',
    slug: 'world',
    description: 'International news and global events',
    displayOrder: 3,
    color: '#10B981', // Green
    icon: 'globe'
  },
  {
    name: 'Crime',
    slug: 'crime',
    description: 'Crime reports and law enforcement news',
    displayOrder: 4,
    color: '#DC2626', // Dark red
    icon: 'shield'
  },
  {
    name: 'Caribbean',
    slug: 'caribbean',
    description: 'Caribbean regional news and events',
    displayOrder: 5,
    color: '#F59E0B', // Amber
    icon: 'map'
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Entertainment news, events, and culture',
    displayOrder: 6,
    color: '#8B5CF6', // Purple
    icon: 'music'
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business news and economic updates',
    displayOrder: 7,
    color: '#059669', // Emerald
    icon: 'briefcase'
  },
  {
    name: 'Trending',
    slug: 'trending',
    description: 'Trending topics and viral stories',
    displayOrder: 8,
    color: '#EC4899', // Pink
    icon: 'trending-up'
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dominica-news';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check and create categories
    for (const categoryData of requiredCategories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      
      if (!existingCategory) {
        const category = await Category.create(categoryData);
        console.log(`✅ Created category: ${category.name} (${category.slug})`);
      } else {
        // Update existing category with new fields if they don't exist
        const updateData: any = {};
        if (!existingCategory.color) updateData.color = categoryData.color;
        if (!existingCategory.icon) updateData.icon = categoryData.icon;
        if (!existingCategory.displayOrder) updateData.displayOrder = categoryData.displayOrder;
        if (!existingCategory.description) updateData.description = categoryData.description;
        
        if (Object.keys(updateData).length > 0) {
          await Category.findByIdAndUpdate(existingCategory._id, updateData);
          console.log(`🔄 Updated category: ${existingCategory.name} with new fields`);
        } else {
          console.log(`⏭️  Category already exists: ${existingCategory.name} (${existingCategory.slug})`);
        }
      }
    }

    console.log('\n✅ Category seeding completed successfully!');
    
    // Display all categories
    const allCategories = await Category.find().sort({ displayOrder: 1 });
    console.log('\n📋 Current categories:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Order: ${cat.displayOrder}`);
    });

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCategories();
}

export { seedCategories };