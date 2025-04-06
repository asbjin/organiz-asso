const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/organiz_asso');
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@organiz-asso.fr' });
    if (existingAdmin) {
      console.log('L\'administrateur existe déjà, mise à jour du statut et du rôle...');
      existingAdmin.role = 'admin';
      existingAdmin.status = 'active';
      await existingAdmin.save();
      console.log('Administrateur mis à jour avec succès!');
    } else {
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
      console.log('Administrateur créé avec succès!');
    }
    
    // Vérifier la création
    const adminUser = await User.findOne({ email: 'admin@organiz-asso.fr' });
    console.log('Admin dans la base de données:', adminUser);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

createAdmin(); 