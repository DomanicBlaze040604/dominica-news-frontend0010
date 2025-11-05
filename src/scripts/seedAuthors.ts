import mongoose from 'mongoose';
import Author from '../models/Author';

const predefinedAuthors = [
  {
    name: 'Dominica News Weather Desk',
    email: 'weather@dominicanews.com',
    title: 'Weather Reporting Team',
    bio: 'Our dedicated weather desk provides comprehensive meteorological coverage for Dominica and the Caribbean region.',
    professionalBackground: 'The Weather Desk is staffed by experienced meteorologists and weather reporters who monitor tropical systems, local weather patterns, and climate conditions affecting Dominica. Our team works closely with the Dominica Meteorological Service and regional weather agencies to provide accurate, timely weather information to our readers.',
    expertise: ['Weather Forecasting', 'Hurricane Tracking', 'Climate Reporting', 'Emergency Weather Alerts'],
    specialization: ['Weather', 'Environment', 'Breaking News'],
    location: 'Roseau, Dominica',
    isActive: true
  },
  {
    name: 'World Desk',
    email: 'world@dominicanews.com',
    title: 'International News Team',
    bio: 'Our World Desk brings you comprehensive coverage of international news with a focus on stories that impact the Caribbean region.',
    professionalBackground: 'The World Desk is comprised of experienced international correspondents and editors who specialize in global affairs, international politics, and world events. Our team maintains strong relationships with news agencies worldwide and focuses on stories that have relevance to Caribbean audiences, including diaspora news, international trade, and global climate issues.',
    expertise: ['International Relations', 'Global Politics', 'Caribbean Diaspora', 'International Trade'],
    specialization: ['World News', 'Politics', 'Caribbean', 'Business'],
    location: 'Roseau, Dominica',
    isActive: true
  },
  {
    name: 'Selena Carver',
    email: 'selena.carver@dominicanews.com',
    title: 'Senior Political Correspondent',
    bio: 'Selena Carver is an award-winning journalist with over 15 years of experience covering Dominican politics and Caribbean affairs.',
    professionalBackground: 'Selena began her journalism career at the Dominican Broadcasting Corporation before joining Dominica News as a political reporter in 2010. She has covered five general elections, numerous parliamentary sessions, and has conducted exclusive interviews with regional leaders. Her investigative work on government transparency has earned her recognition from the Caribbean Media Awards. She holds a Bachelor\'s degree in Mass Communication from the University of the West Indies and a Master\'s in Political Science.',
    expertise: ['Political Analysis', 'Government Affairs', 'Electoral Coverage', 'Investigative Journalism'],
    specialization: ['Politics', 'Breaking News'],
    socialMedia: {
      twitter: '@SelenaCarverDN',
      linkedin: 'selena-carver-journalist'
    },
    location: 'Roseau, Dominica',
    phone: '+1-767-555-0101',
    isActive: true
  },
  {
    name: 'Alana Joseph',
    email: 'alana.joseph@dominicanews.com',
    title: 'Culture and Tourism Reporter',
    bio: 'Alana Joseph specializes in covering Dominican culture, arts, and the tourism industry with a passion for showcasing the island\'s rich heritage.',
    professionalBackground: 'A native of Portsmouth, Alana has been documenting Dominican culture and traditions for over a decade. She started as a freelance writer for various Caribbean publications before joining Dominica News in 2015. Her work focuses on preserving and promoting Dominican cultural heritage, covering everything from traditional festivals to contemporary arts. She has produced award-winning features on Dominican music, dance, and culinary traditions. Alana holds a degree in Caribbean Studies from the University of the West Indies.',
    expertise: ['Cultural Reporting', 'Tourism Industry', 'Arts Coverage', 'Heritage Documentation'],
    specialization: ['Culture', 'Tourism', 'Entertainment'],
    socialMedia: {
      instagram: '@alanajoseph_culture',
      facebook: 'AJosephReporter'
    },
    location: 'Portsmouth, Dominica',
    phone: '+1-767-555-0102',
    isActive: true
  },
  {
    name: 'Kervin Joseph',
    email: 'kervin.joseph@dominicanews.com',
    title: 'Sports Editor',
    bio: 'Kervin Joseph leads our sports coverage with comprehensive reporting on Dominican athletics and Caribbean sports.',
    professionalBackground: 'Kervin has been covering Dominican sports for over 12 years, starting as a sports correspondent for local radio stations before joining Dominica News as Sports Editor in 2018. He has covered multiple Caribbean Games, regional cricket tournaments, and Olympic qualifying events. His expertise spans from grassroots community sports to professional athletics. Kervin is particularly known for his coverage of Dominican cricket, football, and athletics. He played semi-professional cricket before transitioning to sports journalism.',
    expertise: ['Sports Journalism', 'Cricket Coverage', 'Athletics Reporting', 'Sports Photography'],
    specialization: ['Sports'],
    socialMedia: {
      twitter: '@KervinSports',
      instagram: '@kervinjoseph_sports'
    },
    location: 'Roseau, Dominica',
    phone: '+1-767-555-0103',
    website: 'https://dominicansports.blog',
    isActive: true
  },
  {
    name: 'Darren Fontaine',
    email: 'darren.fontaine@dominicanews.com',
    title: 'Business and Economics Reporter',
    bio: 'Darren Fontaine covers business, economics, and development issues affecting Dominica and the wider Caribbean region.',
    professionalBackground: 'With a background in economics and finance, Darren brings analytical depth to business reporting. He joined Dominica News in 2017 after working as an economic analyst for the Caribbean Development Bank. His reporting focuses on economic policy, business development, and the impact of global economic trends on small island developing states. Darren has covered major economic summits and has interviewed numerous Caribbean finance ministers and business leaders. He holds an MBA in International Business and a Bachelor\'s degree in Economics.',
    expertise: ['Economic Analysis', 'Business Reporting', 'Financial Markets', 'Development Economics'],
    specialization: ['Business', 'Politics', 'Caribbean'],
    socialMedia: {
      linkedin: 'darren-fontaine-business',
      twitter: '@DarrenEconNews'
    },
    location: 'Roseau, Dominica',
    phone: '+1-767-555-0104',
    isActive: true
  }
];

async function seedAuthors() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dominica-news';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing authors (optional - comment out if you want to keep existing ones)
    // await Author.deleteMany({});
    // console.log('Cleared existing authors');

    // Insert predefined authors
    for (const authorData of predefinedAuthors) {
      // Check if author already exists
      const existingAuthor = await Author.findOne({ email: authorData.email });
      
 if (existingAuthor) {
        console.log(`Author ${authorData.name} already exists, skipping...`);
        continue;
      }

      // Create new author
      const author = new Author(authorData);
      await author.save();
      console.log(`Created author: ${author.name} (${author.slug})`);
    }

    console.log('Author seeding completed successfully');
  } catch (error) {
    console.error('Error seeding authors:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAuthors();
}

export { seedAuthors, predefinedAuthors };