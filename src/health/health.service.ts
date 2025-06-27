import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: process.env.npm_package_version ?? '0.0.1',
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
    };
  }

  getReadinessStatus() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok', // Will be implemented with actual DB connection
        configuration: this.checkConfiguration(),
      },
    };
  }

  getLivenessStatus() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private checkConfiguration(): string {
    const requiredConfig = ['NODE_ENV', 'JWT_SECRET'];

    for (const config of requiredConfig) {
      if (!this.configService.get(config)) {
        return 'error';
      }
    }

    return 'ok';
  }
}
