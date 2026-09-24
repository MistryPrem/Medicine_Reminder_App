import request from 'supertest';
import app from '../src/app.js';

describe('Backend Foundation Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 OK with healthy status payload', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'API is healthy');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness structure', async () => {
      const res = await request(app).get('/ready');
      // When database is not connected during isolated unit tests, ready returns 503 with down status
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('database');
      expect(res.body.database).toHaveProperty('status');
      expect(res.body.database).toHaveProperty('readyState');
    });
  });

  describe('GET /api/v1', () => {
    it('should return API v1 welcome message', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('404 Route Handling', () => {
    it('should return 404 with standardized error envelope for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode', 'NOT_FOUND');
    });
  });
});
