import { POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth.service';
import { readJson } from '@/test-utils/read-json';
import { mockNextRequest } from '@/test-utils/mock-request';

// Mock auth service
jest.mock('@/lib/auth/auth.service', () => ({
  authService: {
    validateApiKey: jest.fn(),
    trackApiUsage: jest.fn(),
  },
}));

// Mock queue service
jest.mock('@/lib/services/queue/queue.service', () => ({
  queueService: {
    addTranslationJob: jest.fn().mockResolvedValue('test-job-id'),
  },
}));

// Mock api-key functions
jest.mock('@/lib/auth/api-key', () => ({
  validateApiKey: jest.fn(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
  trackApiRequest: jest.fn().mockResolvedValue(undefined),
}));

// Import mocked functions
import { validateApiKey } from '@/lib/auth/api-key';

describe('/api/translate-async', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request without API key', async () => {
    const formData = new FormData();
    formData.append('targetLanguage', 'vi');
    formData.append('tier', 'basic');

    const request = mockNextRequest({
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await readJson(response);

    expect(response.status).toBe(401);
    expect(data.error).toBe('API key required. Get your key at https://prismy.in/dashboard');
  });

  it('should reject request with invalid API key', async () => {
    (validateApiKey as jest.Mock).mockResolvedValue({
      valid: false,
      error: 'Invalid API key. Get your key at https://prismy.in/dashboard'
    });

    const formData = new FormData();
    formData.append('targetLanguage', 'vi');
    formData.append('tier', 'basic');

    const request = mockNextRequest({
      method: 'POST',
      headers: {
        'x-api-key': 'invalid-key',
      },
      body: formData,
    });

    const response = await POST(request);
    const data = await readJson(response);

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid API key. Get your key at https://prismy.in/dashboard');
  });

  it('should reject request without file', async () => {
    (validateApiKey as jest.Mock).mockResolvedValue({
      valid: true,
      key: { id: 'test-key-id' },
      user: { id: 'test-user' },
      tier: 'basic',
      rateLimit: 100
    });

    const formData = new FormData();
    formData.append('targetLanguage', 'vi');
    formData.append('tier', 'basic');
    // No file appended

    const request = mockNextRequest({
      method: 'POST',
      headers: {
        'x-api-key': 'valid-key',
      },
      body: formData,
    });

    const response = await POST(request);
    const data = await readJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
  });

  it('should accept valid translation request', async () => {
    (validateApiKey as jest.Mock).mockResolvedValue({
      valid: true,
      key: { id: 'test-key-id' },
      user: { id: 'test-user' },
      tier: 'basic',
      rateLimit: 100
    });

    const formData = new FormData();
    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    formData.append('targetLanguage', 'vi');
    formData.append('tier', 'basic');

    const request = mockNextRequest({
      method: 'POST',
      headers: {
        'x-api-key': 'valid-key',
      },
      body: formData,
    });

    const response = await POST(request);
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      jobId: 'test-job-id',
      message: 'Translation job queued successfully',
      estimatedTime: '30s',
      tier: 'basic',
    });
  });

  it('should validate tier values', async () => {
    (validateApiKey as jest.Mock).mockResolvedValue({
      valid: true,
      key: { id: 'test-key-id' },
      user: { id: 'test-user' },
      tier: 'basic',
      rateLimit: 100
    });

    const formData = new FormData();
    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    formData.append('targetLanguage', 'vi');
    formData.append('tier', 'invalid-tier');

    const request = mockNextRequest({
      method: 'POST',
      headers: {
        'x-api-key': 'valid-key',
      },
      body: formData,
    });

    const response = await POST(request);
    const data = await readJson(response);

    // Route auto-corrects invalid tier to 'basic' instead of error
    expect(response.status).toBe(200);
    expect(data.tier).toBe('basic');
    expect(data.message).toBe('Translation job queued successfully');
  });

  it('should reject premium tier for free users', async () => {
    (validateApiKey as jest.Mock).mockResolvedValue({
      valid: true,
      key: { id: 'test-key-id' },
      user: { id: 'test-user' },
      tier: 'free', // Free tier user
      rateLimit: 100
    });

    const formData = new FormData();
    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    formData.append('targetLanguage', 'vi');
    formData.append('tier', 'premium'); // Trying to use premium

    const request = mockNextRequest({
      method: 'POST',
      headers: {
        'x-api-key': 'valid-key',
      },
      body: formData,
    });

    const response = await POST(request);
    const data = await readJson(response);

    expect(response.status).toBe(403);
    expect(data.error).toBe('Upgrade to Pro plan for premium features');
  });
});