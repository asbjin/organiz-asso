const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Routes protégées pour tous les membres
router.get('/profile/:id', isAuthenticated, userController.getUserById);
router.put('/profile/:id', isAuthenticated, userController.updateUser);

// Routes protégées pour les administrateurs
router.get('/', isAuthenticated, isAdmin, userController.getAllUsers);
router.get('/pending', isAuthenticated, isAdmin, userController.getPendingUsers);
router.put('/validate/:id', isAuthenticated, isAdmin, userController.validateUser);
router.put('/role/:id', isAuthenticated, isAdmin, userController.changeUserRole);

// Route pour l'autocomplétion des noms d'utilisateurs
router.get('/autocomplete', isAuthenticated, userController.autocompleteUsers);

// Route de test sans authentification pour la recherche
router.get('/test-search', userController.searchUsers);

// Route pour rechercher des utilisateurs
router.get('/search', isAuthenticated, userController.searchUsers);

module.exports = router;
