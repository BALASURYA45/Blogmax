require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const upload = require('./middleware/upload');
const { auth } = require('./middleware/auth');
const Category = require('./models/Category');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// Category Seeding Function
const seedCategories = async () => {
  try {
    const defaultCategories = [
      { name: 'Education', description: 'Learning and educational resources' },
      { name: 'Sports', description: 'Latest sports news and updates' },
      { name: 'Comedy', description: 'Funny stories and entertainment' },
      { name: 'Life', description: 'Lifestyle, health, and personal growth' },
      { name: 'Technology', description: 'Gadgets, software, and tech trends' },
      { name: 'Entertainment', description: 'Movies, music, and celebrity news' },
      { name: 'Business', description: 'Entrepreneurship and financial insights' }
    ];

    for (const cat of defaultCategories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        const slug = cat.name.toLowerCase().split(' ').join('-');
        await new Category({ ...cat, slug }).save();
        console.log(`Seeded category: ${cat.name}`);
      }
    }
  } catch (err) {
    console.error('Category seeding error:', err);
  }
};

io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blogmax';

mongoose.connect(MONGO_URI)
  .then(() => {
    const dbHost = mongoose.connection.host;
    console.log(`Connected to MongoDB: ${dbHost}`);
    seedCategories();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
