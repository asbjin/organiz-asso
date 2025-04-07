const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Routes protégées pour tous les membres
router.get('/', isAuthenticated, forumController.getAllForums);

// Route pour l'autocomplétion des noms de forums
router.get('/autocomplete', isAuthenticated, forumController.autocompleteForums);

// Route de test sans authentification pour la recherche
// Cette route capture les informations d'authentification si disponibles
// mais ne bloque pas les requêtes non authentifiées
router.get('/test-search', async (req, res, next) => {
  try {
    // Essayer d'extraire les informations d'authentification
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token trouvé dans la requête test');
      // Note: Nous pourrions vérifier le token ici et l'assigner à req.user
      // Mais pour le test, nous continuons sans bloquer
    }
    
    // Passer au contrôleur
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans bloquer
    console.error('Erreur dans le middleware de test-search:', error);
    next();
  }
}, forumController.searchForums);

// Route pour rechercher des forums - doit être avant /:id
router.get('/search', isAuthenticated, forumController.searchForums);

// Route spécifique pour les admins qui retourne tous les forums y compris les privés
router.get('/admin-search', isAuthenticated, isAdmin, forumController.searchAllForums);

// Routes spécifiques par ID (doit être après /autocomplete et /search)
router.get('/:id', isAuthenticated, forumController.getForumById);

// Routes protégées pour les administrateurs
router.post('/', isAuthenticated, isAdmin, forumController.createForum);
router.put('/:id', isAuthenticated, isAdmin, forumController.updateForum);
router.delete('/:id', isAuthenticated, isAdmin, forumController.deleteForum);

module.exports = router;
