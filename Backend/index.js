const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { apiLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();
const PORT = process.env.PORT || 4001;

// 1. Cabeceras de seguridad HTTP con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Permite cargar imágenes estáticas de uploads desde el frontend
  })
);

// 2. Configuración de CORS segura
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite solicitudes sin origin (como Postman o curl en desarrollo) o desde orígenes autorizados
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Acceso bloqueado por CORS para el origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Parseo de cuerpo JSON y URL-encoded con límite de tamaño
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Servir archivos estáticos de uploads de forma segura
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Rate limiting general para la API
app.use('/api', apiLimiter);

// 6. Registro de Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/pacientes', require('./routes/pacientesRoutes'));
app.use('/api/roles', require('./routes/rolesRoutes'));
app.use('/api/especialidades', require('./routes/especialidadRoutes'));

// Soporte tanto para /api/quirofanos como para /api/quirofano (compatibilidad con vistas existentes)
const quirofanoRouter = require('./routes/quirofanoRoutes');
app.use('/api/quirofanos', quirofanoRouter);
app.use('/api/quirofano', quirofanoRouter);

app.use('/api/equipos', require('./routes/equipoMedicoRoutes'));
app.use('/api/cirugias', require('./routes/cirugiaRoutes'));

// 7. Ruta de chequeo de salud (Health check para monitoreo y DevOps)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 8. Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ msg: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// 9. Middleware global para captura de errores
app.use((err, req, res, next) => {
  console.error('💥 Error global no controlado:', err);
  const status = err.status || 500;
  res.status(status).json({
    msg: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor ABMODEL corriendo de manera segura en el puerto ${PORT}`);
});