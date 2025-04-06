import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Récupère la liste de tous les forums
 * @returns {Promise<Array>} Liste des forums
 */
export const getForums = async () => {
  try {
    const response = await axios.get(`${API_URL}/forums`, { 
      withCredentials: true,
      timeout: 10000 // timeout de 10 secondes
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des forums:', error);
    throw error;
  }
};

/**
 * Récupère un forum spécifique par son ID
 * @param {string} forumId - ID du forum à récupérer
 * @returns {Promise<Object>} Données du forum
 */
export const getForumById = async (forumId) => {
  try {
    const response = await axios.get(`${API_URL}/forums/${forumId}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du forum ${forumId}:`, error);
    throw error;
  }
};

/**
 * Récupère tous les messages d'un forum
 * @param {string} forumId - ID du forum
 * @returns {Promise<Array>} Liste des messages du forum
 */
export const getForumMessages = async (forumId) => {
  try {
    const response = await axios.get(`${API_URL}/messages/forum/${forumId}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des messages du forum ${forumId}:`, error);
    throw error;
  }
};

/**
 * Crée un nouveau message dans un forum
 * @param {Object} messageData - Données du message à créer (content, forumId)
 * @returns {Promise<Object>} Message créé
 */
export const createForumMessage = async (messageData) => {
  try {
    const response = await axios.post(`${API_URL}/messages`, messageData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    throw error;
  }
};

/**
 * Répond à un message existant
 * @param {string} messageId - ID du message parent
 * @param {Object} replyData - Données de la réponse
 * @returns {Promise<Object>} Réponse créée
 */
export const replyToMessage = async (messageId, replyData) => {
  try {
    const response = await axios.post(`${API_URL}/messages/${messageId}/replies`, replyData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la réponse au message ${messageId}:`, error);
    throw error;
  }
};

/**
 * Supprime un message
 * @param {string} messageId - ID du message à supprimer
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  try {
    await axios.delete(`${API_URL}/messages/${messageId}`, { 
      withCredentials: true 
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression du message ${messageId}:`, error);
    throw error;
  }
};

export default {
  getForums,
  getForumById,
  getForumMessages,
  createForumMessage,
  replyToMessage,
  deleteMessage
}; 