import request from 'supertest';
import app from './app';

describe('App Setup', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Server is running',
      timestamp: expect.any(String),
    });
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: 'Not found - /api/unknown',
    });
  });
});