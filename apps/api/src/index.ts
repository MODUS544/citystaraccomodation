import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { closeDatabasePool } from './config/database';
import { apiRouter } from './routes';
import { healthRouter } from './routes/health.routes';
import { requestLogger } from './middleware/request-logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// 1. Security & Core Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Headless API - disable HTML CSP restrictions
}));

// Cross-Origin Resource Sharing configuration
const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Performance Logging
app.use(requestLogger);

// 2. High-Priority Health Check Routes
// Root health check endpoint matching Render deployment path: https://citystaraccomodation.onrender.com/health
app.use('/health', healthRouter);

// Root path friendly redirect or status ping
app.get('/', (_req, res) => {
  res.redirect('/health');
});

// 3. API Version 1 Routes
app.use(env.API_PREFIX, apiRouter);

// 4. Catch-All & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 5. Server Lifecycle & Graceful Shutdown
const port = env.PORT;
const server = app.listen(port, () => {
  console.log(`=======================================================`);
  console.log(` CITY STAR HOTEL - API SERVER STARTED`);
  console.log(` Environment : ${env.NODE_ENV}`);
  console.log(` Port        : ${port}`);
  console.log(` Health Probe: http://localhost:${port}/health`);
  console.log(` API Base    : http://localhost:${port}${env.API_PREFIX}`);
  console.log(` Render Host : https://citystaraccomodation.onrender.com`);
  console.log(` Supabase DB : ${env.SUPABASE_URL}`);
  console.log(`=======================================================`);
});

// Handle graceful termination for zero-downtime rolling deploys on Render
const handleGracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown sequence...`);

  server.close(async () => {
    console.log('HTTP server closed. Ceased accepting new incoming connections.');
    try {
      await closeDatabasePool();
      console.log('All background resources successfully released. Exiting.');
      process.exit(0);
    } catch (err) {
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

export default app;
