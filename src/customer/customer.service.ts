import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  PaginationQueryDto,
  PaginatedCustomerResponseDto,
  PaginationMetaDto,
} from './dto/pagination.dto';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class CustomerService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedCustomerResponseDto> {
    const { page = 1, limit = 10 } = paginationQuery || {};
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM customers';
    const countResult = await this.databaseService.executeQuery<{
      total: number;
    }>(countQuery);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT id, name, email, phone, company, address, created_at, updated_at 
      FROM customers 
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const customers =
      await this.databaseService.executeQuery<Customer>(dataQuery);

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
      data: customers,
      pagination,
    };
  }

  async findById(id: number): Promise<Customer> {
    const query = `
      SELECT id, name, email, phone, company, address, created_at, updated_at 
      FROM customers 
      WHERE id = ?
    `;

    const customers = await this.databaseService.executeQuery<Customer>(query, [
      id,
    ]);

    if (customers.length === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customers[0];
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const { name, email, phone, company, address } = createCustomerDto;

    const insertQuery = `
      INSERT INTO customers (name, email, phone, company, address, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await this.databaseService.executeInsert(insertQuery, [
      name,
      email,
      phone,
      company || null,
      address || null,
    ]);

    return this.findById(result.insertId);
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    // Check if customer exists
    await this.findById(id);

    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    if (updateCustomerDto.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updateCustomerDto.name);
    }

    if (updateCustomerDto.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(updateCustomerDto.email);
    }

    if (updateCustomerDto.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(updateCustomerDto.phone);
    }

    if (updateCustomerDto.company !== undefined) {
      updateFields.push('company = ?');
      updateValues.push(updateCustomerDto.company || null);
    }

    if (updateCustomerDto.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(updateCustomerDto.address || null);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`;

    await this.databaseService.executeUpdate(updateQuery, updateValues);

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    // Check if customer exists
    await this.findById(id);

    const deleteQuery = 'DELETE FROM customers WHERE id = ?';
    const result = await this.databaseService.executeDelete(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
  }
}
