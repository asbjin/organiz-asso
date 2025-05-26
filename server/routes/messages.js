const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isAuthenticated, isOwnerOrAdmin } = require('../middlewares/auth');
const Message = require('../models/Message');

// Routes protégées pour tous les membres
router.post('/', isAuthenticated, messageController.createMessage);
router.get('/forum/:forumId', isAuthenticated, messageController.getForumMessages);
router.get('/replies/:messageId', isAuthenticated, messageController.getMessageReplies);
router.get('/user/:userId', isAuthenticated, messageController.getUserMessages);
router.get('/search', isAuthenticated, messageController.searchMessages);
router.get('/count', isAuthenticated, messageController.countMessages);
router.get('/forum/:forumId/count', isAuthenticated, messageController.countForumMessages);

// Route de test sans authentification pour la recherche
router.get('/test-search', messageController.searchMessages);

// Route pour la suppression en cascade d'un message et ses réponses
router.delete('/:id/cascade', isAuthenticated, messageController.deleteMessageCascade);

// Route pour obtenir un message spécifique - doit être après les autres routes /quelquechose/:param
router.get('/:messageId', isAuthenticated, messageController.getMessage);

// Routes protégées avec vérification de propriété
router.put('/:messageId', isAuthenticated, isOwnerOrAdmin(Message), messageController.updateMessage);

// Route de suppression - la vérification des droits se fait dans le contrôleur
router.delete('/:messageId', isAuthenticated, messageController.deleteMessage);

module.exports = router;
