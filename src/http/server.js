import { createServer } from 'node:http';
import { InMemoryOrderRepository } from '../repositories/inMemoryOrderRepository.js';
import { OrderService } from '../services/orderService.js';

const service = new OrderService(new InMemoryOrderRepository());

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

export const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { status: 'ok' });
    if (req.method === 'GET' && req.url === '/orders') return json(res, 200, service.list());
    if (req.method === 'POST' && req.url === '/orders') return json(res, 201, service.create(await body(req)));
    const match = req.url?.match(/^\/orders\/([^/]+)\/cancel$/);
    if (req.method === 'POST' && match) return json(res, 200, service.cancel(match[1]));
    return json(res, 404, { error: 'route not found' });
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
});

if (process.argv[1] === new URL(import.meta.url).pathname) {
  server.listen(3000, () => console.log('OrderFlow listening on http://localhost:3000'));
}
