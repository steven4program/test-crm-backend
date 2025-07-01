import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { User, UserWithPassword } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: jest.Mocked<DatabaseService>;
  let jwtService: jest.Mocked<JwtService>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            executeQuery: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get(DatabaseService);
    jwtService = module.get(JwtService);

    // Spy on logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'testpassword',
    };

    const mockUser: User = {
      id: 1,
      username: 'testuser',
      role: 'admin',
    };

    it('should return access token and user info when login is successful', async () => {
      const expectedToken = 'jwt-token';

      // Mock validateUser to return user
      const validateUserSpy = jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: expectedToken,
        user: mockUser,
      });

      expect(validateUserSpy).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );

      expect(jwtService['sign']).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        `User ${mockUser.username} logged in successfully`,
      );
    });

    it('should throw UnauthorizedException when validateUser returns null', async () => {
      const validateUserSpy = jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(validateUserSpy).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(jwtService['sign']).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    const username = 'testuser';
    const password = 'testpassword';
    const hashedPassword = 'hashed-password';

    const mockUserWithPassword: UserWithPassword = {
      id: 1,
      username: 'testuser',
      password: hashedPassword,
      role: 'admin',
    };

    it('should return user when credentials are valid', async () => {
      databaseService['executeQuery'].mockResolvedValue([mockUserWithPassword]);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(username, password);

      expect(result).toEqual({
        id: mockUserWithPassword.id,
        username: mockUserWithPassword.username,
        role: mockUserWithPassword.role,
      });

      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username],
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
    });

    it('should return null when user is not found', async () => {
      databaseService['executeQuery'].mockResolvedValue([]);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username],
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      databaseService['executeQuery'].mockResolvedValue([mockUserWithPassword]);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username],
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
    });

    it('should return null and log error when database query fails', async () => {
      const error = new Error('Database error');
      databaseService['executeQuery'].mockRejectedValue(error);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username],
      );
    });
  });

  describe('validateUserById', () => {
    const userId = 1;
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      role: 'viewer',
    };

    it('should return user when user exists', async () => {
      databaseService.executeQuery.mockResolvedValue([mockUser]);

      const result = await service.validateUserById(userId);

      expect(result).toEqual(mockUser);
      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId],
      );
    });

    it('should return null when user does not exist', async () => {
      databaseService.executeQuery.mockResolvedValue([]);

      const result = await service.validateUserById(userId);

      expect(result).toBeNull();
      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId],
      );
    });

    it('should return null and log error when database query fails', async () => {
      const error = new Error('Database error');
      databaseService.executeQuery.mockRejectedValue(error);

      const result = await service.validateUserById(userId);

      expect(result).toBeNull();
      expect(databaseService['executeQuery']).toHaveBeenCalledWith(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId],
      );
    });
  });

  describe('getProfile', () => {
    const userId = 1;
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      role: 'viewer',
    };

    it('should return user profile when user exists', async () => {
      jest.spyOn(service, 'validateUserById').mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result).toEqual(mockUser);
      expect(service['validateUserById']).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(service, 'validateUserById').mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getProfile(userId)).rejects.toThrow(
        'User not found',
      );

      expect(service['validateUserById']).toHaveBeenCalledWith(userId);
    });
  });
});
