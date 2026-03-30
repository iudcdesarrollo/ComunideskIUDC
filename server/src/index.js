import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import solicitudesRoutes from './routes/solicitudes.js';
import tiposRoutes from './routes/tipos.js';
import urgentesRoutes from './routes/urgentes.js';
import statsRoutes from './routes/stats.js';
import exportarRoutes from './routes/exportar.js';
import radioRoutes from './routes/radio.js';
import usersRoutes from './routes/users.js';
import notificacionesRoutes from './routes/notificaciones.js';
import valleIaRoutes from './routes/valleIa.js';
import pqrsRoutes from './routes/pqrs.js';
import helpmeRoutes from './routes/helpme.js';
import freepikRoutes from './routes/freepik.js';


// Check required env vars at startup
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('[STARTUP ERROR] Missing required env vars:', missing.join(', '));
  process.exit(1);
}
console.log('[STARTUP] All required env vars present ✓');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urgentes', urgentesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/exportar', exportarRoutes);
app.use('/api/radio', radioRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/tipos', tiposRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/valle-ia', valleIaRoutes);
app.use('/api/pqrs', pqrsRoutes);
app.use('/api/helpme', helpmeRoutes);
app.use('/api/freepik', freepikRoutes);



// Error handling middleware for API routes
app.use(errorHandler);

// ─── Serve frontend in production ────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.join(__dirname, '../dist');

app.use(express.static(clientPath));

// SPA fallback — any non-API route serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Start server
const PORT = config.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
