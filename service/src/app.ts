import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { siteMetrics } from './metrics.js';
import { handleSiteLookup } from './siteRoute.js';
import { getStats } from './stats.js';

export const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ ok: true }));

app.get('/v1/_stats', (c) => c.json(getStats()));

app.use('/v1/site', siteMetrics);
app.use('/v1/site/*', siteMetrics);

app.get('/v1/site', (c) => handleSiteLookup(c));
app.get('/v1/site/:host{.+}', (c) => handleSiteLookup(c));
