import { IncomingMessage, ServerResponse } from 'node:http';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from '../controllers/users';

export const handleUserRoutes = (
  req: IncomingMessage,
  res: ServerResponse,
): boolean => {
  const { url, method } = req;

  if (url === '/api/users' && method === 'GET') {
    getAllUsers(req, res);
    return true;
  }

  if (url === '/api/users' && method === 'POST') {
    createUser(req, res);
    return true;
  }

  const match = url?.match(/^\/api\/users\/([a-zA-Z0-9-]+)$/);

  if (match && method === 'GET') {
    const userId = match[1];
    getUserById(req, res, userId);
    return true;
  }

  if (match && method === 'PUT') {
    const userId = match[1];
    updateUser(req, res, userId);
    return true;
  }

  if (match && method === 'DELETE') {
    const userId = match[1];
    deleteUser(req, res, userId);
    return true;
  }

  return false;
};
