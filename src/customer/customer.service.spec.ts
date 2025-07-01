import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: DatabaseService,
          useValue: {
            executeQuery: jest.fn(),
            executeInsert: jest.fn(),
            executeUpdate: jest.fn(),
            executeDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    databaseService = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const mockCustomers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        company: 'Acme Corp',
        address: '123 Main St',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '098-765-4321',
        company: 'Tech Inc',
        address: '456 Oak Ave',
        created_at: new Date('2023-01-02'),
        updated_at: new Date('2023-01-02'),
      },
    ];

    it('should return paginated customers with default pagination', async () => {
      // Mock the count query
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce(mockCustomers);

      const result = await service.findAll();

      // Verify count query
      expect(databaseService['executeQuery']).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(*) as total FROM customers',
      );

      // Verify data query with default pagination
      expect(databaseService['executeQuery']).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          'SELECT id, name, email, phone, company, address, created_at, updated_at',
        ),
      );
      expect(databaseService['executeQuery']).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('LIMIT 10 OFFSET 0'),
      );

      // Verify response structure
      expect(result).toEqual({
        data: mockCustomers,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should return paginated customers with custom pagination', async () => {
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 25 }])
        .mockResolvedValueOnce([mockCustomers[0]]);

      const result = await service.findAll({ page: 2, limit: 5 });

      // Verify count query
      expect(databaseService['executeQuery']).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(*) as total FROM customers',
      );

      // Verify data query with custom pagination
      expect(databaseService['executeQuery']).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('LIMIT 5 OFFSET 5'),
      );

      // Verify response structure with pagination calculations
      expect(result).toEqual({
        data: [mockCustomers[0]],
        pagination: {
          total: 25,
          page: 2,
          limit: 5,
          totalPages: 5,
          hasNext: true,
          hasPrev: true,
        },
      });
    });

    it('should handle empty customer list', async () => {
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      const result = await service.findAll();

      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should handle first page correctly', async () => {
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 100 }])
        .mockResolvedValueOnce(mockCustomers);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.pagination).toEqual({
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should handle last page correctly', async () => {
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 95 }])
        .mockResolvedValueOnce(mockCustomers);

      const result = await service.findAll({ page: 10, limit: 10 });

      expect(result.pagination).toEqual({
        total: 95,
        page: 10,
        limit: 10,
        totalPages: 10,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should handle partial pagination parameters', async () => {
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 20 }])
        .mockResolvedValueOnce(mockCustomers);

      // Test with only page specified
      const result1 = await service.findAll({ page: 2 });
      expect(result1.pagination.page).toBe(2);
      expect(result1.pagination.limit).toBe(10);

      jest.clearAllMocks();
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 20 }])
        .mockResolvedValueOnce(mockCustomers);

      // Test with only limit specified
      const result2 = await service.findAll({ limit: 5 });
      expect(result2.pagination.page).toBe(1);
      expect(result2.pagination.limit).toBe(5);
    });

    it('should order results by created_at DESC', async () => {
      databaseService.executeQuery
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce(mockCustomers);

      await service.findAll();

      expect(databaseService['executeQuery']).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('ORDER BY created_at DESC'),
      );
    });
  });
});
