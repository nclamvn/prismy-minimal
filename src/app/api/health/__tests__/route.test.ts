import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('/api/health', () => {
  it('should return 200 with health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      status: 'healthy',
      service: 'PRISMY Translation API',
      timestamp: expect.any(String),
    });
  });

  it('should include timestamp in ISO format', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });
});