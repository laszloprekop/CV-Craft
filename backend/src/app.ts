/**
 * Express Application Setup
 * 
 * Main Express.js application with middleware, routes, and configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initializeDatabase, getDatabase } from './database/connection';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export interface AppConfig {
  port?: number;
  dbPath?: string;
  corsOrigin?: string | string[];
  logLevel?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
}

export class CVCraftApp {
  private app: express.Application;
  private config: AppConfig;
  private server: any;

  constructor(config: AppConfig = {}) {
    this.app = express();
    this.config = {
      port: config.port || parseInt(process.env.PORT || '3001'),
      dbPath: config.dbPath || process.env.DATABASE_PATH,
      corsOrigin: config.corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:3000',
      logLevel: config.logLevel || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
    };
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<express.Application> {
    // Initialize database first
    await initializeDatabase(this.config.dbPath);

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup error handling
    this.setupErrorHandling();

    return this.app;
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false, // Allow file downloads
      crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be loaded from frontend
    }));

    // Rate limiting - prevent abuse
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit requests per IP
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
    this.app.use('/api/', limiter);

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Request logging
    this.app.use(morgan(this.config.logLevel!));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' })); // Support large CV content
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving for assets
    this.app.use('/assets', express.static('./storage/assets', {
      maxAge: '1y', // Cache assets for 1 year
      etag: true,
      lastModified: true
    }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const db = getDatabase();
      const { DatabaseManager } = require('./database/connection');
      const dbHealth = DatabaseManager.getInstance().healthCheck();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: dbHealth,
        uptime: process.uptime()
      });
    });

    // API info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'CV Craft API',
        description: 'Backend API for CV generation webapp',
        version: process.env.npm_package_version || '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
          docs: '/api/docs' // TODO: Add OpenAPI docs
        }
      });
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const apiRouter = express.Router();

    // Import implemented routes
    const cvRoutes = require('./api/routes/cvs').default;
    const templateRoutes = require('./api/routes/templates').default;
    const assetRoutes = require('./api/routes/assets').default;
    // TODO: Add additional route imports as they are implemented
    // import exportRoutes from './api/routes/exports';

    // Mount route handlers
    apiRouter.use('/cvs', cvRoutes);
    apiRouter.use('/templates', templateRoutes);
    apiRouter.use('/assets', assetRoutes);
    // TODO: Mount additional routes as they are implemented
    // apiRouter.use('/exports', exportRoutes);

    // Mount API router
    this.app.use('/api', apiRouter);

    // Database stats endpoint (development only)
    if (process.env.NODE_ENV !== 'production') {
      this.app.get('/debug/db-stats', (req, res) => {
        try {
          const { DatabaseManager } = require('./database/connection');
          const stats = DatabaseManager.getInstance().getStats();
          res.json(stats);
        } catch (error) {
          res.status(500).json({
            error: 'DATABASE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    }
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server with proper port handling
   */
  async start(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.port)
        .on('listening', () => {
          const address = server.address();
          const port = typeof address === 'object' && address ? address.port : this.config.port;
          
          console.log(`🚀 CV Craft API server started on port ${port}`);
          console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
          console.log(`🔗 CORS Origin: ${this.config.corsOrigin}`);
          console.log(`📊 Health Check: http://localhost:${port}/health`);
          resolve();
        })
        .on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${this.config.port} is already in use.`);
            console.error(`   Please stop the process using this port and try again.`);
            console.error(`   Run: lsof -ti:${this.config.port} | xargs kill -9`);
            reject(new Error(`Port ${this.config.port} is already in use`));
          } else {
            reject(err);
          }
        });

      // Store server instance for proper cleanup
      this.server = server;
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 CV Craft API server stopped');

          // Close database connection after server stops
          const { closeDatabase } = require('./database/connection');
          closeDatabase();

          resolve();
        });
      } else {
        // Close database even if no server running
        const { closeDatabase } = require('./database/connection');
        closeDatabase();
        resolve();
      }
    });
  }
}

/**
 * Create and configure the Express application
 */
export async function createApp(config?: AppConfig): Promise<express.Application> {
  const app = new CVCraftApp(config);
  return app.initialize();
}

/**
 * Start the server (for direct execution)
 */
if (require.main === module) {
  const app = new CVCraftApp();
  
  app.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await app.stop();
    process.exit(0);
  });
}