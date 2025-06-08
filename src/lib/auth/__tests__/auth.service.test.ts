import { authService } from '../auth.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    apiRequest: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should return null for invalid key', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.validateApiKey('invalid-key');
      
      expect(result).toBeNull();
    });

    it('should return null for inactive key', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-id',
        isActive: false,
        user: { id: 'user-id' },
      });

      const result = await authService.validateApiKey('inactive-key');
      
      expect(result).toBeNull();
    });

    it('should return apiKey data for valid key', async () => {
      const mockApiKey = {
        id: 'test-id',
        isActive: true,
        user: { id: 'user-id' },
      };
      
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await authService.validateApiKey('valid-key');
      
      expect(result).toEqual(mockApiKey);
    });

    it('should update lastUsedAt on valid key', async () => {
      const mockApiKey = {
        id: 'test-id',
        isActive: true,
        user: { id: 'user-id' },
      };
      
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      await authService.validateApiKey('valid-key');
      
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await authService.validateApiKey('any-key');
      
      expect(result).toBeNull();
    });
  });

  describe('trackApiUsage', () => {
    it('should create an API request record', async () => {
      await authService.trackApiUsage('api-key-id', 'user-id', {
        endpoint: '/api/translate',
        method: 'POST',
        responseTime: 100,
        statusCode: 200,
      });

      expect(prisma.apiRequest.create).toHaveBeenCalledWith({
        data: {
          apiKeyId: 'api-key-id',
          userId: 'user-id',
          endpoint: '/api/translate',
          method: 'POST',
          responseTime: 100,
          statusCode: 200,
        },
      });
    });

    it('should handle tracking errors gracefully', async () => {
      (prisma.apiRequest.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(authService.trackApiUsage('api-key-id', 'user-id', {
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 50,
        statusCode: 200,
      })).resolves.not.toThrow();
    });
  });

  describe('generateApiKey', () => {
    it('should generate unique API key', () => {
      const key1 = authService.generateApiKey();
      const key2 = authService.generateApiKey();
      
      expect(key1).toMatch(/^sk_(test_|live_)[a-zA-Z0-9]{32}$/);
      expect(key2).toMatch(/^sk_(test_|live_)[a-zA-Z0-9]{32}$/);
      expect(key1).not.toBe(key2);
    });

    it('should generate test keys in non-production', () => {
      const key = authService.generateApiKey();
      
      expect(key).toContain('sk_test_');
    });
  });

  describe('createApiKey', () => {
    it('should create new API key for user', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockApiKey = {
        id: 'key-id',
        key: 'sk_test_12345',
        name: 'Test Key',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await authService.createApiKey('user-id', 'Test Key');
      
      expect(result).toEqual(mockApiKey);
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: {
          key: expect.stringMatching(/^sk_test_/),
          name: 'Test Key',
          userId: 'user-id',
        },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.createApiKey('invalid-user', 'Test Key')
      ).rejects.toThrow('User not found');
    });
  });
});