require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const taskRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/error');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
// Static folder for uploaded files
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Database connection
mongoose.set('strictQuery', false);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management';

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(mongoUri, {
      // Mongoose 7+ sensible defaults; keep explicit for clarity
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${attempt}):`, err?.message || err);
    // For Atlas IP whitelist cases, keep retrying in the background
    const delayMs = Math.min(30000, 2000 * attempt); // backoff up to 30s
    setTimeout(() => connectWithRetry(attempt + 1), delayMs);
  }
}

connectWithRetry();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tasks', taskRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Waste Management System API is running');
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
