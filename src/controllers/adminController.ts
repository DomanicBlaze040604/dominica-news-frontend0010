import { Request, Response } from 'express';
import Article from '../models/Article';
import { Category } from '../models/Category';
import Author from '../models/Author';
import { StaticPage } from '../models/StaticPage';

// Validate slug uniqueness
export const validateSlug = async (req: Request, res: Response) => {
  try {
    const { slug, type, excludeId } = req.query;

    if (!slug || !type) {
      return res.status(400).json({
        success: false,
        message: 'Slug and type are required'
      });
    }

    let Model;
    let suggestions: string[] = [];

    // Determine which model to check based on type
    switch (type) {
      case 'article':
        Model = Article;
        break;
      case 'category':
        Model = Category;
        break;
      case 'author':
        Model = Author;
        break;
      case 'static-page':
        Model = StaticPage;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be one of: article, category, author, static-page'
        });
    }

    // Build query to check uniqueness
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Check if slug exists
    const existingItem = await (Model as any).findOne(query);
    const isUnique = !existingItem;

    // Generate suggestions if slug is not unique
    if (!isUnique) {
      const baseSlug = slug as string;
      for (let i = 1; i <= 5; i++) {
        const suggestion = `${baseSlug}-${i}`;
        const suggestionQuery: any = { slug: suggestion };
        if (excludeId) {
          suggestionQuery._id = { $ne: excludeId };
        }
        
        const suggestionExists = await (Model as any).findOne(suggestionQuery);
        if (!suggestionExists) {
          suggestions.push(suggestion);
        }
      }
    }

    res.json({
      success: true,
      data: {
        isValid: true, // Slug format is always valid if it reaches here
        isUnique,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error validating slug',
      error: error.message
    });
  }
};

// Seed predefined static pages
export const seedStaticPages = async (_req: Request, res: Response) => {
  try {
    
    // Get existing pages count
    const existingCount = await StaticPage.countDocuments({});
    
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Static pages already exist',
        data: {
          existing: existingCount,
          message: 'Use force=true to recreate all pages'
        }
      });
    }

    // Run the seed function (but we need to modify it to not connect to DB)
    const sampleStaticPages = [
      {
        title: 'About Us',
        slug: 'about-us',
        content: `
          <h1>About Dominica News</h1>
          <p>Welcome to Dominica News, your premier source for news and information about the Nature Island of the Caribbean.</p>
          
          <h2>Our Mission</h2>
          <p>We are committed to providing accurate, timely, and comprehensive news coverage of events in Dominica and the wider Caribbean region. Our team of dedicated journalists works around the clock to bring you the stories that matter most to our community.</p>
          
          <h2>Our Team</h2>
          <p>Our newsroom consists of experienced journalists, editors, and correspondents who are passionate about telling the stories of Dominica and its people. We pride ourselves on maintaining the highest standards of journalistic integrity and ethical reporting.</p>
          
          <h2>Contact Us</h2>
          <p>We welcome your feedback, story tips, and suggestions. You can reach us through our contact page or follow us on social media for the latest updates.</p>
        `,
        metaTitle: 'About Dominica News - Your Source for Caribbean News',
        metaDescription: 'Learn about Dominica News, the premier news source for Dominica and the Caribbean region. Meet our team and discover our mission.',
        keywords: ['about', 'dominica news', 'caribbean news', 'journalism', 'news team'],
        isPublished: true,
        showInMenu: true,
        menuOrder: 1,
        template: 'about'
      },
      {
        title: 'Editorial Team',
        slug: 'editorial-team',
        content: `
          <h1>Meet Our Editorial Team</h1>
          <p>Our dedicated team of journalists and editors brings you the latest news from Dominica and the Caribbean with professionalism, integrity, and passion.</p>
          
          <h2>Our Commitment</h2>
          <p>We are committed to delivering accurate, timely, and unbiased news coverage that serves the people of Dominica and the wider Caribbean community. Our team combines local expertise with international journalism standards to bring you the stories that matter most.</p>
          
          <h2>Editorial Standards</h2>
          <p>Our editorial team adheres to the highest standards of journalism, including:</p>
          <ul>
            <li>Accuracy and fact-checking in all reporting</li>
            <li>Balanced coverage of controversial topics</li>
            <li>Respect for privacy and dignity of individuals</li>
            <li>Transparency in our reporting process</li>
            <li>Accountability to our readers and community</li>
          </ul>
          
          <h2>Contact Our Editorial Team</h2>
          <p>Have a story tip or feedback for our editorial team? We'd love to hear from you.</p>
          <p><strong>Email:</strong> editorial@dominicanews.com<br>
          <strong>Phone:</strong> +1 (767) 555-NEWS</p>
          
          <p><em>Note: Individual author profiles and contact information are displayed below when available.</em></p>
        `,
        metaTitle: 'Editorial Team - Meet Our Journalists | Dominica News',
        metaDescription: 'Meet the dedicated journalists and editors who bring you the latest news from Dominica and the Caribbean.',
        keywords: ['editorial team', 'journalists', 'editors', 'dominica news', 'news team', 'caribbean journalism'],
        isPublished: true,
        showInMenu: true,
        menuOrder: 2,
        template: 'editorial'
      },
      {
        title: 'Contact Us',
        slug: 'contact-us',
        content: `
          <h1>Contact Dominica News</h1>
          <p>We'd love to hear from you! Get in touch with our newsroom for story tips, feedback, or general inquiries.</p>
          
          <h2>Newsroom</h2>
          <p><strong>Email:</strong> newsroom@dominicanews.com</p>
          <p><strong>Phone:</strong> +1 (767) 555-NEWS</p>
          
          <h2>Editorial</h2>
          <p><strong>Email:</strong> editor@dominicanews.com</p>
          
          <h2>Advertising</h2>
          <p><strong>Email:</strong> advertising@dominicanews.com</p>
          <p><strong>Phone:</strong> +1 (767) 555-0123</p>
          
          <h2>Office Address</h2>
          <p>123 Independence Street<br>
          Roseau, Dominica<br>
          West Indies</p>
          
          <h2>Business Hours</h2>
          <p>Monday - Friday: 8:00 AM - 6:00 PM<br>
          Saturday: 9:00 AM - 2:00 PM<br>
          Sunday: Closed</p>
          
          <h2>Follow Us</h2>
          <p>Stay connected with us on social media for the latest news updates and behind-the-scenes content.</p>
        `,
        metaTitle: 'Contact Dominica News - Get in Touch',
        metaDescription: 'Contact Dominica News for story tips, feedback, or inquiries. Find our newsroom contact information and office details.',
        keywords: ['contact', 'dominica news', 'newsroom', 'phone', 'email', 'address'],
        isPublished: true,
        showInMenu: true,
        menuOrder: 3,
        template: 'contact'
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: `
          <h1>Privacy Policy</h1>
          <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
          
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you subscribe to our newsletter, comment on articles, or contact us.</p>
          
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and improve our news services</li>
            <li>Send you newsletters and updates</li>
            <li>Respond to your comments and inquiries</li>
            <li>Analyze website usage and trends</li>
          </ul>
          
          <h2>Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
          
          <h2>Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h2>Cookies</h2>
          <p>We use cookies to enhance your browsing experience and analyze website traffic. You can choose to disable cookies in your browser settings.</p>
          
          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@dominicanews.com.</p>
        `,
        metaTitle: 'Privacy Policy - Dominica News',
        metaDescription: 'Read our privacy policy to understand how Dominica News collects, uses, and protects your personal information.',
        keywords: ['privacy policy', 'data protection', 'cookies', 'personal information'],
        isPublished: true,
        showInMenu: true,
        menuOrder: 4,
        template: 'privacy'
      },
      {
        title: 'Terms of Service',
        slug: 'terms-of-service',
        content: `
          <h1>Terms of Service</h1>
          <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
          
          <h2>Acceptance of Terms</h2>
          <p>By accessing and using Dominica News, you accept and agree to be bound by the terms and provision of this agreement.</p>
          
          <h2>Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials on Dominica News for personal, non-commercial transitory viewing only.</p>
          
          <h2>Disclaimer</h2>
          <p>The materials on Dominica News are provided on an 'as is' basis. Dominica News makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          
          <h2>Limitations</h2>
          <p>In no event shall Dominica News or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Dominica News, even if Dominica News or a Dominica News authorized representative has been notified orally or in writing of the possibility of such damage.</p>
          
          <h2>Accuracy of Materials</h2>
          <p>The materials appearing on Dominica News could include technical, typographical, or photographic errors. Dominica News does not warrant that any of the materials on its website are accurate, complete, or current.</p>
          
          <h2>Links</h2>
          <p>Dominica News has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site.</p>
          
          <h2>Modifications</h2>
          <p>Dominica News may revise these terms of service for its website at any time without notice.</p>
        `,
        metaTitle: 'Terms of Service - Dominica News',
        metaDescription: 'Read our terms of service to understand the rules and regulations for using Dominica News website.',
        keywords: ['terms of service', 'terms and conditions', 'website rules', 'legal'],
        isPublished: true,
        showInMenu: true,
        menuOrder: 5,
        template: 'terms'
      }
    ];

    const createdPages = await StaticPage.insertMany(sampleStaticPages as any);

    res.json({
      success: true,
      message: 'Static pages seeded successfully',
      data: {
        created: createdPages.length,
        pages: createdPages.map(page => ({
          title: page.title,
          slug: page.slug,
          template: page.template
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error seeding static pages',
      error: error.message
    });
  }
};

// Seed predefined authors
export const seedAuthors = async (_req: Request, res: Response) => {
  try {
    // Define predefined authors directly here to avoid module import issues
    const predefinedAuthors = [
      {
        name: 'Dominica News Weather Desk',
        email: 'weather@dominicanews.com',
        title: 'Weather Reporting Team',
        bio: 'Our dedicated weather desk provides comprehensive meteorological coverage for Dominica and the Caribbean region.',
        professionalBackground: 'The Weather Desk is staffed by experienced meteorologists and weather reporters who monitor tropical systems, local weather patterns, and climate conditions affecting Dominica.',
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
        professionalBackground: 'The World Desk is comprised of experienced international correspondents and editors who specialize in global affairs, international politics, and world events.',
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
        professionalBackground: 'Selena began her journalism career at the Dominican Broadcasting Corporation before joining Dominica News as a political reporter in 2010.',
        expertise: ['Political Analysis', 'Government Affairs', 'Electoral Coverage', 'Investigative Journalism'],
        specialization: ['Politics', 'Breaking News'],
        socialMedia: {
          twitter: '@SelenaCarverDN',
          linkedin: 'selena-carver-journalist'
        },
        location: 'Roseau, Dominica',
        phone: '+1-767-555-0101',
        isActive: true
      }
    ];
    
    const results = [];
    
    for (const authorData of predefinedAuthors) {
      // Check if author already exists
      const existingAuthor = await Author.findOne({ email: authorData.email });
      
      if (existingAuthor) {
        results.push({
          name: authorData.name,
          status: 'exists',
          message: 'Author already exists'
        });
        continue;
      }

      // Create new author
      const author = new Author(authorData);
      await author.save();
      
      results.push({
        name: author.name,
        slug: author.slug,
        status: 'created',
        message: 'Author created successfully'
      });
    }

    res.json({
      success: true,
      message: 'Author seeding completed',
      data: {
        results,
        summary: {
          total: predefinedAuthors.length,
          created: results.filter(r => r.status === 'created').length,
          existing: results.filter(r => r.status === 'exists').length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error seeding authors',
      error: error.message
    });
  }
};