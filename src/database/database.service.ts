import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: mysql.Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.createPool();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Database connection pool closed');
    }
  }

  private async createPool() {
    try {
      this.pool = mysql.createPool({
        host: this.configService.get<string>('MYSQL_HOST', 'localhost'),
        port: this.configService.get<number>('MYSQL_PORT', 3306),
        user:
          this.configService.get<string>('MYSQL_USERNAME') ||
          this.configService.get<string>('MYSQL_USER'),
        password: this.configService.get<string>('MYSQL_PASSWORD'),
        database: this.configService.get<string>('MYSQL_DATABASE'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.logger.log('Database connection pool created successfully');
    } catch (error) {
      this.logger.error('Failed to create database connection pool', error);
      throw error;
    }
  }

  async executeQuery<T = unknown>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(query, params);
      return rows as T[];
    } catch (error) {
      this.logger.error('Database query failed', {
        query,
        params,
        error: String(error),
      });
      throw error;
    }
  }

  async executeInsert(
    query: string,
    params: unknown[] = [],
  ): Promise<{ insertId: number; affectedRows: number }> {
    try {
      const [result] = await this.pool.execute(query, params);
      const insertResult = result as mysql.ResultSetHeader;
      return {
        insertId: insertResult.insertId,
        affectedRows: insertResult.affectedRows,
      };
    } catch (error) {
      this.logger.error('Database insert failed', {
        query,
        params,
        error: String(error),
      });
      throw error;
    }
  }

  async executeUpdate(
    query: string,
    params: unknown[] = [],
  ): Promise<{ affectedRows: number; changedRows: number }> {
    try {
      const [result] = await this.pool.execute(query, params);
      const updateResult = result as mysql.ResultSetHeader;
      return {
        affectedRows: updateResult.affectedRows,
        changedRows: updateResult.changedRows,
      };
    } catch (error) {
      this.logger.error('Database update failed', {
        query,
        params,
        error: String(error),
      });
      throw error;
    }
  }

  async executeDelete(
    query: string,
    params: unknown[] = [],
  ): Promise<{ affectedRows: number }> {
    try {
      const [result] = await this.pool.execute(query, params);
      const deleteResult = result as mysql.ResultSetHeader;
      return {
        affectedRows: deleteResult.affectedRows,
      };
    } catch (error) {
      this.logger.error('Database delete failed', {
        query,
        params,
        error: String(error),
      });
      throw error;
    }
  }

  async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      this.logger.error('Transaction failed and rolled back', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      this.logger.error('Database connection check failed', error);
      return false;
    }
  }
}
