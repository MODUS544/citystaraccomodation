"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const api_response_1 = require("../utils/api-response");
exports.settingsRouter = (0, express_1.Router)();
/**
 * GET /api/v1/settings/public
 * Headless Public Endpoint: Returns cached branding assets, hero banner, hotel gallery, and contact information
 * Consumed by both Next.js Web and Flutter Mobile clients
 */
exports.settingsRouter.get('/public', async (_req, res, next) => {
    try {
        const result = await database_1.dbPool.query('SELECT key, value FROM public.site_settings');
        const settings = {};
        for (const row of result.rows) {
            settings[row.key] = row.value;
        }
        // Set edge-friendly cache headers
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
        res.json((0, api_response_1.successResponse)(settings));
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=settings.routes.js.map