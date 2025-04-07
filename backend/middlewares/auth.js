const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier si l'utilisateur est authentifié
exports.isAuthenticated = async (req, res, next) => {
  try {
    // Récupérer le token JWT depuis les cookies ou l'en-tête Authorization
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    console.log('Auth - Method:', req.method, 'URL:', req.originalUrl);
    console.log('Auth - Cookies:', req.cookies);
    console.log('Auth - Headers Auth:', req.headers.authorization);
    console.log('Auth - Token trouvé:', token ? 'Oui' : 'Non');

    if (!token) {
      console.log('Auth - Accès refusé: Aucun token trouvé');
      return res.status(401).json({
        message: 'Vous devez être connecté pour accéder à cette ressource.'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Récupérer l'utilisateur depuis la base de données
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          message: 'L\'utilisateur associé à ce token n\'existe pas.'
        });
      }
      
      // Vérifier si le compte est actif
      if (user.status !== 'active') {
        return res.status(403).json({
          message: 'Votre compte n\'est pas actif. Veuillez contacter un administrateur.'
        });
      }
      
      // Ajouter l'utilisateur à l'objet req
      req.user = user;
      
      next();
    } catch (error) {
      // Si le token est expiré
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Votre session a expiré. Veuillez vous reconnecter.'
        });
      }
      
      // Si le token est invalide
      return res.status(401).json({
        message: 'Token invalide. Veuillez vous reconnecter.'
      });
    }
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de l\'authentification.',
      error: error.message
    });
  }
};

// Middleware pour vérifier si l'utilisateur est administrateur
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }
  
  if (req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }
};

// Middleware pour vérifier si l'utilisateur est le propriétaire de la ressource ou un administrateur
exports.isOwnerOrAdmin = (resourceModel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        console.log('Accès refusé: utilisateur non authentifié');
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
      }
      
      // Récupérer l'ID de la ressource à partir des paramètres de la route
      const resourceId = req.params.messageId || req.params.forumId || req.params.id;
      
      if (!resourceId) {
        console.log('Erreur: ID de ressource manquant dans les paramètres de la requête');
        return res.status(400).json({ message: 'ID de ressource manquant.' });
      }
      
      try {
        // Vérifie si l'ID est un ObjectId MongoDB valide
        if (!resourceId.match(/^[0-9a-fA-F]{24}$/)) {
          console.log(`ID de ressource invalide: ${resourceId}`);
          return res.status(400).json({ message: 'ID de ressource invalide.' });
        }
        
        const resource = await resourceModel.findById(resourceId);
        
        if (!resource) {
          console.log(`Ressource ${resourceId} non trouvée`);
          return res.status(404).json({ message: 'Ressource non trouvée.' });
        }
        
        // Vérifier si l'utilisateur est le propriétaire ou un administrateur
        const isOwner = (
          (resource.author && resource.author.toString() === req.user._id.toString()) ||
          (resource.createdBy && resource.createdBy.toString() === req.user._id.toString())
        );
        
        const isAdmin = (req.user.role === 'admin');
        
        if (isOwner || isAdmin) {
          console.log(`Accès autorisé à ${resourceId} pour ${req.user._id} (${isOwner ? 'propriétaire' : 'admin'})`);
          next();
        } else {
          console.log(`Accès refusé à ${resourceId} pour ${req.user._id} (ni propriétaire ni admin)`);
          return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à modifier cette ressource.' });
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de la ressource:', error);
        if (error.message && error.message.includes('ECONNREFUSED')) {
          return res.status(500).json({ 
            message: 'Connexion à la base de données impossible. Veuillez réessayer plus tard.',
            error: 'MONGODB_CONNECTION_ERROR'
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erreur d\'autorisation:', error);
      return res.status(500).json({ message: 'Erreur serveur lors de la vérification des autorisations.', error: error.message });
    }
  };
};
