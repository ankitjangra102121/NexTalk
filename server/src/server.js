const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const errorMiddleware = require('./middleware/error.middleware');
const compression = require('compression');
const chatRoutes = require('./routes/chat.routes');
const hpp = require('hpp');
const apiLimiter = require('./middleware/rateLimit.middleware');
const systemRoutes = require('./routes/system.routes');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocket } = require('./socket/socket');
const userRoutes = require('./routes/user.routes');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(compression());

app.use(helmet());

app.use(morgan('dev'));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(hpp());

app.use(apiLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);
app.use('/uploads', express.static('uploads'));

// health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Real-time Chat Server Running Successfully 🚀',
  });
});

const PORT = process.env.PORT || 5000;

app.use(errorMiddleware);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

initializeSocket(io);

server.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');

  server.close(() => {
    console.log('Server stopped');

    process.exit(0);
  });
});
