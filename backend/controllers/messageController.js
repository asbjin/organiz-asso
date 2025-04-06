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
      
      // Récupérer les messages principaux (sans parent)
      try {
        const messages = await Message.find({ 
          forum: forumId,
          parentMessage: null
        }).sort({ createdAt: -1 });
        
        console.log(`${messages.length} messages trouvés pour le forum ${forumId}`);
        
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
      
      const directReplies = await Message.find({ parentMessage: parentId })
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
    console.log(`${replies.length} réponses trouvées pour le message ${messageId}`);
    
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

// Supprimer un message (système style Reddit)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(`Tentative de suppression du message ${messageId} par l'utilisateur ${req.user._id}`);
    
    // Vérifier si l'ID est valide
    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`ID de message invalide: ${messageId}`);
      return res.status(400).json({ message: 'ID de message invalide' });
    }
    
    // Récupérer le message
    const message = await Message.findById(messageId);
    if (!message) {
      console.log(`Message ${messageId} non trouvé dans la base de données`);
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    
    // Vérifier si l'utilisateur est l'auteur du message ou un administrateur
    const isAuthor = message.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      console.log(`Accès non autorisé: utilisateur ${req.user._id} tente de supprimer le message ${messageId} de l'utilisateur ${message.author}`);
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce message.' });
    }
    
    console.log(`Autorisation vérifiée: ${isAuthor ? 'auteur' : 'admin'}`);
    
    // Vérifier si le message a des réponses
    const hasReplies = await Message.exists({ parentMessage: messageId });
    console.log(`Le message ${messageId} a des réponses: ${hasReplies ? 'oui' : 'non'}`);
    
    if (hasReplies) {
      // Si le message a des réponses, on marque juste son contenu comme supprimé
      message.content = "[Ce message a été supprimé]";
      message.isDeleted = true;
      message.deletedAt = Date.now();
      await message.save();
      
      console.log(`Message ${messageId} marqué comme supprimé`);
      
      return res.status(200).json({
        message: 'Message marqué comme supprimé.',
        isDeleted: true,
        messageData: {
          _id: message._id,
          content: message.content,
          isDeleted: message.isDeleted
        }
      });
    } else {
      // Si le message n'a pas de réponses, on peut le supprimer complètement
      // Vérifier d'abord si c'est un message parent ou une réponse
      if (message.parentMessage) {
        // C'est une réponse, on peut la supprimer
        await Message.findByIdAndDelete(messageId);
        console.log(`Réponse ${messageId} supprimée complètement`);
        
        return res.status(200).json({
          message: 'Réponse supprimée avec succès.',
          completelyRemoved: true
        });
      } else {
        // C'est un message parent, vérifier s'il a été posté depuis moins de 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (message.createdAt > oneDayAgo) {
          // Moins de 24h, on peut le supprimer complètement
          await Message.findByIdAndDelete(messageId);
          console.log(`Message parent ${messageId} supprimé complètement (moins de 24h)`);
          
          return res.status(200).json({
            message: 'Message supprimé avec succès.',
            completelyRemoved: true
          });
        } else {
          // Plus de 24h, on le marque comme supprimé
          message.content = "[Ce message a été supprimé]";
          message.isDeleted = true;
          message.deletedAt = Date.now();
          await message.save();
          
          console.log(`Message parent ${messageId} marqué comme supprimé (plus de 24h)`);
          
          return res.status(200).json({
            message: 'Message marqué comme supprimé.',
            isDeleted: true,
            messageData: {
              _id: message._id,
              content: message.content,
              isDeleted: message.isDeleted
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du message ${req.params.messageId}:`, error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression du message.', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Rechercher des messages
exports.searchMessages = async (req, res) => {
  try {
    const { keyword, author, startDate, endDate, forumId } = req.query;
    
    // Construire la requête de recherche
    const query = {};
    
    // Filtrer par mot-clé
    if (keyword) {
      query.$text = { $search: keyword };
    }
    
    // Filtrer par auteur
    if (author) {
      const authorRegex = new RegExp(author, 'i');
      const authors = await User.find({ username: { $regex: authorRegex } }).select('_id');
      query.author = { $in: authors.map(a => a._id) };
    }
    
    // Filtrer par intervalle de temps
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Filtrer par forum
    if (forumId) {
      query.forum = forumId;
      
      // Vérifier si l'utilisateur a accès au forum
      const forum = await Forum.findById(forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum non trouvé.' });
      }
      
      if (forum.type === 'closed' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Vous n\'avez pas accès à ce forum.' });
      }
    } else {
      // Si aucun forum n'est spécifié, exclure les messages des forums fermés pour les non-admins
      if (req.user.role !== 'admin') {
        const closedForums = await Forum.find({ type: 'closed' }).select('_id');
        query.forum = { $nin: closedForums.map(f => f._id) };
      }
    }
    
    // Exécuter la recherche
    const messages = await Message.find(query)
      .populate('author', 'username profilePicture')
      .populate('forum', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Obtenir les messages d'un utilisateur
exports.getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Récupération des messages pour utilisateur:', userId);
        
    // Construire la requête
    const query = { author: userId };
    
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
