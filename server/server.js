require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: true, // Allow all origins during development
    credentials: true
  }));
// MongoDB Connection (updated for modern versions)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricecompare')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// User Model
const User = require('./models/User');

// Utility function for error handling
const handleErrors = (res, error) => {
  console.error(error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: 'Server error' });
};

// Routes
app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('Login attempt for:', email); // Debug log
  
      // Trim and lowercase email for consistency
      const user = await User.findOne({ 
        email: email.trim().toLowerCase() 
      });
      
      if (!user) {
        console.log('User not found:', email); // Debug log
        return res.status(404).json({ message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
  
      res.json({ 
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login endpoint error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
// User Registration Route

// Protected routes
app.get('/api/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    handleErrors(res, error);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    dbState: mongoose.connection.readyState,
    timestamp: new Date() 
  });
});

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});