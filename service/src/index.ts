import { serve } from '@hono/node-server';
import { app } from './app.js';
import { getDb } from './db.js';

const port = Number(process.env.PORT || 3847);

getDb();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`mls-site-meta listening on :${info.port}`);
});
