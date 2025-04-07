const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Routes protégées pour tous les membres
router.get('/', isAuthenticated, forumController.getAllForums);

// Route pour l'autocomplétion des noms de forums
router.get('/autocomplete', isAuthenticated, forumController.autocompleteForums);

// Routes spécifiques par ID (doit être après /autocomplete)
router.get('/:id', isAuthenticated, forumController.getForumById);

// Routes protégées pour les administrateurs
router.post('/', isAuthenticated, isAdmin, forumController.createForum);
router.put('/:id', isAuthenticated, isAdmin, forumController.updateForum);
router.delete('/:id', isAuthenticated, isAdmin, forumController.deleteForum);

module.exports = router;
