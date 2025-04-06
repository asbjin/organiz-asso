const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// Configuration des origines CORS autorisées
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
  'https://organiz-asso-web.onrender.com',
  'https://organiz-asso.onrender.com'
].filter(Boolean);

console.log('Origines CORS autorisées:', allowedOrigins);

// Configuration Socket.io avec CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configuration des middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origine CORS refusée: ${origin}`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'organiz_asso_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// URL de connexion MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/organiz_asso';
console.log('Connexion à MongoDB URI:', MONGO_URI);

// Options de connexion MongoDB
const mongoOptions = {
  serverSelectionTimeoutMS: 5000, // 5 secondes avant timeout
  retryWrites: true,
  writeConcern: { w: 'majority' }
};

// Connexion à MongoDB avec optimisation
mongoose.connect(MONGO_URI, mongoOptions)
.then(() => {
  console.log('Connexion à MongoDB établie');
  // Vérifier la base de données et les collections
  const db = mongoose.connection.db;
  db.listCollections().toArray()
    .then(collections => {
      console.log('Collections disponibles:', collections.map(c => c.name).join(', '));
    })
    .catch(err => console.warn('Impossible de lister les collections:', err));
})
.catch(err => {
  console.error('Erreur de connexion à MongoDB:', err);
  // Continuer l'exécution du serveur même si MongoDB n'est pas disponible
  // pour permettre le développement et le débogage d'autres parties
});

// Gérer les événements de déconnexion
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB déconnecté. Tentative de reconnexion...');
});

mongoose.connection.on('error', (err) => {
  console.error('Erreur de connexion MongoDB:', err);
});

// Importation des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const forumRoutes = require('./routes/forums');
const messageRoutes = require('./routes/messages');

// Route de vérification de l'état du serveur
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/messages', messageRoutes);

// Configuration des WebSockets
io.on('connection', (socket) => {
  console.log('Nouvelle connexion WebSocket:', socket.id);
  
  // Stocker les messages récemment envoyés pour éviter les doublons
  const recentMessageIds = new Set();
  
  // Événement pour rejoindre un forum
  socket.on('join_forum', (forumId) => {
    if (!forumId) return;
    console.log(`Utilisateur ${socket.id} a rejoint le forum ${forumId}`);
    socket.join(forumId);
  });
  
  // Événement pour quitter un forum
  socket.on('leave_forum', (forumId) => {
    if (!forumId) return;
    console.log(`Utilisateur ${socket.id} a quitté le forum ${forumId}`);
    socket.leave(forumId);
  });
  
  // Système de déduplication pour les messages
  socket.on('new_message', (messageData) => {
    // Vérifier si le message a déjà été traité (éviter les doublons)
    const messageId = messageData._id || messageData.tempId;
    
    if (!messageId) {
      console.warn('Message reçu sans ID, impossible de dédupliquer');
      return;
    }
    
    // Si le message a déjà été traité récemment, l'ignorer
    if (recentMessageIds.has(messageId)) {
      console.log(`Message ignoré (doublon): ${messageId}`);
      return;
    }
    
    // Ajouter l'ID à l'ensemble des messages récents
    recentMessageIds.add(messageId);
    
    // Limiter la taille de l'ensemble (garder les 100 derniers messages)
    if (recentMessageIds.size > 100) {
      const firstItem = recentMessageIds.values().next().value;
      recentMessageIds.delete(firstItem);
    }
    
    // Forum ID est obligatoire
    if (!messageData.forumId) {
      console.warn('Message reçu sans forumId, impossible de diffuser');
      return;
    }
    
    console.log(`Nouveau message diffusé au forum ${messageData.forumId}, ID: ${messageId}`);
    
    // Diffuser le message uniquement aux autres clients dans le même forum
    socket.to(messageData.forumId).emit('receive_message', messageData);
  });
  
  // Événement de déconnexion
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// Logger pour les requêtes HTTP
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Port d'écoute
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = { app, io };
