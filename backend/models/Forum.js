const mongoose = require('mongoose');

const ForumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['open', 'closed'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Ajouter des index texte pour la recherche
ForumSchema.index({ name: 'text', description: 'text' });

// Index régulier pour les recherches par nom
ForumSchema.index({ name: 1 });
ForumSchema.index({ type: 1 });

module.exports = mongoose.model('Forum', ForumSchema);
