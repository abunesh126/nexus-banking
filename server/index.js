const crypto = require('crypto');
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
const auditRoutes = require('./routes/audit');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const ledgerJob = require('./services/ledgerJob');
const killSwitch = require('./middleware/killSwitch');

const app = express();

// 1. Trust Proxy (Crucial for correct IP detection behind Netlify/Nginx)
// - [x] **Phase 6: Transaction Security (HMAC Signing)**
//     - [x] Implement Atomic Balance-Shift SQL Function (FOR UPDATE)
//     - [x] Implement Transaction State Machine (INITIATED -> LOGGED)
//     - [x] Implement SHA-256 Payload Canonicalization
//     - [x] Implement Nonce-Based Replay Protection
//     - [x] Implement Transaction Idempotency & Rate Limiting (5/min)
app.set('trust proxy', 1);

// 2. Core Middlewares
app.use(express.json({ limit: '10kb' })); 

// 2.0 PROTOCOL & TLS ENFORCEMENT
app.use((req, res, next) => {
  // In Production (or behind trust proxy), enforce HTTPS
  if (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(cors({
  origin: ['http://localhost:5173'], 
  credentials: true
})); 
app.use(morgan('combined')); 

// 2.1 ADVANCED SIGNED RESPONSE MIDDLEWARE (Anti-Replay + Versioning)
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    const payload = {
      data,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
      sig_version: "v1"
    };

    const signature = crypto.createHmac('sha256', process.env.TRANSACTION_MASTER_SECRET || 'GLOBAL_LEDGER_SALT_001')
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Attach signature in body for anti-tampering
    const signedPayload = { ...payload, signature };
    return originalJson.call(this, signedPayload);
  };
  next();
});

// 2.2 ORIGIN VALIDATION FILTER
const allowedOrigins = ['http://localhost:5173'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    logger.warn('REJECTED_ORIGIN_ATTEMPT', { origin, url: req.originalUrl });
    return res.status(403).json({ error: 'Forbidden origin' });
  }
  next();
});

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
app.use('/api/audit', auditRoutes);
app.use('/api/transactions', killSwitch, transactionRoutes);
app.use('/api/admin', adminRoutes);

// Health & Status
app.get('/api/system/status', async (req, res) => {
  const { data: config } = await require('./lib/supabaseAdmin').supabaseAdmin
    .from('system_config')
    .select('value')
    .eq('key', 'system_lock')
    .single();

  res.status(200).json({
    status: config?.value?.active ? 'LOCKED' : 'SAFE',
    reason: config?.value?.reason || null,
    timestamp: new Date().toISOString()
  });
});

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
  
  // Start Shadow Ledger Surveillance
  ledgerJob.start();
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { message: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

module.exports = app;
