const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAuthenticated } = require('../middlewares/auth');

// Toutes les routes de chat nécessitent une authentification
router.use(isAuthenticated);

// Envoyer un message à un utilisateur
router.post('/send', chatController.sendMessage);

// Récupérer les messages d'une conversation entre deux utilisateurs
router.get('/conversation/:userId', chatController.getConversation);

// Récupérer la liste des conversations d'un utilisateur
router.get('/conversations', chatController.getConversationsList);

// Marquer un message comme lu
router.put('/read/:messageId', chatController.markAsRead);

// Supprimer un message
router.delete('/:messageId', chatController.deleteMessage);

module.exports = router; 