const Message = require('../models/Message');
const Forum = require('../models/Forum');
const User = require('../models/User');

// Créer un nouveau message
exports.createMessage = async (req, res) => {
  try {
    const { content, forumId, parentMessageId } = req.body;
    console.log('Création de message demandée:', { content, forumId, parentMessageId });
    
    // Validation des entrées
    if (!content || !forumId) {
      return res.status(400).json({ 
        message: 'Le contenu et l\'ID du forum sont requis.' 
      });
    }
    
    // Utiliser l'ID de l'utilisateur connecté
    const authorId = req.user._id;
    
    try {
      // Vérifier si le forum existe
      let forum = null;
      try {
        forum = await Forum.findById(forumId);
      } catch (error) {
        console.error('Erreur lors de la recherche du forum:', error);
        return res.status(500).json({ 
          message: 'Erreur lors de la recherche du forum.',
          error: error.message
        });
      }
      
      if (!forum) {
        return res.status(404).json({ message: 'Forum non trouvé.' });
      }
      
      // Vérifier si l'utilisateur a accès au forum
      if (forum.type === 'closed' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Vous n\'avez pas accès à ce forum.' });
      }
      
      // Vérifier si le message parent existe (si spécifié)
      if (parentMessageId) {
        try {
          const parentMessage = await Message.findById(parentMessageId);
          if (!parentMessage) {
            return res.status(404).json({ message: 'Message parent non trouvé.' });
          }
          
          // Vérifier si le message parent appartient au même forum
          if (parentMessage.forum.toString() !== forumId) {
            return res.status(400).json({ message: 'Le message parent n\'appartient pas à ce forum.' });
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du message parent:', error);
          return res.status(500).json({ 
            message: 'Erreur lors de la vérification du message parent.',
            error: error.message
          });
        }
      }
      
      // Créer et sauvegarder le message
      const newMessage = new Message({
        content,
        author: authorId,
        forum: forumId,
        parentMessage: parentMessageId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Sauvegarder le message
      try {
        await newMessage.save();
        console.log('Message sauvegardé avec succès, ID:', newMessage._id);
        
        // Mettre à jour la date de dernière activité du forum
        try {
          await Forum.findByIdAndUpdate(forumId, { lastActivity: Date.now() });
        } catch (forumError) {
          console.warn('Impossible de mettre à jour la dernière activité du forum:', forumError);
          // Continuer malgré l'erreur
        }
        
        // Récupérer le message avec les informations de l'auteur
        try {
          const populatedMessage = await Message.findById(newMessage._id)
            .populate('author', 'username profilePicture');
          
          return res.status(201).json({
            message: 'Message publié avec succès.',
            messageData: populatedMessage
          });
        } catch (populateError) {
          console.warn('Impossible de récupérer le message avec populate:', populateError);
          
          // Fallback: retourner le message sans populate
          return res.status(201).json({
            message: 'Message publié avec succès.',
            messageData: newMessage
          });
        }
      } catch (saveError) {
        console.error('Erreur lors de la sauvegarde du message:', saveError);
        return res.status(500).json({ 
          message: 'Erreur lors de la sauvegarde du message.',
          error: saveError.message
        });
      }
    } catch (outerError) {
      console.error('Erreur externe lors de la création du message:', outerError);
      return res.status(500).json({ 
        message: 'Erreur serveur lors de la création du message.',
        error: outerError.message 
      });
    }
  } catch (error) {
    console.error('Erreur critique lors de la création du message:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur critique.',
      error: error.message 
    });
  }
};

// Obtenir tous les messages d'un forum
exports.getForumMessages = async (req, res) => {
  try {
    const { forumId } = req.params;
    console.log('Récupération des messages pour le forum:', forumId);
    
    if (!forumId) {
      return res.status(400).json({ message: 'ID du forum requis.' });
    }
    
    try {
      // Vérifier si le forum existe
      let forum = null;
      try {
        forum = await Forum.findById(forumId);
      } catch (error) {
        console.error('Erreur lors de la recherche du forum:', error);
        return res.status(500).json({ 
          message: 'Erreur lors de la recherche du forum.',
          error: error.message
        });
      }
      
      if (!forum) {
        return res.status(404).json({ message: 'Forum non trouvé.' });
      }
      
      // Vérifier si l'utilisateur a accès au forum
      if (forum.type === 'closed' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Vous n\'avez pas accès à ce forum.' });
      }
      
      // Récupérer les messages principaux (sans parent) et non supprimés
      try {
        const messages = await Message.find({ 
          forum: forumId,
          parentMessage: null,
          isDeleted: { $ne: true }  // Ne pas inclure les messages supprimés
        }).sort({ createdAt: -1 });
        
        console.log(`${messages.length} messages non supprimés trouvés pour le forum ${forumId}`);
        
        // Pour chaque message, ajouter manuellement les informations de l'auteur
        // cela évite les problèmes avec populate
        let messagesWithAuthor = [];
        
        for (const message of messages) {
          let messageObj = message.toObject();
          
          try {
            const author = await User.findById(message.author).select('username profilePicture');
            if (author) {
              messageObj.author = author;
            } else {
              messageObj.author = {
                _id: message.author,
                username: 'Utilisateur inconnu',
                profilePicture: ''
              };
            }
          } catch (error) {
            console.warn(`Impossible de trouver l'auteur du message ${message._id}:`, error);
            messageObj.author = {
              _id: message.author,
              username: 'Utilisateur inconnu',
              profilePicture: ''
            };
          }
          
          messagesWithAuthor.push(messageObj);
        }
        
        return res.status(200).json(messagesWithAuthor);
      } catch (messagesError) {
        console.error('Erreur lors de la récupération des messages:', messagesError);
        return res.status(500).json({ 
          message: 'Erreur lors de la récupération des messages.',
          error: messagesError.message
        });
      }
    } catch (forumError) {
      console.error('Erreur lors de la vérification du forum:', forumError);
      return res.status(500).json({ 
        message: 'Erreur lors de la vérification du forum.',
        error: forumError.message
      });
    }
  } catch (error) {
    console.error('Erreur critique lors de la récupération des messages:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur critique.',
      error: error.message 
    });
  }
};

// Obtenir les détails d'un message
exports.getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(`Recherche du message ${messageId}`);
    
    // Vérifier si l'ID est valide
    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de message invalide' });
    }
    
    const message = await Message.findById(messageId)
      .populate('author', 'username profilePicture');
    
    if (!message) {
      console.log(`Message ${messageId} non trouvé dans la base de données`);
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    
    console.log(`Message ${messageId} trouvé avec succès`);
    res.status(200).json(message);
  } catch (error) {
    console.error(`Erreur lors de la récupération du message ${req.params.messageId}:`, error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir les réponses à un message avec structure imbriquée
exports.getMessageReplies = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(`Recherche des réponses au message ${messageId}`);
    
    // Vérifier si l'ID est valide
    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de message invalide' });
    }
    
    // Vérifier si le message existe
    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      console.log(`Message parent ${messageId} non trouvé - impossible de récupérer les réponses`);
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    
    // Vérifier si l'utilisateur a accès au forum
    const forum = await Forum.findById(parentMessage.forum);
    if (!forum) {
      console.log(`Forum ${parentMessage.forum} du message ${messageId} non trouvé`);
      return res.status(404).json({ message: 'Forum non trouvé.' });
    }
    
    if (forum.type === 'closed' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'avez pas accès à ce forum.' });
    }
    
    // Fonction récursive pour obtenir les réponses et leurs réponses
    async function getRepliesRecursive(parentId, depth = 0, maxDepth = 5) {
      if (depth >= maxDepth) return []; // Limiter la profondeur pour éviter les boucles infinies
      
      const directReplies = await Message.find({ 
        parentMessage: parentId,
        isDeleted: { $ne: true } // Ne pas inclure les réponses supprimées
      })
        .populate('author', 'username profilePicture')
        .sort({ createdAt: 1 });
      
      const repliesWithChildren = await Promise.all(directReplies.map(async (reply) => {
        const replyObj = reply.toObject();
        replyObj.children = await getRepliesRecursive(reply._id, depth + 1, maxDepth);
        replyObj.depth = depth; // Ajouter la profondeur pour l'affichage frontend
        return replyObj;
      }));
      
      return repliesWithChildren;
    }
    
    // Récupérer les réponses avec structure imbriquée
    const replies = await getRepliesRecursive(messageId);
    console.log(`${replies.length} réponses non supprimées trouvées pour le message ${messageId}`);
    
    res.status(200).json(replies);
  } catch (error) {
    console.error(`Erreur lors de la récupération des réponses au message ${req.params.messageId}:`, error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Mettre à jour un message
exports.updateMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const { messageId } = req.params;
    
    // Récupérer le message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    
    // Vérifier si l'utilisateur est l'auteur du message ou un administrateur
    if (message.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce message.' });
    }
    
    // Mettre à jour le message
    message.content = content;
    message.isEdited = true;
    message.updatedAt = Date.now();
    
    await message.save();
    
    // Récupérer le message mis à jour avec les informations de l'auteur
    const updatedMessage = await Message.findById(messageId)
      .populate('author', 'username profilePicture');
    
    res.status(200).json({
      message: 'Message mis à jour avec succès.',
      messageData: updatedMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(`Suppression du message ${messageId} demandée par ${req.user.username} (${req.user._id})`);
    
    // Trouver le message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    
    // Vérifier si l'utilisateur est autorisé à supprimer ce message
    // (auteur du message ou administrateur)
    if (message.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce message.' });
    }
    
    // Marquer le message comme supprimé au lieu de le supprimer physiquement
    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      content: "[Ce message a été supprimé]"
    });
    
    console.log(`Message ${messageId} marqué comme supprimé`);
    
    return res.status(200).json({
      message: 'Message supprimé avec succès.',
      softDeleted: true
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression du message ${req.params.messageId}:`, error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression du message.', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Fonction auxiliaire pour trouver tous les IDs des messages enfants récursivement
async function findAllChildrenIds(parentId, allIds = []) {
  const children = await Message.find({ parentMessage: parentId }).select('_id');
  const childrenIds = children.map(child => child._id);
  
  allIds.push(...childrenIds);
  
  for (const childId of childrenIds) {
    await findAllChildrenIds(childId, allIds);
  }
  
  return allIds;
}

// Supprimer un message et toutes ses réponses en cascade
exports.deleteMessageCascade = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Suppression en cascade du message ${id} demandée par ${req.user.username} (${req.user._id})`);
    
    // Trouver le message principal
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    
    // Vérifier si l'utilisateur est autorisé à supprimer ce message
    // (auteur du message ou administrateur)
    if (message.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce message.' });
    }
    
    // Collecter tous les IDs des réponses à supprimer
    const replyIds = await findAllChildrenIds(id);
    console.log(`Trouvé ${replyIds.length} réponses à marquer comme supprimées pour le message ${id}`);
    
    // Tous les IDs à marquer comme supprimés (message principal + réponses)
    const allIdsToDelete = [id, ...replyIds];
    
    // Marquer tous les messages comme supprimés en une seule opération (soft delete)
    const updateResult = await Message.updateMany(
      { _id: { $in: allIdsToDelete } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          content: "[Ce message a été supprimé]"
        }
      }
    );
    
    console.log(`Suppression logique effectuée: ${updateResult.modifiedCount} messages marqués comme supprimés`);
    
    return res.status(200).json({
      message: 'Message et ses réponses supprimés avec succès.',
      deletedCount: updateResult.modifiedCount,
      details: {
        parentMessage: id,
        deletedReplies: replyIds,
        totalModified: allIdsToDelete.length
      }
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression en cascade du message ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression en cascade.', 
      error: error.message
    });
  }
};

// Rechercher des messages
exports.searchMessages = async (req, res) => {
  try {
    const { 
      keyword, 
      author, 
      startDate, 
      endDate, 
      forumId, 
      sortBy = 'date', 
      sortOrder = 'desc',
      searchMode = 'oneWord'
    } = req.query;
    
    console.log('Recherche de messages avec paramètres:', req.query);
    
    // Construire la requête de recherche
    const query = { isDeleted: { $ne: true } };
    
    // Filtrer par mot-clé avec différents modes de recherche
    if (keyword && keyword.trim()) {
      try {
        if (searchMode === 'exactPhrase') {
          // Recherche de phrase exacte
          query.$text = { $search: `"${keyword}"` };
          console.log('Mode de recherche: phrase exacte');
        } else if (searchMode === 'allWords') {
          // Tous les mots doivent être présents (AND)
          const words = keyword.split(/\s+/).filter(Boolean);
          if (words.length > 0) {
            query.$text = { $search: words.join(' ') };
            // Nous devons vérifier que tous les mots sont présents
            query.$text.$language = 'french';
            query.$text.$caseSensitive = false;
            query.$text.$diacriticSensitive = false;
            console.log('Mode de recherche: tous les mots - ', words.join(' '));
          }
        } else {
          // Un des mots suffit (OR) - mode par défaut
          query.$text = { $search: keyword };
          console.log('Mode de recherche: un mot suffit');
        }
      } catch (textSearchError) {
        console.error('Erreur dans la construction de la recherche textuelle:', textSearchError);
        // Continuer sans la recherche textuelle
      }
    }
    
    // Filtrer par auteur
    if (author && author.trim()) {
      try {
        const authorRegex = new RegExp(author, 'i');
        const authors = await User.find({ username: { $regex: authorRegex } }).select('_id');
        if (authors && authors.length > 0) {
          query.author = { $in: authors.map(a => a._id) };
        }
      } catch (authorError) {
        console.error('Erreur lors de la recherche des auteurs:', authorError);
        // Continuer sans ce filtre
      }
    }
    
    // Filtrer par intervalle de temps
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        try {
          query.createdAt.$gte = new Date(startDate);
        } catch (dateError) {
          console.error('Erreur avec la date de début:', dateError);
          // Continuer sans ce filtre
        }
      }
      if (endDate) {
        try {
          // Ajouter 1 jour pour inclure tout le jour de fin
          const endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1);
          query.createdAt.$lte = endDateObj;
        } catch (dateError) {
          console.error('Erreur avec la date de fin:', dateError);
          // Continuer sans ce filtre
        }
      }
    }
    
    // Filtrer par forum
    if (forumId) {
      try {
        query.forum = forumId;
        
        // Vérifier si l'utilisateur a accès au forum
        const forum = await Forum.findById(forumId);
        if (!forum) {
          return res.status(404).json({ message: 'Forum non trouvé.' });
        }
        
        if (forum.type === 'closed' && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Vous n\'avez pas accès à ce forum.' });
        }
      } catch (forumError) {
        console.error('Erreur lors de la vérification du forum:', forumError);
        // Continuer sans ce filtre
      }
    } else {
      // Si aucun forum n'est spécifié, exclure les messages des forums fermés pour les non-admins
      if (!req.user || req.user.role !== 'admin') {
        try {
          const closedForums = await Forum.find({ type: 'closed' }).select('_id');
          if (closedForums && closedForums.length > 0) {
            query.forum = { $nin: closedForums.map(f => f._id) };
          }
        } catch (forumError) {
          console.error('Erreur lors de la récupération des forums fermés:', forumError);
          // Continuer sans ce filtre
        }
      }
    }
    
    // Déterminer le tri
    let sortOptions = {};
    
    switch (sortBy) {
      case 'author':
        // Pour trier par auteur, nous devons d'abord récupérer les messages puis trier
        sortOptions = {}; // On triera manuellement après la requête
        break;
      case 'relevance':
        if (keyword) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { createdAt: -1 }; // Tri par date si pas de mot-clé
        }
        break;
      case 'likes':
        sortOptions = { likesCount: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'date':
      default:
        sortOptions = { createdAt: sortOrder === 'desc' ? -1 : 1 };
    }
    
    // Ajouter un second critère de tri par date pour garantir un ordre stable
    if (sortBy !== 'date') {
      sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Exécuter la recherche
    let messages = [];
    
    try {
      if (keyword && sortBy === 'relevance') {
        // Si on cherche par pertinence avec des mots-clés, on ajoute le score de pertinence
        messages = await Message.find(query, { score: { $meta: 'textScore' } })
          .populate('author', 'username profilePicture')
          .populate('forum', 'name')
          .sort(sortOptions)
          .limit(100);
      } else {
        messages = await Message.find(query)
          .populate('author', 'username profilePicture')
          .populate('forum', 'name')
          .sort(sortOptions)
          .limit(100);
      }
    
      // Si le tri est par auteur, on doit le faire manuellement après avoir récupéré les données
      if (sortBy === 'author' && Array.isArray(messages)) {
        messages.sort((a, b) => {
          const usernameA = a.author?.username?.toLowerCase() || '';
          const usernameB = b.author?.username?.toLowerCase() || '';
          return sortOrder === 'desc' 
            ? usernameB.localeCompare(usernameA, 'fr')
            : usernameA.localeCompare(usernameB, 'fr');
        });
      }
    } catch (searchError) {
      console.error('Erreur lors de la requête de recherche:', searchError);
      return res.status(500).json({ 
        message: 'Erreur lors de l\'exécution de la recherche.', 
        error: searchError.message 
      });
    }
    
    // S'assurer que messages est bien un tableau
    if (!Array.isArray(messages)) {
      console.warn('Résultat de recherche non valide, retour d\'un tableau vide');
      messages = [];
    }
    
    console.log(`Recherche terminée: ${messages.length} résultats trouvés`);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur dans la recherche de messages:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la recherche.', 
      error: error.message,
      results: [] // Toujours renvoyer un tableau vide en cas d'erreur
    });
  }
};

// Obtenir les messages d'un utilisateur
exports.getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Récupération des messages pour utilisateur:', userId);
        
    // Construire la requête
    const query = { 
      author: userId,
      isDeleted: { $ne: true } // Ne pas inclure les messages supprimés
    };
    
    // Exclure les messages des forums fermés pour les non-admins
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      const closedForums = await Forum.find({ type: 'closed' }).select('_id');
      query.forum = { $nin: closedForums.map(f => f._id) };
    }
    
    // Récupérer les messages
    const messages = await Message.find(query)
      .populate('forum', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Compter le nombre total de messages
exports.countMessages = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      isDeleted: { $ne: true } // Ne pas compter les messages supprimés
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Compter le nombre de messages dans un forum spécifique
exports.countForumMessages = async (req, res) => {
  try {
    const { forumId } = req.params;
    const count = await Message.countDocuments({ 
      forum: forumId,
      parentMessage: null, // Seulement les messages principaux (pas les réponses)
      isDeleted: { $ne: true } // Ne pas compter les messages supprimés
    });
    
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
