import { config } from 'dotenv';
import { createServer } from 'node:http';
import { handleUserRoutes } from './routes/users';

config();

const PORT = process.env.PORT || 4000;

const server = createServer(async (req, res) => {
  const handled = await handleUserRoutes(req, res);

  try {
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: `Route not found: ${req.method} ${req.url}`,
        }),
      );
    }
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: `Internal server error: ${(error as Error).message}`,
      }),
    );
    console.error('Unexpected error:', error);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
