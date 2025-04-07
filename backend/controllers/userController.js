const User = require('../models/User');

// Obtenir la liste de tous les utilisateurs (pour les administrateurs)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir les utilisateurs en attente de validation
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    res.status(200).json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir un utilisateur par son ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Mettre à jour le profil d'un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    
    // Vérifier si l'utilisateur est autorisé à modifier ce profil
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce profil.' });
    }
    
    // Vérifier si le nom d'utilisateur ou l'email est déjà utilisé
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.params.id } },
          { $or: [
            { username: username || '' },
            { email: email || '' }
          ]}
        ]
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur ou cet email est déjà utilisé.' });
      }
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(username && { username }),
          ...(email && { email }),
          ...(bio && { bio })
        }
      },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    res.status(200).json({
      message: 'Profil mis à jour avec succès.',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Valider ou rejeter l'inscription d'un utilisateur (admin uniquement)
exports.validateUser = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide. Utilisez "active" ou "rejected".' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    const statusMessage = status === 'active' ? 'validée' : 'rejetée';
    
    res.status(200).json({
      message: `L'inscription de l'utilisateur a été ${statusMessage} avec succès.`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier le rôle d'un utilisateur (admin uniquement)
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Utilisez "member" ou "admin".' });
    }
    
    // Empêcher un administrateur de se rétrograder lui-même
    if (req.user._id.toString() === req.params.id && role === 'member') {
      return res.status(403).json({ message: 'Vous ne pouvez pas vous rétrograder vous-même.' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    const roleMessage = role === 'admin' ? 'administrateur' : 'membre';
    
    res.status(200).json({
      message: `Le rôle de l'utilisateur a été modifié en ${roleMessage} avec succès.`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir le profil d'un utilisateur
exports.getProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetToken -resetTokenExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération du profil.',
      error: error.message 
    });
  }
};

// Autocomplete pour les noms d'utilisateurs
exports.autocompleteUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'La requête doit contenir au moins 2 caractères' });
    }
    
    // Recherche des utilisateurs dont le nom contient la requête
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      status: 'approved' // Seulement les utilisateurs approuvés
    })
    .select('username')
    .limit(10);
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Erreur lors de l\'autocomplétion des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Rechercher des utilisateurs
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`Recherche d'utilisateurs pour: "${q}"`);
    
    if (!q || q.trim() === '') {
      console.log('Recherche vide, retour tableau vide');
      return res.status(200).json([]);
    }
    
    // Recherche d'utilisateurs par nom d'utilisateur
    const query = {
      username: { $regex: q, $options: 'i' },
      status: 'active' // Seulement les utilisateurs actifs
    };
    
    console.log('Requête de recherche:', JSON.stringify(query));
    
    try {
      const users = await User.find(query)
        .select('username role createdAt')
        .limit(20);
      
      console.log(`${users.length} utilisateurs trouvés`);
      res.status(200).json(users);
    } catch (findError) {
      console.error('Erreur lors de la recherche dans la base de données:', findError);
      return res.status(500).json({ 
        message: 'Erreur de base de données.', 
        error: findError.message,
        results: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la recherche.', 
      error: error.message,
      results: [] // Toujours renvoyer un tableau vide en cas d'erreur
    });
  }
};
