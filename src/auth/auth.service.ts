import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import {
  User,
  UserWithPassword,
  JwtPayload,
} from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    user: User;
  }> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    this.logger.log(`User ${user.username} logged in successfully`);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const users = await this.databaseService.executeQuery<UserWithPassword>(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username],
      );

      if (users.length === 0) {
        return null;
      }

      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error) {
      this.logger.error('Error validating user', error);
      return null;
    }
  }

  async validateUserById(userId: number): Promise<User | null> {
    try {
      const users = await this.databaseService.executeQuery<User>(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId],
      );

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      this.logger.error('Error validating user by ID', error);
      return null;
    }
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.validateUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
