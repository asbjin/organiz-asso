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

// Route pour obtenir un message spécifique - doit être après les autres routes /quelquechose/:param
router.get('/:messageId', isAuthenticated, messageController.getMessage);

// Routes protégées avec vérification de propriété
router.put('/:messageId', isAuthenticated, isOwnerOrAdmin(Message), messageController.updateMessage);

// Route de suppression - la vérification des droits se fait dans le contrôleur
router.delete('/:messageId', isAuthenticated, messageController.deleteMessage);

module.exports = router;
