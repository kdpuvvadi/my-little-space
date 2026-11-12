import type { MiddlewareHandler } from 'hono';
import { bumpRequest, bumpResponse, touchClient } from './stats.js';

/** Count /v1/site requests only — not /health or /v1/_stats. */
export const siteMetrics: MiddlewareHandler = async (c, next) => {
  bumpRequest();
  const clientId = c.req.header('x-client-id');
  if (clientId) touchClient(clientId);

  await next();

  const status = c.res.status;
  bumpResponse(status >= 200 && status < 400);
};
