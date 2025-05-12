import { users } from '../storage/db';
import { IncomingMessage, ServerResponse } from 'node:http';
import { validate, v4 } from 'uuid';

export const getAllUsers = async (
  _req: IncomingMessage,
  res: ServerResponse,
) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(Array.from(users.values())));
};

export const getUserById = async (
  _req: IncomingMessage,
  res: ServerResponse,
  userId: string,
) => {
  res.setHeader('Content-Type', 'application/json');

  if (!validate(userId)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid user ID' }));
    return;
  }

  const user = users.get(userId);

  if (!user) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify(user));
};

export const createUser = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await new Promise<string>((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
  });

  try {
    const parsed = JSON.parse(body);
    const { username, age, hobbies } = parsed;

    if (
      typeof username !== 'string' ||
      typeof age !== 'number' ||
      !Array.isArray(hobbies) ||
      !hobbies.every((h) => typeof h === 'string')
    ) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid user data in request body' }));
      return;
    }

    const newUser = {
      id: v4(),
      username,
      age,
      hobbies,
    };

    users.set(newUser.id, newUser);

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(newUser));
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Malformed JSON or invalid request' }));
  }
};

export const updateUser = async (
  req: IncomingMessage,
  res: ServerResponse,
  userId: string
) => {
  if (!validate(userId)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid user ID (not UUID)' }));
    return;
  }

  if (!users.has(userId)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  const body = await new Promise<string>((resolve) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
  });

  try {
    const parsed = JSON.parse(body);
    const { username, age, hobbies } = parsed;

    if (
      typeof username !== 'string' ||
      typeof age !== 'number' ||
      !Array.isArray(hobbies) ||
      !hobbies.every(h => typeof h === 'string')
    ) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid user data' }));
      return;
    }

    const updatedUser = {
      id: userId,
      username,
      age,
      hobbies,
    };

    users.set(userId, updatedUser);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(updatedUser));
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Malformed JSON or invalid request' }));
  }
};

export const deleteUser = async (
  _req: IncomingMessage,
  res: ServerResponse,
  userId: string
) => {
  if (!validate(userId)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid user ID (not UUID)' }));
    return;
  }

  if (!users.has(userId)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  users.delete(userId);
  res.statusCode = 204;
  res.end();
};
