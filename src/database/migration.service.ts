import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async runMigrations(): Promise<void> {
    this.logger.log('Starting database migrations...');

    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get list of migration files - handle both dev and prod paths
      let migrationsDir = path.join(__dirname, 'migrations');

      // In development, __dirname points to src/database, in production to dist/database
      if (!fs.existsSync(migrationsDir)) {
        // Try the src path (for development)
        migrationsDir = path.join(process.cwd(), 'src/database/migrations');
      }

      if (!fs.existsSync(migrationsDir)) {
        this.logger.warn('Migrations directory not found, skipping migrations');
        return;
      }

      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        await this.runMigration(file);
      }

      this.logger.log('Database migrations completed successfully');
    } catch (error) {
      this.logger.error('Database migrations failed', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.databaseService.executeQuery(query);
    this.logger.log('Migrations table ensured');
  }

  private async runMigration(filename: string): Promise<void> {
    // Check if migration has already been run
    const checkQuery = 'SELECT id FROM migrations WHERE filename = ?';
    const existing = await this.databaseService.executeQuery(checkQuery, [
      filename,
    ]);

    if (existing.length > 0) {
      this.logger.log(`Migration ${filename} already executed, skipping`);
      return;
    }

    try {
      // Read and execute migration file - handle both dev and prod paths
      let migrationPath = path.join(__dirname, 'migrations', filename);

      if (!fs.existsSync(migrationPath)) {
        // Try the src path (for development)
        migrationPath = path.join(
          process.cwd(),
          'src/database/migrations',
          filename,
        );
      }

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');

      // Split by semicolons and execute each statement
      const statements = migrationSql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await this.databaseService.executeQuery(statement);
      }

      // Record migration as executed
      const recordQuery = 'INSERT INTO migrations (filename) VALUES (?)';
      await this.databaseService.executeInsert(recordQuery, [filename]);

      this.logger.log(`Migration ${filename} executed successfully`);
    } catch (error) {
      this.logger.error(`Migration ${filename} failed`, error);
      throw error;
    }
  }

  async seedDefaultAdmin(): Promise<void> {
    const bcrypt = await import('bcrypt');

    try {
      // Check if any admin user exists
      const adminCheck = await this.databaseService.executeQuery(
        'SELECT id FROM users WHERE role = ? LIMIT 1',
        ['admin'],
      );

      if (adminCheck.length > 0) {
        this.logger.log('Admin user already exists, skipping seed');
        return;
      }

      // Create default admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await this.databaseService.executeInsert(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin'],
      );

      this.logger.log('Default admin user created successfully');
      this.logger.log('Username: admin, Password: Admin@123');
    } catch (error) {
      this.logger.error('Failed to seed default admin user', error);
      throw error;
    }
  }
}
