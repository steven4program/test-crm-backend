import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

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

  async getReadinessStatus() {
    const databaseStatus = await this.checkDatabase();
    const configStatus = this.checkConfiguration();

    return {
      status:
        databaseStatus === 'ok' && configStatus === 'ok'
          ? 'ready'
          : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseStatus,
        configuration: configStatus,
      },
    };
  }

  getLivenessStatus() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      const isConnected = await this.databaseService.checkConnection();
      return isConnected ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }

  private checkConfiguration(): string {
    const requiredConfig = [
      'NODE_ENV',
      'JWT_SECRET',
      'MYSQL_HOST',
      'MYSQL_USERNAME',
      'MYSQL_PASSWORD',
      'MYSQL_NAME',
    ];

    for (const config of requiredConfig) {
      if (!this.configService.get(config)) {
        return 'error';
      }
    }

    return 'ok';
  }
}
