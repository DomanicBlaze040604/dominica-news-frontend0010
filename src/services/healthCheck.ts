import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import logger from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  checks: {
    database: ComponentHealth;
    fileSystem: ComponentHealth;
    memory: ComponentHealth;
    diskSpace: ComponentHealth;
    environment: ComponentHealth;
    dependencies: ComponentHealth;
  };
  version: string;
  environment: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
  lastChecked: Date;
}

export interface DiagnosticResult {
  component: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

class HealthCheckService {
  private lastHealthCheck: HealthCheckResult | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic health checks
    this.startPeriodicHealthChecks();
  }

  private startPeriodicHealthChecks(): void {
    // Run health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Periodic health check failed', error as Error);
      }
    }, 5 * 60 * 1000);
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const [
        databaseHealth,
        fileSystemHealth,
        memoryHealth,
        diskSpaceHealth,
        environmentHealth,
        dependenciesHealth
      ] = await Promise.all([
        this.checkDatabase(),
        this.checkFileSystem(),
        this.checkMemory(),
        this.checkDiskSpace(),
        this.checkEnvironment(),
        this.checkDependencies()
      ]);

      const overallStatus = this.determineOverallStatus([
        databaseHealth,
        fileSystemHealth,
        memoryHealth,
        diskSpaceHealth,
        environmentHealth,
        dependenciesHealth
      ]);

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: process.uptime(),
        checks: {
          database: databaseHealth,
          fileSystem: fileSystemHealth,
          memory: memoryHealth,
          diskSpace: diskSpaceHealth,
          environment: environmentHealth,
          dependencies: dependenciesHealth
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      this.lastHealthCheck = result;

      // Log health check results
      const responseTime = Date.now() - startTime;
      logger.info(
        `Health check completed: ${overallStatus}`,
        undefined,
        {
          status: overallStatus,
          responseTime,
          uptime: result.uptime,
          environment: result.environment
        }
      );

      return result;
    } catch (error) {
      logger.error('Health check failed', error as Error);
      throw error;
    }
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Check MongoDB connection
      const dbState = mongoose.connection.readyState;
      const responseTime = Date.now() - startTime;

      if (dbState === 1) { // Connected
        // Test a simple query
        await mongoose.connection.db.admin().ping();
        
        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          responseTime,
          lastChecked: new Date(),
          details: {
            connectionState: 'connected',
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
          }
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Database connection is not established',
          responseTime,
          lastChecked: new Date(),
          details: {
            connectionState: this.getConnectionStateName(dbState)
          }
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Database check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkFileSystem(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const logsDir = path.join(process.cwd(), 'logs');
      
      // Check if directories exist and are writable
      const checks = await Promise.all([
        this.checkDirectoryAccess(uploadsDir, 'uploads'),
        this.checkDirectoryAccess(logsDir, 'logs')
      ]);

      const responseTime = Date.now() - startTime;
      const hasIssues = checks.some(check => !check.accessible);

      return {
        status: hasIssues ? 'degraded' : 'healthy',
        message: hasIssues ? 'Some directories have access issues' : 'File system access is healthy',
        responseTime,
        lastChecked: new Date(),
        details: {
          directories: checks
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `File system check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkMemory(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const responseTime = Date.now() - startTime;
      
      // Convert bytes to MB
      const memoryMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };

      // Check if memory usage is concerning (>500MB heap used)
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Memory usage is normal';

      if (memoryMB.heapUsed > 500) {
        status = 'degraded';
        message = 'High memory usage detected';
      } else if (heapUsagePercent > 90) {
        status = 'degraded';
        message = 'Heap usage is very high';
      }

      return {
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        details: {
          memoryMB,
          heapUsagePercent: Math.round(heapUsagePercent)
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkDiskSpace(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const stats = await fs.promises.statfs(process.cwd());
      const responseTime = Date.now() - startTime;
      
      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const usagePercent = (usedSpace / totalSpace) * 100;

      // Convert to GB
      const diskSpaceGB = {
        total: Math.round(totalSpace / 1024 / 1024 / 1024),
        free: Math.round(freeSpace / 1024 / 1024 / 1024),
        used: Math.round(usedSpace / 1024 / 1024 / 1024),
        usagePercent: Math.round(usagePercent)
      };

      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Disk space is adequate';

      if (usagePercent > 90) {
        status = 'unhealthy';
        message = 'Disk space is critically low';
      } else if (usagePercent > 80) {
        status = 'degraded';
        message = 'Disk space is running low';
      }

      return {
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        details: diskSpaceGB
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'degraded',
        message: `Disk space check not available: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkEnvironment(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const requiredEnvVars = [
        'NODE_ENV',
        'MONGODB_URI',
        'JWT_SECRET',
        'PORT'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      const responseTime = Date.now() - startTime;

      if (missingVars.length > 0) {
        return {
          status: 'unhealthy',
          message: `Missing required environment variables: ${missingVars.join(', ')}`,
          responseTime,
          lastChecked: new Date(),
          details: {
            missingVariables: missingVars,
            totalRequired: requiredEnvVars.length
          }
        };
      }

      return {
        status: 'healthy',
        message: 'All required environment variables are set',
        responseTime,
        lastChecked: new Date(),
        details: {
          nodeEnv: process.env.NODE_ENV,
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Environment check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkDependencies(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Check critical dependencies
      const dependencies = [
        { name: 'mongoose', module: mongoose },
        { name: 'express', module: require('express') },
        { name: 'jsonwebtoken', module: require('jsonwebtoken') }
      ];

      const responseTime = Date.now() - startTime;
      const dependencyInfo = dependencies.map(dep => ({
        name: dep.name,
        version: dep.module.version || 'unknown',
        loaded: !!dep.module
      }));

      return {
        status: 'healthy',
        message: 'All critical dependencies are loaded',
        responseTime,
        lastChecked: new Date(),
        details: {
          dependencies: dependencyInfo
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'degraded',
        message: `Dependency check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkDirectoryAccess(dirPath: string, name: string): Promise<{ name: string; path: string; accessible: boolean; writable: boolean }> {
    try {
      // Check if directory exists
      await fs.promises.access(dirPath, fs.constants.F_OK);
      
      // Check if writable
      await fs.promises.access(dirPath, fs.constants.W_OK);
      
      return {
        name,
        path: dirPath,
        accessible: true,
        writable: true
      };
    } catch (error) {
      // Try to create directory if it doesn't exist
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
        return {
          name,
          path: dirPath,
          accessible: true,
          writable: true
        };
      } catch (createError) {
        return {
          name,
          path: dirPath,
          accessible: false,
          writable: false
        };
      }
    }
  }

  private getConnectionStateName(state: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[state as keyof typeof states] || 'unknown';
  }

  private determineOverallStatus(checks: ComponentHealth[]): HealthCheckResult['status'] {
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  // Diagnostic methods
  async runDiagnostics(): Promise<DiagnosticResult[]> {
    const diagnostics: DiagnosticResult[] = [];

    try {
      // Database connectivity test
      diagnostics.push(await this.diagnoseDatabaseConnectivity());
      
      // API endpoints test
      diagnostics.push(await this.diagnoseApiEndpoints());
      
      // File system permissions test
      diagnostics.push(await this.diagnoseFileSystemPermissions());
      
      // Memory usage analysis
      diagnostics.push(await this.diagnoseMemoryUsage());
      
      // Environment configuration test
      diagnostics.push(await this.diagnoseEnvironmentConfiguration());

    } catch (error) {
      diagnostics.push({
        component: 'diagnostics',
        status: 'fail',
        message: `Diagnostics failed: ${(error as Error).message}`,
        timestamp: new Date()
      });
    }

    return diagnostics;
  }

  private async diagnoseDatabaseConnectivity(): Promise<DiagnosticResult> {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;

      return {
        component: 'database_connectivity',
        status: 'pass',
        message: 'Database connectivity test passed',
        details: { responseTime },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        component: 'database_connectivity',
        status: 'fail',
        message: `Database connectivity test failed: ${(error as Error).message}`,
        timestamp: new Date()
      };
    }
  }

  private async diagnoseApiEndpoints(): Promise<DiagnosticResult> {
    try {
      // This would typically test internal API endpoints
      // For now, we'll just check if the server is running
      const isRunning = process.uptime() > 0;

      return {
        component: 'api_endpoints',
        status: isRunning ? 'pass' : 'fail',
        message: isRunning ? 'API server is running' : 'API server is not running',
        details: { uptime: process.uptime() },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        component: 'api_endpoints',
        status: 'fail',
        message: `API endpoints test failed: ${(error as Error).message}`,
        timestamp: new Date()
      };
    }
  }

  private async diagnoseFileSystemPermissions(): Promise<DiagnosticResult> {
    try {
      const testFile = path.join(process.cwd(), 'test-write-permissions.tmp');
      
      // Try to write a test file
      await fs.promises.writeFile(testFile, 'test');
      await fs.promises.unlink(testFile);

      return {
        component: 'file_system_permissions',
        status: 'pass',
        message: 'File system permissions test passed',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        component: 'file_system_permissions',
        status: 'fail',
        message: `File system permissions test failed: ${(error as Error).message}`,
        timestamp: new Date()
      };
    }
  }

  private async diagnoseMemoryUsage(): Promise<DiagnosticResult> {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      let status: DiagnosticResult['status'] = 'pass';
      let message = 'Memory usage is within normal limits';

      if (heapUsedMB > 500) {
        status = 'warn';
        message = 'High memory usage detected';
      } else if (heapUsagePercent > 90) {
        status = 'warn';
        message = 'Heap usage is very high';
      }

      return {
        component: 'memory_usage',
        status,
        message,
        details: {
          heapUsedMB,
          heapUsagePercent: Math.round(heapUsagePercent)
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        component: 'memory_usage',
        status: 'fail',
        message: `Memory usage test failed: ${(error as Error).message}`,
        timestamp: new Date()
      };
    }
  }

  private async diagnoseEnvironmentConfiguration(): Promise<DiagnosticResult> {
    try {
      const requiredVars = ['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET', 'PORT'];
      const missingVars = requiredVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        return {
          component: 'environment_configuration',
          status: 'fail',
          message: `Missing required environment variables: ${missingVars.join(', ')}`,
          details: { missingVariables: missingVars },
          timestamp: new Date()
        };
      }

      return {
        component: 'environment_configuration',
        status: 'pass',
        message: 'Environment configuration is complete',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        component: 'environment_configuration',
        status: 'fail',
        message: `Environment configuration test failed: ${(error as Error).message}`,
        timestamp: new Date()
      };
    }
  }

  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

export default healthCheckService;