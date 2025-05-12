import request from 'supertest';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { handleUserRoutes } from '../routes/users';

describe('Users API', () => {
  let server: Server;
  let userId: string;

  beforeAll(() => {
    server = createServer(async (req, res) => {
      const handled = await handleUserRoutes(req, res);
      if (!handled) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Route not found' }));
      }
    });
  });

  afterAll(() => {
    server.close();
  });

  describe('Scenario 1: Basic CRUD Operations', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(server).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should create a new user', async () => {
      const userData = {
        username: 'John Doe',
        age: 30,
        hobbies: ['reading', 'gaming'],
      };

      const response = await request(server).post('/api/users').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        ...userData,
        id: expect.any(String),
      });
      userId = response.body.id;
    });

    it('should get user by id', async () => {
      const response = await request(server).get(`/api/users/${userId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
    });
  });

  describe('Scenario 2: Update and Delete Operations', () => {
    it('should update user', async () => {
      const updatedData = {
        username: 'John Updated',
        age: 31,
        hobbies: ['reading', 'gaming', 'coding'],
      };

      const response = await request(server)
        .put(`/api/users/${userId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...updatedData,
        id: userId,
      });
    });

    it('should delete user', async () => {
      const response = await request(server).delete(`/api/users/${userId}`);
      expect(response.status).toBe(204);
    });

    it('should return 404 when getting deleted user', async () => {
      const response = await request(server).get(`/api/users/${userId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('Scenario 3: Error Handling', () => {
    it('should return 400 for invalid user data', async () => {
      const invalidData = {
        username: 'John',
        age: 'not-a-number',
        hobbies: ['reading'],
      };

      const response = await request(server)
        .post('/api/users')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(server).get('/api/users/invalid-uuid');
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(server).get(
        '/api/users/00000000-0000-0000-0000-000000000000',
      );
      expect(response.status).toBe(404);
    });
  });
});
