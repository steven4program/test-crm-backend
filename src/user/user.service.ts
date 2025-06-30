import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginationQueryDto,
  PaginatedUserResponseDto,
  PaginationMetaDto,
} from './dto/pagination.dto';
import * as bcrypt from 'bcrypt';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  created_at: Date;
  updated_at: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedUserResponseDto> {
    const { page = 1, limit = 10 } = paginationQuery || {};
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const countResult = await this.databaseService.executeQuery<{
      total: number;
    }>(countQuery);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT id, username, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const users = await this.databaseService.executeQuery<UserWithoutPassword>(
      dataQuery,
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    const pagination: PaginationMetaDto = {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };

    return {
      data: users,
      pagination,
    };
  }

  async findById(id: number): Promise<UserWithoutPassword> {
    const query = `
      SELECT id, username, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `;

    const users = await this.databaseService.executeQuery<UserWithoutPassword>(
      query,
      [id],
    );

    if (users.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return users[0];
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const { username, password, role } = createUserDto;

    // Check if username already exists
    const existingUserQuery = 'SELECT id FROM users WHERE username = ?';
    const existingUsers = await this.databaseService.executeQuery(
      existingUserQuery,
      [username],
    );

    if (existingUsers.length > 0) {
      throw new ConflictException('Username already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (username, password, role, created_at, updated_at) 
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const result = await this.databaseService.executeInsert(insertQuery, [
      username,
      hashedPassword,
      role,
    ]);

    // Return the created user without password
    return this.findById(result.insertId);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    // Check if user exists
    await this.findById(id);

    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    if (updateUserDto.username) {
      // Check if new username already exists (excluding current user)
      const existingUserQuery =
        'SELECT id FROM users WHERE username = ? AND id != ?';
      const existingUsers = await this.databaseService.executeQuery(
        existingUserQuery,
        [updateUserDto.username, id],
      );

      if (existingUsers.length > 0) {
        throw new ConflictException('Username already exists');
      }

      updateFields.push('username = ?');
      updateValues.push(updateUserDto.username);
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateUserDto.role) {
      updateFields.push('role = ?');
      updateValues.push(updateUserDto.role);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await this.databaseService.executeUpdate(updateQuery, updateValues);

    return this.findById(id);
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    // Prevent self-deletion
    if (id === currentUserId) {
      throw new ConflictException('Cannot delete your own account');
    }

    // Check if user exists
    await this.findById(id);

    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    const result = await this.databaseService.executeDelete(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
