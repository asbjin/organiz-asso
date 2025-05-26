const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Forum = require('./models/Forum');
const Message = require('./models/Message');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/organiz_asso', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB établie pour le script de population'))
.catch(err => {
  console.error('Erreur de connexion à MongoDB:', err);
  process.exit(1);
});

// Fonction pour vider la base de données
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Forum.deleteMany({});
    await Message.deleteMany({});
    console.log('Base de données vidée avec succès');
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
    process.exit(1);
  }
};

// Fonction pour créer des utilisateurs
const createUsers = async () => {
  try {
    // Créer un administrateur
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      email: 'admin@organiz-asso.fr',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      bio: 'Administrateur principal de la plateforme',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    await admin.save();

    // Créer des membres actifs
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const userPassword = await bcrypt.hash(`user${i}123`, 10);
      const user = new User({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: userPassword,
        role: 'member',
        status: 'active',
        bio: `Je suis l'utilisateur numéro ${i}`,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Dates échelonnées
        lastLogin: new Date(Date.now() - i * 12 * 60 * 60 * 1000)
      });
      const savedUser = await user.save();
      users.push(savedUser);
    }

    // Créer des utilisateurs en attente
    for (let i = 1; i <= 3; i++) {
      const pendingPassword = await bcrypt.hash(`pending${i}123`, 10);
      const pendingUser = new User({
        username: `pending${i}`,
        email: `pending${i}@example.com`,
        password: pendingPassword,
        role: 'member',
        status: 'pending',
        bio: `Utilisateur en attente de validation numéro ${i}`,
        createdAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000)
      });
      await pendingUser.save();
    }

    console.log('Utilisateurs créés avec succès');
    return { admin, users };
  } catch (error) {
    console.error('Erreur lors de la création des utilisateurs:', error);
    process.exit(1);
  }
};

// Fonction pour créer des forums
const createForums = async (admin) => {
  try {
    // Forum ouvert
    const openForum = new Forum({
      name: 'Discussions générales',
      description: 'Forum ouvert à tous les membres pour discuter de sujets variés',
      type: 'open',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
      lastActivity: new Date()
    });
    await openForum.save();

    // Forum ouvert thématique
    const thematicForum = new Forum({
      name: 'Événements à venir',
      description: 'Discussions autour des événements organisés par l\'association',
      type: 'open',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
    await thematicForum.save();

    // Forum fermé pour les administrateurs
    const closedForum = new Forum({
      name: 'Administration',
      description: 'Forum réservé aux administrateurs pour discuter de la gestion de l\'association',
      type: 'closed',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await closedForum.save();

    console.log('Forums créés avec succès');
    return { openForum, thematicForum, closedForum };
  } catch (error) {
    console.error('Erreur lors de la création des forums:', error);
    process.exit(1);
  }
};

// Fonction pour créer des messages
const createMessages = async (users, forums) => {
  try {
    const { openForum, thematicForum, closedForum } = forums;
    const messages = [];

    // Messages dans le forum ouvert
    for (let i = 0; i < 10; i++) {
      const userIndex = i % users.length;
      const message = new Message({
        content: `Ceci est un message de test numéro ${i + 1} dans le forum général. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.`,
        author: users[userIndex]._id,
        forum: openForum._id,
        createdAt: new Date(Date.now() - (10 - i) * 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - (10 - i) * 12 * 60 * 60 * 1000)
      });
      const savedMessage = await message.save();
      messages.push(savedMessage);

      // Ajouter quelques réponses
      if (i < 5) {
        for (let j = 0; j < 3; j++) {
          const replyUserIndex = (userIndex + j + 1) % users.length;
          const reply = new Message({
            content: `Ceci est une réponse au message ${i + 1}. Réponse numéro ${j + 1}.`,
            author: users[replyUserIndex]._id,
            forum: openForum._id,
            parentMessage: savedMessage._id,
            createdAt: new Date(Date.now() - (10 - i) * 12 * 60 * 60 * 1000 + (j + 1) * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - (10 - i) * 12 * 60 * 60 * 1000 + (j + 1) * 60 * 60 * 1000)
          });
          await reply.save();
        }
      }
    }

    // Messages dans le forum thématique
    for (let i = 0; i < 5; i++) {
      const userIndex = i % users.length;
      const message = new Message({
        content: `Proposition d'événement ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt.`,
        author: users[userIndex]._id,
        forum: thematicForum._id,
        createdAt: new Date(Date.now() - (5 - i) * 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - (5 - i) * 12 * 60 * 60 * 1000)
      });
      await message.save();
    }

    // Messages dans le forum fermé
    for (let i = 0; i < 3; i++) {
      const message = new Message({
        content: `Note administrative ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        author: users[0]._id, // Premier utilisateur (pourrait être l'admin)
        forum: closedForum._id,
        createdAt: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000)
      });
      await message.save();
    }

    console.log('Messages créés avec succès');
  } catch (error) {
    console.error('Erreur lors de la création des messages:', error);
    process.exit(1);
  }
};

// Fonction principale pour peupler la base de données
const populateDatabase = async () => {
  try {
    await clearDatabase();
    const { admin, users } = await createUsers();
    const forums = await createForums(admin);
    await createMessages(users, forums);
    
    console.log('Base de données peuplée avec succès !');
    console.log('\nComptes utilisateurs créés:');
    console.log('- Admin: admin@organiz-asso.fr / admin123');
    console.log('- Membres: user1@example.com à user5@example.com / user1123 à user5123');
    console.log('- En attente: pending1@example.com à pending3@example.com / pending1123 à pending3123');
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du peuplement de la base de données:', error);
    process.exit(1);
  }
};

// Exécuter la fonction principale
populateDatabase();
