"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const routes_1 = require("./routes");
const health_routes_1 = require("./routes/health.routes");
const request_logger_middleware_1 = require("./middleware/request-logger.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
// 1. Security & Core Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Headless API - disable HTML CSP restrictions
}));
// Cross-Origin Resource Sharing configuration
const allowedOrigins = env_1.env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Body Parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request Performance Logging
app.use(request_logger_middleware_1.requestLogger);
// 2. High-Priority Health Check Routes
// Root health check endpoint matching Render deployment path: https://citystaraccomodation.onrender.com/health
app.use('/health', health_routes_1.healthRouter);
// Root path friendly redirect or status ping
app.get('/', (_req, res) => {
    res.redirect('/health');
});
// 3. API Version 1 Routes
app.use(env_1.env.API_PREFIX || '/api/v1', routes_1.apiRouter);
// 4. Catch-All & Global Error Handling
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
// 5. Server Lifecycle & Graceful Shutdown
const port = env_1.env.PORT;
const server = app.listen(port, () => {
    console.log(`=======================================================`);
    console.log(` CITY STAR HOTEL - API SERVER STARTED`);
    console.log(` Environment : ${env_1.env.NODE_ENV}`);
    console.log(` Port        : ${port}`);
    console.log(` Health Probe: http://localhost:${port}/health`);
    console.log(` API Base    : http://localhost:${port}${env_1.env.API_PREFIX}`);
    console.log(` Render Host : https://citystaraccomodation.onrender.com`);
    console.log(` Supabase DB : ${env_1.env.SUPABASE_URL}`);
    console.log(`=======================================================`);
});
// Handle graceful termination for zero-downtime rolling deploys on Render
const handleGracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Initiating graceful shutdown sequence...`);
    server.close(async () => {
        console.log('HTTP server closed. Ceased accepting new incoming connections.');
        try {
            await (0, database_1.closeDatabasePool)();
            console.log('All background resources successfully released. Exiting.');
            process.exit(0);
        }
        catch (err) {
            console.error('Error during cleanup:', err);
            process.exit(1);
        }
    });
    // Force exit if connections do not drain within 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown due to timeout waiting for active connections to close.');
        process.exit(1);
    }, 10000).unref();
};
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
exports.default = app;
//# sourceMappingURL=index.js.map