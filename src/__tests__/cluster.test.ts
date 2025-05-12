import request from 'supertest';
import { createServer, Server } from 'node:http';
import { handleUserRoutes } from '../routes/users';
import { cpus } from 'node:os';

describe('Cluster Load Balancing', () => {
  const numCPUs = cpus().length - 1;
  const BASE_PORT = 4000;
  const servers: Server[] = [];
  let userId: string;

  beforeAll(() => {
    for (let i = 0; i < numCPUs; i++) {
      const server = createServer(async (req, res) => {
        const handled = await handleUserRoutes(req, res);
        if (!handled) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Route not found' }));
        }
      });
      server.listen(BASE_PORT + i + 1);
      servers.push(server);
    }
  });

  afterAll(() => {
    servers.forEach((server: Server) => server.close());
  });

  it('should maintain data consistency across workers', async () => {
    const userData = {
      username: 'Test User',
      age: 25,
      hobbies: ['testing'],
    };

    const createResponse = await request(`http://localhost:${BASE_PORT + 1}`)
      .post('/api/users')
      .send(userData);

    expect(createResponse.status).toBe(201);
    userId = createResponse.body.id;

    const getResponse = await request(`http://localhost:${BASE_PORT + 2}`).get(
      `/api/users/${userId}`,
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(userId);

    const updateData = {
      username: 'Updated User',
      age: 26,
      hobbies: ['testing', 'updating'],
    };

    const updateResponse = await request(`http://localhost:${BASE_PORT + 3}`)
      .put(`/api/users/${userId}`)
      .send(updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject(updateData);

    const deleteResponse = await request(
      `http://localhost:${BASE_PORT + 1}`,
    ).delete(`/api/users/${userId}`);

    expect(deleteResponse.status).toBe(204);

    const verifyDeleteResponse = await request(
      `http://localhost:${BASE_PORT + 2}`,
    ).get(`/api/users/${userId}`);

    expect(verifyDeleteResponse.status).toBe(404);
  });
});
