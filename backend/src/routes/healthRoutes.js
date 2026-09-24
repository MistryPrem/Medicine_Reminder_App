import { Router } from 'express';
import { checkDatabaseHealth } from '../config/database.js';

const router = Router();

/**
 * Liveness probe: Returns 200 if the Node.js process is alive
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Readiness probe: Returns 200 if both Node.js and MongoDB are connected
 */
router.get('/ready', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  const isReady = dbHealth.status === 'up';

  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    success: isReady,
    message: isReady ? 'API is ready to accept traffic' : 'Database connection not ready',
    timestamp: new Date().toISOString(),
    database: dbHealth
  });
});

export default router;
