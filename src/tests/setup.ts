import { config } from '../config/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '24h';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);

// Mock external dependencies that might cause issues in tests
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
  destroy: jest.fn(),
}));

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock Sharp for image processing
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
    toFile: jest.fn().mockResolvedValue({ size: 1024 }),
  }));
});

export {};