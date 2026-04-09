const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const env = require('./config/env');
const logger = require('./utils/logger');
const securityHeaders = require('./middleware/securityHeaders');
const { generalLimiter } = require('./middleware/rateLimiter');
const { anomalyMiddleware } = require('./middleware/anomaly');
const healthRoutes = require('./routes/health');
const cryptoRoutes = require('./routes/crypto');
const cardRoutes = require('./routes/cards');
const authRoutes = require('./routes/auth');

const app = express();

// 1. Trust Proxy (Crucial for correct IP detection behind Netlify/Nginx)
app.set('trust proxy', 1);

// 2. Core Middlewares
app.use(express.json({ limit: '10kb' })); 
app.use(cors({
  origin: ['http://localhost:5173'], // Restrict to trusted frontend
  credentials: true
})); 
app.use(morgan('combined')); 

// 2. Attach Request ID
app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

// 3. Security Middlewares
app.use(securityHeaders);
app.use(anomalyMiddleware);

// 4. Rate Limiting
app.use('/api', generalLimiter);

// 5. Routes
app.use('/api/health', healthRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/auth', authRoutes);

// 6. Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log the error
  logger.error('Unhandled Exception', {
    requestId: req.requestId,
    message: err.message,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  res.status(statusCode).json({
    error: true,
    message: 'Internal Server Error'
  });
});

// 8. Start Server
const server = app.listen(env.port, () => {
  logger.info(`NexusBank Security Brain is active on port ${env.port}`, {
    mode: env.nodeEnv,
    url: `http://localhost:${env.port}`
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { message: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

module.exports = app;
