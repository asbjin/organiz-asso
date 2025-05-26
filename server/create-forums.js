const mongoose = require('mongoose');
const Forum = require('./models/Forum');
const ObjectId = mongoose.Types.ObjectId;

async function createForums() {
  try {
    await mongoose.connect('mongodb://localhost:27017/organiz_asso');
    
    // Vider les forums existants
    await Forum.deleteMany({});
    console.log('Forums existants supprimés');
    
    // Créer un ID d'administrateur (même si l'utilisateur n'existe pas réellement)
    const adminId = new ObjectId();
    
    // Créer des forums de test
    const forums = [
      {
        name: 'Discussions générales',
        description: 'Forum ouvert à tous les membres pour discuter de sujets variés',
        type: 'open',
        createdAt: new Date(),
        createdBy: adminId,
        lastActivity: new Date()
      },
      {
        name: 'Événements à venir',
        description: 'Discussions autour des événements organisés par l\'association',
        type: 'open',
        createdAt: new Date(),
        createdBy: adminId,
        lastActivity: new Date()
      },
      {
        name: 'Administration',
        description: 'Forum réservé aux administrateurs pour discuter de la gestion de l\'association',
        type: 'closed',
        createdAt: new Date(),
        createdBy: adminId,
        lastActivity: new Date()
      }
    ];
    
    // Sauvegarder les forums dans la base de données
    await Forum.insertMany(forums);
    console.log('Forums créés avec succès!');
    
    // Vérifier les forums créés
    const createdForums = await Forum.find();
    console.log('Forums dans la base de données:', createdForums);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

createForums(); 