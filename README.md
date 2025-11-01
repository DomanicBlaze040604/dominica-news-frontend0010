# Dominica News Backend API

Backend API for the Dominica News Content Management System built with Express.js, TypeScript, and MongoDB.

## Features

- RESTful API with Express.js and TypeScript
- MongoDB Atlas integration with Mongoose ODM
- JWT-based authentication and authorization
- File upload handling with Multer
- Image processing with Sharp
- Comprehensive error handling and validation
- Rate limiting and security middleware
- Unit and integration testing with Jest

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB Atlas connection string and other configuration values.

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` by default.

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Building for Production

Build the project:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration
- `GET /api/auth/me` - Get current user

### Articles
- `GET /api/articles` - Get published articles
- `GET /api/articles/:slug` - Get single article
- `GET /api/admin/articles` - Get all articles (admin)
- `POST /api/admin/articles` - Create article (admin)
- `PUT /api/admin/articles/:id` - Update article (admin)
- `DELETE /api/admin/articles/:id` - Delete article (admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug/articles` - Get articles by category
- `POST /api/admin/categories` - Create category (admin)
- `PUT /api/admin/categories/:id` - Update category (admin)
- `DELETE /api/admin/categories/:id` - Delete category (admin)

### Images
- `POST /api/admin/images/upload` - Upload image (admin)
- `GET /api/admin/images` - Get all images (admin)
- `DELETE /api/admin/images/:id` - Delete image (admin)
- `GET /api/images/:filename` - Serve image

### Health Check
- `GET /api/health` - Server health check

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── tests/           # Test files
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT