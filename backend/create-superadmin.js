const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createSuperAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/organiz_asso');
    
    // Vérifier si le super admin existe déjà
    const existingSuperAdmin = await User.findOne({ email: 'admin@organiz-asso.fr' });
    if (existingSuperAdmin) {
      console.log('Le super administrateur existe déjà, mise à jour du statut et du rôle...');
      existingSuperAdmin.role = 'superadmin';
      existingSuperAdmin.status = 'active';
      await existingSuperAdmin.save();
      console.log('Super administrateur mis à jour avec succès!');
    } else {
      // Créer un super administrateur
      const adminPassword = await bcrypt.hash('admin123', 10);
      const superAdmin = new User({
        username: 'admin',
        email: 'admin@organiz-asso.fr',
        password: adminPassword,
        role: 'superadmin',
        status: 'active',
        bio: 'Super administrateur de la plateforme',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      await superAdmin.save();
      console.log('Super administrateur créé avec succès!');
    }
    
    // Vérifier la création
    const superAdminUser = await User.findOne({ email: 'admin@organiz-asso.fr' });
    console.log('Super admin dans la base de données:', superAdminUser);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

createSuperAdmin(); 