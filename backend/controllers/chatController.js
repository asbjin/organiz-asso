const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// Envoyer un message à un utilisateur
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Le destinataire et le contenu sont obligatoires.' });
    }
    
    // Vérifier que le destinataire existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Destinataire introuvable.' });
    }
    
    // Créer le message
    const message = new ChatMessage({
      content,
      sender: req.user._id,
      receiver: receiverId
    });
    
    await message.save();
    
    // Populer les infos de l'expéditeur pour la réponse
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');
    
    res.status(201).json({ 
      message: 'Message envoyé avec succès.',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Récupérer les messages d'une conversation entre deux utilisateurs
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur existe
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    
    // Rechercher tous les messages entre les deux utilisateurs
    const messages = await ChatMessage.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ],
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username profilePicture')
    .populate('receiver', 'username profilePicture');
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Marquer un message comme lu
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await ChatMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message introuvable.' });
    }
    
    // Vérifier que l'utilisateur est bien le destinataire
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à marquer ce message comme lu.' });
    }
    
    // Mettre à jour le message
    message.read = true;
    message.readAt = new Date();
    await message.save();
    
    res.status(200).json({ message: 'Message marqué comme lu.' });
  } catch (error) {
    console.error('Erreur lors du marquage du message:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Récupérer la liste des conversations d'un utilisateur
exports.getConversationsList = async (req, res) => {
  try {
    // Trouver tous les utilisateurs avec qui l'utilisateur courant a échangé des messages
    const sentMessages = await ChatMessage.find({ sender: req.user._id, isDeleted: false })
      .distinct('receiver');
    
    const receivedMessages = await ChatMessage.find({ receiver: req.user._id, isDeleted: false })
      .distinct('sender');
    
    // Combiner et supprimer les doublons
    const conversationUserIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // Récupérer les détails des utilisateurs
    const users = await User.find({ _id: { $in: conversationUserIds } })
      .select('username profilePicture lastLogin');
    
    // Pour chaque utilisateur, récupérer le dernier message et compter les non lus
    const conversations = await Promise.all(users.map(async (user) => {
      // Récupérer le dernier message
      const lastMessage = await ChatMessage.findOne({
        $or: [
          { sender: req.user._id, receiver: user._id },
          { sender: user._id, receiver: req.user._id }
        ],
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .select('content createdAt read sender');
      
      // Compter les messages non lus
      const unreadCount = await ChatMessage.countDocuments({
        sender: user._id,
        receiver: req.user._id,
        read: false,
        isDeleted: false
      });
      
      return {
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin
        },
        lastMessage,
        unreadCount
      };
    }));
    
    // Trier par date du dernier message
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await ChatMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message introuvable.' });
    }
    
    // Vérifier que l'utilisateur est bien l'expéditeur
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce message.' });
    }
    
    // Marquer le message comme supprimé
    message.isDeleted = true;
    await message.save();
    
    res.status(200).json({ message: 'Message supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
}; 