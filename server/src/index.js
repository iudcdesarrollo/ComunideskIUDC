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
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from './middleware/auth.js';
import urgentesRoutes from './routes/urgentes.js';
import statsRoutes from './routes/stats.js';
import exportarRoutes from './routes/exportar.js';
import radioRoutes from './routes/radio.js';
import usersRoutes from './routes/users.js';

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



// 404 catch-all (must be AFTER all routes, BEFORE error handler)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
