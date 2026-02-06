require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenge');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));


// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/challenges', challengeRoutes);

app.get('/', (req, res) => {
  res.send('Just 3 Days API is running');
});

// Start Server
const startServer = async () => {
  try {
    if (process.env.SKIP_DB !== 'true') {
      await connectDB();
    } else {
      console.log('NOTICE: Skipping MongoDB connection. API endpoints requiring DB will fail.');
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
