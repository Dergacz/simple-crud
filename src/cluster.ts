import cluster from 'node:cluster';
import { cpus } from 'node:os';
import {
  createServer,
  IncomingMessage,
  ServerResponse,
  RequestOptions,
  request,
} from 'node:http';
import { config } from 'dotenv';
import { handleUserRoutes } from './routes/users';

config();

const numCPUs = cpus().length - 1;
const BASE_PORT = parseInt(process.env.PORT || '4000', 10);

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  console.log(`Load balancer listening on port ${BASE_PORT}`);

  for (let i = 0; i < numCPUs; i++) {
    const workerPort = BASE_PORT + i + 1;
    cluster.fork({ WORKER_PORT: workerPort });
  }

  const loadBalancer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const workerPorts = Array.from(
        { length: numCPUs },
        (_, i) => BASE_PORT + i + 1,
      );
      const targetPort =
        workerPorts[Math.floor(Math.random() * workerPorts.length)];

      const options: RequestOptions = {
        hostname: 'localhost',
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };

      const proxyReq = request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      });

      req.pipe(proxyReq);

      proxyReq.on('error', (error: Error) => {
        console.error(`Proxy error: ${error.message}`);
        res.writeHead(500);
        res.end('Proxy error');
      });
    },
  );

  loadBalancer.listen(BASE_PORT);

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    const workerPort = BASE_PORT + parseInt(worker.id.toString(), 10);
    cluster.fork({ WORKER_PORT: workerPort });
  });
} else {
  const workerPort = parseInt(process.env.WORKER_PORT || '4001', 10);

  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const handled = await handleUserRoutes(req, res);

      if (!handled) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Route not found' }));
      }
    },
  );

  server.listen(workerPort, () => {
    console.log(`Worker ${process.pid} started on port ${workerPort}`);
  });
}
