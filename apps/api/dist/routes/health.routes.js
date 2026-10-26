"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const api_response_1 = require("../utils/api-response");
const env_1 = require("../config/env");
exports.healthRouter = (0, express_1.Router)();
const startTime = Date.now();
/**
 * GET /health and GET /api/v1/health
 * Production health probe for Render web service checks & uptime monitors
 */
exports.healthRouter.get('/', async (_req, res) => {
    const dbHealth = await (0, database_1.checkDatabaseHealth)();
    const uptimeSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    const payload = {
        status: dbHealth.status === 'connected' ? 'healthy' : 'degraded',
        service: 'citystar-api',
        version: '1.0.0',
        targetHost: 'citystaraccomodation.onrender.com',
        environment: env_1.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptimeSeconds: parseFloat(uptimeSeconds),
        database: dbHealth,
    };
    // If database connection pool is broken, return HTTP 503 to signal orchestrator
    if (dbHealth.status !== 'connected') {
        res.status(503).json((0, api_response_1.errorResponse)('SERVICE_DEGRADED', 'Database connection pool probe failed', payload));
        return;
    }
    res.status(200).json((0, api_response_1.successResponse)(payload));
});
//# sourceMappingURL=health.routes.js.map