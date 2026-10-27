import { Router, Request, Response, NextFunction } from 'express';
import { dbPool } from '../config/database';
import { successResponse } from '../utils/api-response';

export const settingsRouter = Router();

/**
 * GET /api/v1/settings/public
 * Headless Public Endpoint: Returns cached branding assets, hero banner, hotel gallery, and contact information
 * Consumed by both Next.js Web and Flutter Mobile clients
 */
settingsRouter.get('/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dbPool.query('SELECT key, value FROM public.site_settings');
    const settings: Record<string, any> = {};

    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    // Set edge-friendly cache headers
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    res.json(successResponse(settings));
  } catch (err) {
    next(err);
  }
});
