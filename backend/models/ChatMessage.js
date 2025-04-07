const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String
  }]
});

// Index pour recherche par utilisateur
ChatMessageSchema.index({ sender: 1, receiver: 1 });
ChatMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema); 