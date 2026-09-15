import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

// ---- Middleware global ---------------------------------------------------
app.use(cors()); // permite al servidor de desarrollo de Vite (otro origen) llamar a la API
app.use(express.json({ limit: '100kb' })); // solo cuerpos JSON, con tope de tamaño

// Registro simple de peticiones para el desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---- Rutas de la API ------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ---- Producción: servir el frontend de React compilado desde /client/dist --
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Fallback SPA: el router del cliente gestiona los enlaces profundos no-API
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---- 404 para rutas de API desconocidas -----------------------------------
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint de la API no encontrado' });
});

// ---- Manejador de errores central -----------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);

  // ValidationError de Mongoose -> 400 con mensaje legible
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }

  // CastError (ObjectId inválido) -> 400
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Formato de id inválido' });
  }

  // Los conflictos de solapamiento lanzados por el controlador llevan un .status
  const status = typeof err.status === 'number' ? err.status : 500;
  const message = status < 500 ? err.message : 'Error interno del servidor';
  return res.status(status).json({ message });
});

// ---- Arranque del servidor ------------------------------------------------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[API] Servidor de reservas del hotel en http://localhost:${PORT}`);
  });
});