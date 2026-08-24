import { chromium } from 'playwright';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:3000';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = resolve(__dirname, '../qa-report/screenshots');
await mkdir(SHOT_DIR, { recursive: true });

const results = [];
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();

  // --- Landing page (Swagger index)
  const swaggerResp = await page.goto(`${BASE}/swagger/index.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.info .title', { timeout: 10000 });
  await page.screenshot({ path: resolve(SHOT_DIR, 'swagger-ui.png'), fullPage: true });
  results.push({ name: 'GET /swagger/index.html', status: swaggerResp?.status(), pass: swaggerResp?.status() === 200 });

  // --- Health check
  const healthResp = await page.request.get(`${BASE}/health`);
  results.push({ name: 'GET /health', status: healthResp.status(), pass: healthResp.status() === 200 });

  // --- GET /orders
  const ordersResp = await page.request.get(`${BASE}/orders`);
  results.push({ name: 'GET /orders', status: ordersResp.status(), pass: ordersResp.status() === 200 });

  // --- Swagger JSON
  const jsonResp = await page.request.get(`${BASE}/swagger/v1/swagger.json`);
  const doc = await jsonResp.json();
  const paths = Object.keys(doc?.paths ?? {});
  results.push({ name: 'GET /swagger/v1/swagger.json', status: jsonResp.status(), pass: jsonResp.status() === 200 });
  results.push({ name: 'Swagger paths: /health', status: '-', pass: paths.includes('/health') });
  results.push({ name: 'Swagger paths: /orders', status: '-', pass: paths.includes('/orders') });
  results.push({ name: 'Swagger paths: /orders/{id}/priority', status: '-', pass: paths.includes('/orders/{id}/priority') });
  results.push({ name: 'Swagger paths: /orders/{id}/cancel', status: '-', pass: paths.includes('/orders/{id}/cancel') });
  results.push({ name: 'Swagger title == "OrderFlow API"', status: '-', pass: doc?.info?.title === 'OrderFlow API' });
  results.push({ name: 'Swagger version == "v1"', status: '-', pass: doc?.info?.version === 'v1' });

} finally {
  await browser.close();
}

await writeFile(resolve(__dirname, '../qa-report/e2e-results.json'), JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results));
