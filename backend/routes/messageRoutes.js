// Récupérer tous les messages d'un forum
router.get('/forum/:forumId', authenticateToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const messages = await Message.find({ 
      forum: forumId,
      parentMessage: null // Seulement les messages principaux (pas les réponses)
    })
    .sort({ createdAt: -1 }) // Tri par date décroissante
    .populate('author', 'username profilePicture');
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint pour compter les messages dans un forum
router.get('/forum/:forumId/count', authenticateToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const count = await Message.countDocuments({ 
      forum: forumId,
      parentMessage: null // Seulement les messages principaux (pas les réponses)
    });
    
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}); 