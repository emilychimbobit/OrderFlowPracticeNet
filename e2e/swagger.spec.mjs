import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = resolve(__dirname, 'screenshots');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log('PASS:', msg);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();

  const uiResp = await page.goto(`${BASE}/swagger/index.html`, { waitUntil: 'networkidle' });
  assert(uiResp?.status() === 200, `GET /swagger/index.html -> 200 (got ${uiResp?.status()})`);

  const title = await page.title();
  assert(/swagger/i.test(title), `<title> contiene "Swagger" (got "${title}")`);

  await page.waitForSelector('.info .title', { timeout: 10000 });
  const heading = (await page.textContent('.info .title'))?.trim() ?? '';
  assert(heading.startsWith('OrderFlow API'), `heading == "OrderFlow API" (got "${heading}")`);

  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const shotPath = resolve(SCREENSHOT_DIR, 'swagger-ui.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('SHOT:', shotPath);

  const jsonResp = await page.request.get(`${BASE}/swagger/v1/swagger.json`);
  assert(jsonResp.status() === 200, `GET /swagger/v1/swagger.json -> 200 (got ${jsonResp.status()})`);
  const doc = await jsonResp.json();
  assert(doc?.info?.title === 'OrderFlow API', `info.title == "OrderFlow API" (got "${doc?.info?.title}")`);
  assert(doc?.info?.version === 'v1', `info.version == "v1" (got "${doc?.info?.version}")`);

  const paths = Object.keys(doc?.paths ?? {});
  for (const p of ['/health', '/orders', '/orders/{id}/priority', '/orders/{id}/cancel']) {
    assert(paths.includes(p), `paths incluye ${p}`);
  }

  console.log('\nAll Swagger checks passed.');
} finally {
  await browser.close();
}
