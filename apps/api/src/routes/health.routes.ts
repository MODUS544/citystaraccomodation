import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { successResponse, errorResponse } from '../utils/api-response';
import { env } from '../config/env';

export const healthRouter = Router();

const startTime = Date.now();

/**
 * GET /health and GET /api/v1/health
 * Production health probe for Render web service checks & uptime monitors
 */
healthRouter.get('/', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const uptimeSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

  const payload = {
    status: dbHealth.status === 'connected' ? 'healthy' : 'degraded',
    service: 'citystar-api',
    version: '1.0.0',
    targetHost: 'citystaraccomodation.onrender.com',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: parseFloat(uptimeSeconds),
    database: dbHealth,
  };

  // If database connection pool is broken, return HTTP 503 to signal orchestrator
  if (dbHealth.status !== 'connected') {
    res.status(503).json(
      errorResponse(
        'SERVICE_DEGRADED',
        'Database connection pool probe failed',
        payload
      )
    );
    return;
  }

  res.status(200).json(successResponse(payload));
});
