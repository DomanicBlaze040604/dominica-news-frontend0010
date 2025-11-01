import { Router } from 'express';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Article } from '../models/Article';

const router = Router();

const sampleCategories = [
  {
    name: 'Breaking News',
    slug: 'breaking-news',
    description: 'Latest breaking news from Dominica',
    displayOrder: 1
  },
  {
    name: 'Politics',
    slug: 'politics',
    description: 'Political news and updates',
    displayOrder: 2
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports news and events',
    displayOrder: 3
  },
  {
    name: 'Tourism',
    slug: 'tourism',
    description: 'Tourism and travel in Dominica',
    displayOrder: 4
  },
  {
    name: 'Culture',
    slug: 'culture',
    description: 'Cultural events and traditions',
    displayOrder: 5
  }
];

const sampleArticles = [
  {
    title: 'Dominica Celebrates Independence Day with Grand Festivities',
    slug: 'dominica-celebrates-independence-day-2024',
    excerpt: 'The Commonwealth of Dominica marked its 46th Independence Day with colorful parades, cultural performances, and community celebrations across the island.',
    content: `The Commonwealth of Dominica celebrated its 46th Independence Day on November 3rd with spectacular festivities that showcased the island's rich culture and heritage.

The celebrations began early morning with the traditional flag-raising ceremony at the State House, attended by Prime Minister Roosevelt Skerrit, government officials, and hundreds of citizens.

The highlight of the day was the Independence Day Parade through the streets of Roseau, featuring marching bands, cultural groups, and school children dressed in the national colors of green, yellow, and black.

"Today we celebrate not just our independence, but our resilience, our culture, and our bright future," said Prime Minister Skerrit during his Independence Day address.

The festivities continued throughout the day with cultural performances at the Botanic Gardens, featuring traditional Creole music, dance, and local cuisine.

Citizens and visitors alike joined in the celebrations, making it a memorable day for the Nature Island of the Caribbean.`,
    categorySlug: 'breaking-news',
    status: 'published',
    featuredImage: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=400&fit=crop',
    tags: ['independence', 'celebration', 'culture', 'dominica']
  },
  {
    title: 'New Marine Protected Area Established in Dominica Waters',
    slug: 'new-marine-protected-area-dominica-2024',
    excerpt: 'The government announces the creation of a new marine protected area covering 50 square kilometers of pristine waters around the island.',
    content: `Dominica has taken a significant step towards marine conservation with the establishment of a new Marine Protected Area (MPA) covering 50 square kilometers of waters around the island.

The new protected area, announced by the Ministry of Environment, will help preserve critical marine habitats including coral reefs, seagrass beds, and spawning grounds for various fish species.

"This initiative demonstrates our commitment to protecting our marine biodiversity for future generations," said Environment Minister Cozier Frederick.

The MPA will restrict certain fishing activities while promoting sustainable tourism practices such as whale watching and diving.

Local fishermen will be provided with alternative livelihood programs and training in sustainable fishing practices.

The protected area is expected to boost eco-tourism and contribute to the island's reputation as a premier destination for marine wildlife enthusiasts.

Dominica is already famous for its resident sperm whale population, and this new protection will help ensure their habitat remains pristine.`,
    categorySlug: 'breaking-news',
    status: 'published',
    featuredImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
    tags: ['environment', 'marine', 'conservation', 'tourism']
  },
  {
    title: 'Prime Minister Announces New Infrastructure Development Plan',
    slug: 'pm-announces-infrastructure-development-plan-2024',
    excerpt: 'A comprehensive $200 million infrastructure plan aims to improve roads, bridges, and public facilities across Dominica over the next five years.',
    content: `Prime Minister Roosevelt Skerrit unveiled an ambitious $200 million infrastructure development plan that will transform Dominica's transportation and public facilities over the next five years.

The comprehensive plan includes:

**Road Infrastructure:**
- Rehabilitation of 150 kilometers of roads
- Construction of new bridges in rural communities
- Improved drainage systems to handle heavy rainfall

**Public Facilities:**
- Modernization of health centers
- Expansion of educational facilities
- Upgrade of community centers

**Digital Infrastructure:**
- High-speed internet expansion to rural areas
- Digital government services platform
- Smart city initiatives for Roseau

The project will be funded through a combination of government resources, international partnerships, and the Citizenship by Investment Program.

"This investment will create jobs, improve quality of life, and position Dominica as a modern, resilient nation," the Prime Minister stated.

Construction is expected to begin in early 2025, with completion targeted for 2029.

The plan emphasizes climate resilience, incorporating lessons learned from Hurricane Maria to build back better and stronger.`,
    categorySlug: 'politics',
    status: 'published',
    featuredImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=400&fit=crop',
    tags: ['infrastructure', 'development', 'government', 'investment']
  },
  {
    title: 'Dominica Cricket Team Wins Regional Championship',
    slug: 'dominica-cricket-team-wins-regional-championship-2024',
    excerpt: 'The Dominica national cricket team secured their first regional championship victory in a thrilling final match against Saint Lucia.',
    content: `In a historic achievement, the Dominica national cricket team won their first-ever regional championship, defeating Saint Lucia by 6 wickets in a nail-biting final at Windsor Park.

**Match Highlights:**
- Dominica won the toss and elected to field first
- Saint Lucia scored 245 runs in their innings
- Dominica chased down the target with 4 overs to spare
- Man of the Match: Kavem Hodge with 89 not out

Captain Kavem Hodge led from the front with a masterful innings of 89 not out, guiding his team to victory in front of a packed home crowd.

"This victory belongs to all of Dominica. We've worked hard for this moment, and I'm proud of every player who contributed to this success," said Captain Hodge.

The championship win qualifies Dominica for the Caribbean Premier League qualifiers and provides a significant boost to cricket development on the island.

Minister of Sports Roselyn Paul congratulated the team and announced increased funding for cricket infrastructure and youth development programs.

The victory celebration continued late into the night with fans gathering at the Roseau waterfront to honor their cricket heroes.

This achievement marks a new chapter in Dominican sports and inspires young athletes across the island.`,
    categorySlug: 'sports',
    status: 'published',
    featuredImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop',
    tags: ['cricket', 'sports', 'championship', 'victory']
  },
  {
    title: 'World Heritage Committee Considers Dominica for UNESCO Status',
    slug: 'dominica-unesco-world-heritage-consideration-2024',
    excerpt: 'Dominica\'s Morne Trois Pitons World Heritage site expansion proposal is under review by UNESCO for additional protected status.',
    content: `The UNESCO World Heritage Committee is reviewing Dominica's proposal to expand the Morne Trois Pitons World Heritage site to include additional areas of outstanding natural beauty and cultural significance.

**Proposed Expansion Areas:**
- Boiling Lake and surrounding thermal features
- Additional rainforest corridors
- Traditional Kalinago cultural sites
- Coastal mangrove ecosystems

The expansion would increase the protected area by 40% and provide enhanced protection for endemic species and traditional cultural practices.

"This recognition would cement Dominica's position as a global leader in conservation and sustainable tourism," said Tourism Minister Denise Charles.

The proposal highlights Dominica's unique geological features, including the world's second-largest hot spring lake and pristine rainforest ecosystems.

Local communities, including the Kalinago people, have been actively involved in the proposal process, ensuring their traditional knowledge and practices are preserved.

If approved, the expanded site would attract more international visitors and provide additional funding for conservation efforts.

The UNESCO committee's decision is expected in early 2025, following a comprehensive site evaluation by international experts.

This initiative aligns with Dominica's commitment to becoming the world's first climate-resilient nation.`,
    categorySlug: 'tourism',
    status: 'published',
    featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    tags: ['unesco', 'heritage', 'tourism', 'conservation']
  },
  {
    title: 'Annual World Creole Music Festival Announces Star-Studded Lineup',
    slug: 'world-creole-music-festival-2024-lineup',
    excerpt: 'The 2024 World Creole Music Festival promises three nights of incredible performances featuring international and local Creole artists.',
    content: `The highly anticipated 2024 World Creole Music Festival has announced its star-studded lineup, featuring a perfect blend of international superstars and beloved local artists.

**Festival Highlights:**

**Friday Night - Zouk & Kompa:**
- Kassav' (Guadeloupe)
- T-Vice (Haiti)
- Harmonik (Haiti)

**Saturday Night - Soca & Calypso:**
- Machel Montano (Trinidad)
- Bunji Garlin (Trinidad)
- Teddyson John (Saint Lucia)

**Sunday Night - Bouyon & Local Artists:**
- WCK (Dominica)
- Signal Band (Dominica)
- Asa Bantan (Dominica)

The festival, held at Windsor Park Stadium from October 25-27, celebrates the rich musical heritage of the Caribbean and attracts thousands of visitors from around the world.

"This year's lineup represents the very best of Creole music culture," said Festival Director Colin Piper. "We're showcasing the diversity and vibrancy that makes Caribbean music so special."

New features for 2024 include:
- Extended VIP areas with premium amenities
- Local food village featuring traditional cuisine
- Cultural workshops and exhibitions
- Youth talent showcase

Tickets are now available online and at local outlets, with early bird discounts available until September 30th.

The festival significantly boosts Dominica's tourism economy, with hotels reporting full bookings during the festival weekend.

This year marks the 25th anniversary of the World Creole Music Festival, making it an extra special celebration of Caribbean culture.`,
    categorySlug: 'culture',
    status: 'published',
    featuredImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    tags: ['music', 'festival', 'culture', 'tourism', 'creole']
  }
];

router.post('/sample-data', async (req, res) => {
  try {
    // Create admin user if it doesn't exist
    let adminUser = await User.findOne({ email: 'admin@dominica-news.com' });
    
    if (!adminUser) {
      adminUser = new User({
        email: 'admin@dominica-news.com',
        passwordHash: 'password', // This will be hashed by the pre-save middleware
        fullName: 'Admin User',
        role: 'admin'
      });
      await adminUser.save();
    }

    // Clear existing data
    await Article.deleteMany({});
    await Category.deleteMany({});

    // Create categories
    const createdCategories = await Category.insertMany(sampleCategories);

    // Create articles with proper category references
    const articlesWithCategoryIds = sampleArticles.map(article => {
      const category = createdCategories.find(cat => cat.slug === article.categorySlug);
      return {
        ...article,
        categoryId: category?._id,
        authorId: adminUser._id,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const createdArticles = await Article.insertMany(articlesWithCategoryIds);

    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        categoriesCreated: createdCategories.length,
        articlesCreated: createdArticles.length,
        adminUser: {
          email: 'admin@dominica-news.com',
          password: 'password'
        }
      }
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as seedRoutes };