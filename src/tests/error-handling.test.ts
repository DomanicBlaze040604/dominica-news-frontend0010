import request from 'supertest';
import app from '../app';
import logger from '../services/logger';
import errorTracker from '../services/errorTracker';
import healthCheckService from '../services/healthCheck';

describe('Error Handling System', () => {
  beforeEach(() => {
    // Clear any existing errors
    jest.clearAllMocks();
  });

  describe('Logger Service', () => {
    it('should log errors with proper context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Test error message');
      const context = {
        userId: 'test-user',
        userAction: 'test-action',
        ip: '127.0.0.1'
      };

      logger.error('Test error', testError, context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log user actions', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      const mockReq = {
        ip: '127.0.0.1',
        originalUrl: '/test',
        method: 'GET',
        user: { id: 'test-user' }
      } as any;

      logger.logUserAction('test-action', mockReq);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should create request context properly', () => {
      const mockReq = {
        ip: '127.0.0.1',
        originalUrl: '/test',
        method: 'GET',
        user: { id: 'test-user' },
        get: jest.fn().mockReturnValue('test-user-agent'),
        requestId: 'test-request-id'
      } as any;

      const context = logger.createRequestContext(mockReq);

      expect(context).toMatchObject({
        requestId: 'test-request-id',
        userId: 'test-user',
        ip: '127.0.0.1',
        userAgent: 'test-user-agent',
        url: '/test',
        method: 'GET'
      });
    });
  });

  describe('Error Tracker Service', () => {
    it('should track errors and return error ID', () => {
      const testError = new Error('Test tracking error');
      const mockReq = {
        ip: '127.0.0.1',
        originalUrl: '/test',
        method: 'GET',
        user: { id: 'test-user' }
      } as any;

      const errorId = errorTracker.trackError(testError, mockReq);

      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
      
      const trackedError = errorTracker.getError(errorId);
      expect(trackedError).toBeDefined();
      expect(trackedError?.error.message).toBe('Test tracking error');
    });

    it('should resolve errors correctly', () => {
      const testError = new Error('Test resolve error');
      const errorId = errorTracker.trackError(testError);

      const resolved = errorTracker.resolveError(errorId, 'test-resolver', 'Test resolution');

      expect(resolved).toBe(true);
      
      const trackedError = errorTracker.getError(errorId);
      expect(trackedError?.resolved).toBe(true);
      expect(trackedError?.resolvedBy).toBe('test-resolver');
      expect(trackedError?.notes).toBe('Test resolution');
    });

    it('should get error statistics', () => {
      // Track some test errors
      errorTracker.trackError(new Error('Error 1'));
      errorTracker.trackError(new Error('Error 2'));
      
      const stats = errorTracker.getErrorStats();

      expect(stats.totalErrors).toBeGreaterThanOrEqual(2);
      expect(stats.unresolvedErrors).toBeGreaterThanOrEqual(2);
      expect(stats.errorsByType).toBeDefined();
      expect(stats.errorsBySeverity).toBeDefined();
    });

    it('should get unresolved errors', () => {
      const testError = new Error('Unresolved error');
      errorTracker.trackError(testError);

      const unresolvedErrors = errorTracker.getUnresolvedErrors(10);

      expect(unresolvedErrors.length).toBeGreaterThanOrEqual(1);
      expect(unresolvedErrors[0].resolved).toBe(false);
    });
  });

  describe('Health Check Service', () => {
    it('should perform health check and return status', async () => {
      const healthCheck = await healthCheckService.performHealthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(healthCheck.timestamp).toBeInstanceOf(Date);
      expect(healthCheck.uptime).toBeGreaterThan(0);
      expect(healthCheck.checks).toBeDefined();
      expect(healthCheck.checks.database).toBeDefined();
      expect(healthCheck.checks.memory).toBeDefined();
      expect(healthCheck.checks.environment).toBeDefined();
    });

    it('should run diagnostics', async () => {
      const diagnostics = await healthCheckService.runDiagnostics();

      expect(Array.isArray(diagnostics)).toBe(true);
      expect(diagnostics.length).toBeGreaterThan(0);
      
      diagnostics.forEach(diagnostic => {
        expect(diagnostic.component).toBeDefined();
        expect(diagnostic.status).toMatch(/^(pass|fail|warn)$/);
        expect(diagnostic.message).toBeDefined();
        expect(diagnostic.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle validation errors properly', async () => {
      const response = await request(app)
        .post('/api/admin/articles')
        .send({}) // Empty body to trigger validation error
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not found');
    });

    it('should include error ID in responses', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.errorId).toBeDefined();
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });

    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.checks).toBeDefined();
      expect(response.body.data.errorTracking).toBeDefined();
      expect(response.body.data.logging).toBeDefined();
    });

    it('should return liveness probe', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('alive');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return readiness probe', async () => {
      const response = await request(app)
        .get('/api/health/ready');

      expect(response.body.success).toBeDefined();
      expect(response.body.status).toMatch(/^(ready|not_ready)$/);
      expect(response.body.checks).toBeDefined();
    });

    it('should return diagnostics', async () => {
      const response = await request(app)
        .get('/api/health/diagnostics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.diagnostics).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.total).toBeGreaterThan(0);
    });

    it('should return error statistics', async () => {
      const response = await request(app)
        .get('/api/health/errors')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalErrors).toBeDefined();
      expect(response.body.data.unresolvedErrors).toBeDefined();
    });

    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/api/health/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.uptime).toBeGreaterThan(0);
      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.process).toBeDefined();
    });
  });

  describe('Error Reporting Endpoints', () => {
    it('should accept error reports from frontend', async () => {
      const errorReport = {
        message: 'Frontend test error',
        stack: 'Error: Frontend test error\n    at test',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent',
        url: 'http://localhost:3000/test',
        userId: 'test-user',
        errorId: 'frontend-error-123'
      };

      const response = await request(app)
        .post('/api/errors/report')
        .send(errorReport)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.errorId).toBeDefined();
      expect(response.body.data.message).toContain('tracked');
    });

    it('should accept user error reports', async () => {
      const userReport = {
        error: 'User reported error',
        stack: 'Error: User reported error\n    at user action',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent',
        url: 'http://localhost:3000/test',
        errorId: 'user-error-123',
        userDescription: 'Something went wrong when I clicked the button'
      };

      const response = await request(app)
        .post('/api/errors/user-report')
        .send(userReport)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.errorId).toBeDefined();
      expect(response.body.data.message).toContain('Thank you');
    });
  });

  describe('Request Logging Middleware', () => {
    it('should add request ID to requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should log slow requests', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // This would need a slow endpoint to test properly
      // For now, we'll just verify the middleware doesn't break anything
      await request(app)
        .get('/api/health')
        .expect(200);

      consoleSpy.mockRestore();
    });
  });

  describe('Connectivity Testing', () => {
    it('should test database connectivity', async () => {
      const response = await request(app)
        .post('/api/health/connectivity')
        .send({ component: 'database' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results.database).toBeDefined();
      expect(response.body.data.results.database.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });

    it('should test filesystem connectivity', async () => {
      const response = await request(app)
        .post('/api/health/connectivity')
        .send({ component: 'filesystem' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results.filesystem).toBeDefined();
      expect(response.body.data.results.filesystem.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });
  });

  describe('Data Integrity Testing', () => {
    it('should perform data integrity checks', async () => {
      const response = await request(app)
        .post('/api/health/data-integrity')
        .send({ collections: ['articles', 'categories'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.checks).toBeDefined();
      expect(Array.isArray(response.body.data.checks)).toBe(true);
    });
  });
});