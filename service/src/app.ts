import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleSiteLookup } from './siteRoute.js';

export const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ ok: true }));

app.get('/v1/site', (c) => handleSiteLookup(c));
app.get('/v1/site/:host{.+}', (c) => handleSiteLookup(c));
