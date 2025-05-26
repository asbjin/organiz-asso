const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/organiz_asso', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connexion à MongoDB établie'))
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

async function resetAdminPassword() {
  try {
    // Trouver l'utilisateur admin
    const admin = await User.findOne({ email: 'admin@organiz-asso.fr' });
    
    if (!admin) {
      console.log('Admin non trouvé. Création d\'un nouvel utilisateur admin...');
      
      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Créer un nouvel utilisateur admin
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@organiz-asso.fr',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        bio: 'Administrateur principal',
        profilePicture: '',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      await newAdmin.save();
      console.log('Nouvel utilisateur admin créé avec succès!');
    } else {
      console.log('Utilisateur admin trouvé. Réinitialisation du mot de passe...');
      
      // Mettre à jour directement le mot de passe sans passer par le middleware
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Mise à jour directe dans la base de données pour éviter le hook pre('save')
      await User.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Mot de passe admin réinitialisé avec succès!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 