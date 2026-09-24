import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import caregiverRoutes from './routes/caregiverRoutes.js';
import elderlyRoutes from './routes/elderlyRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';

const app = express();

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing with safe size limit (prevents payload flood attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global rate limiting
app.use(apiRateLimiter);

// Lightweight request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} [${duration}ms]`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// Health and Readiness endpoints (mounted at root for monitoring services)
app.use('/', healthRoutes);

// Authentication Routes
app.use('/api/v1/auth', authRoutes);

// Caregiver & Elderly Relationship Routes
app.use('/api/v1/caregivers', caregiverRoutes);
app.use('/api/v1/elderly', elderlyRoutes);

// Medication Management Routes
app.use('/api/v1/medications', medicationRoutes);

// Base API route placeholder
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Elderly Medicine Reminder API v1',
    version: '1.0.0'
  });
});

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
