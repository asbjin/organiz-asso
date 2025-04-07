const Forum = require('../models/Forum');
const Message = require('../models/Message');

// Créer un nouveau forum (admin uniquement)
exports.createForum = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    
    // Vérifier si un forum avec ce nom existe déjà
    const existingForum = await Forum.findOne({ name });
    if (existingForum) {
      return res.status(400).json({ message: 'Un forum avec ce nom existe déjà.' });
    }
    
    // Vérifier si l'utilisateur tente de créer un forum privé sans être admin
    if (type === 'closed' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'avez pas les droits nécessaires pour créer un forum privé.' });
    }
    
    // Créer un nouveau forum
    const newForum = new Forum({
      name,
      description,
      type,
      createdBy: req.user._id
    });
    
    await newForum.save();
    
    res.status(201).json({
      message: 'Forum créé avec succès.',
      forum: newForum
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir tous les forums
exports.getAllForums = async (req, res) => {
  try {
    const forums = await Forum.find();
    
    // Cas spécial pour l'admin d'urgence
    const forumsWithAuthor = forums.map(forum => {
      // Convertir le forum en objet pour pouvoir le modifier
      const forumObj = forum.toObject();
      
      // Pour l'admin d'urgence, nous ne pouvons pas utiliser populate
      // alors nous ajoutons manuellement l'information de l'auteur
      forumObj.createdBy = forum.createdBy; // Garder l'ID du créateur
      forumObj.creator = {
        _id: forum.createdBy,
        username: 'Administrateur'
      };
      
      return forumObj;
    });
    
    res.status(200).json(forumsWithAuthor);
  } catch (error) {
    console.error('Erreur lors de la récupération des forums:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir un forum par son ID
exports.getForumById = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé.' });
    }
    
    // Vérifier si l'utilisateur a accès au forum
    if (forum.type === 'closed' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'avez pas accès à ce forum.' });
    }
    
    // Convertir le forum en objet pour pouvoir le modifier
    const forumObj = forum.toObject();
    
    // Ajouter manuellement l'information de l'auteur
    forumObj.createdBy = {
      _id: forumObj.createdBy,
      username: 'Administrateur'
    };
    
    res.status(200).json(forumObj);
  } catch (error) {
    console.error('Erreur lors de la récupération du forum:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Mettre à jour un forum (admin uniquement)
exports.updateForum = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    
    // Vérifier si un autre forum avec ce nom existe déjà
    if (name) {
      const existingForum = await Forum.findOne({
        _id: { $ne: req.params.id },
        name
      });
      
      if (existingForum) {
        return res.status(400).json({ message: 'Un autre forum avec ce nom existe déjà.' });
      }
    }
    
    // Mettre à jour le forum
    const updatedForum = await Forum.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(description && { description }),
          ...(type && { type })
        }
      },
      { new: true }
    ).populate('createdBy', 'username');
    
    if (!updatedForum) {
      return res.status(404).json({ message: 'Forum non trouvé.' });
    }
    
    res.status(200).json({
      message: 'Forum mis à jour avec succès.',
      forum: updatedForum
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer un forum (admin uniquement ou créateur du forum)
exports.deleteForum = async (req, res) => {
  try {
    // Récupérer le forum
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé.' });
    }
    
    // Vérifier si l'utilisateur est admin ou le créateur du forum
    if (req.user.role !== 'admin' && forum.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'avez pas les droits nécessaires pour supprimer ce forum.' });
    }
    
    // Supprimer le forum
    const deletedForum = await Forum.findByIdAndDelete(req.params.id);
    
    // Supprimer tous les messages associés à ce forum
    await Message.deleteMany({ forum: req.params.id });
    
    res.status(200).json({
      message: 'Forum et tous ses messages supprimés avec succès.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Autocomplete pour les noms de forums
exports.autocompleteForums = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'La requête doit contenir au moins 2 caractères' });
    }
    
    // Recherche des forums dont le nom contient la requête
    let query = {
      name: { $regex: q, $options: 'i' }
    };
    
    // Si l'utilisateur n'est pas administrateur, exclure les forums fermés
    if (req.user.role !== 'admin') {
      query.type = { $ne: 'closed' };
    }
    
    const forums = await Forum.find(query)
      .select('name type description')
      .limit(10);
    
    res.status(200).json(forums);
  } catch (error) {
    console.error('Erreur lors de l\'autocomplétion des forums:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Rechercher des forums
exports.searchForums = async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`Recherche de forums pour: "${q}"`);
    console.log('Headers de la requête:', req.headers);
    console.log('User info:', req.user ? `ID: ${req.user._id}, Role: ${req.user.role}` : 'Non authentifié');
    
    if (!q || q.trim() === '') {
      console.log('Recherche vide, retour tableau vide');
      return res.status(200).json([]);
    }
    
    // Construire la requête de recherche
    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };
    
    // Si l'utilisateur n'est pas administrateur ou n'est pas authentifié, exclure les forums fermés
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    if (!isAdmin) {
      query.type = { $ne: 'closed' };
      console.log('Utilisateur non admin, exclusion des forums privés');
    } else {
      console.log('Utilisateur admin, inclusion des forums privés');
    }
    
    console.log('Requête de recherche:', JSON.stringify(query));
    
    // Recherche de forums
    const forums = await Forum.find(query)
      .select('name description type createdAt lastActivity')
      .limit(20);
    
    console.log(`${forums.length} forums trouvés:`, forums.map(f => f.name).join(', '));
    res.status(200).json(forums);
  } catch (error) {
    console.error('Erreur lors de la recherche de forums:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la recherche.', 
      error: error.message,
      results: [] // Toujours renvoyer un tableau vide en cas d'erreur
    });
  }
};

// Rechercher tous les forums (pour admins seulement)
exports.searchAllForums = async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`Recherche de tous les forums (admin) pour: "${q}"`);
    console.log('Headers de la requête admin:', req.headers);
    console.log('User admin info:', req.user ? `ID: ${req.user._id}, Role: ${req.user.role}` : 'Non authentifié');
    
    if (!q || q.trim() === '') {
      console.log('Recherche vide, retour tableau vide');
      return res.status(200).json([]);
    }
    
    // Construire la requête de recherche SANS filtrer par type
    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };
    
    console.log('Requête de recherche admin:', JSON.stringify(query));
    
    // Recherche de tous les forums sans filtrer par type
    const forums = await Forum.find(query)
      .select('name description type createdAt lastActivity')
      .limit(20);
    
    console.log(`${forums.length} forums trouvés pour admin:`, forums.map(f => f.name).join(', '));
    res.status(200).json(forums);
  } catch (error) {
    console.error('Erreur lors de la recherche de forums (admin):', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la recherche.', 
      error: error.message,
      results: [] // Toujours renvoyer un tableau vide en cas d'erreur
    });
  }
};

// Recherche de forums par nom (pour l'autocomplétion)
exports.searchForumsByName = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'La requête doit contenir au moins 2 caractères' });
    }
    
    // Recherche des forums dont le nom contient la requête
    let query = {
      name: { $regex: q, $options: 'i' }
    };
    
    // Si l'utilisateur n'est pas administrateur, exclure les forums fermés
    if (req.user.role !== 'admin') {
      query.type = { $ne: 'closed' };
    }
    
    const forums = await Forum.find(query)
      .select('name type description')
      .limit(10);
    
    res.status(200).json(forums);
  } catch (error) {
    console.error('Erreur lors de la recherche des forums par nom:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir le nombre de messages d'un forum
exports.getForumMessageCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'ID du forum requis.' });
    }
    
    const count = await Message.countDocuments({ forum: id });
    
    res.status(200).json(count);
  } catch (error) {
    console.error('Erreur lors du comptage des messages:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
