import axios from 'axios';
import {
  GET_MESSAGES,
  GET_MESSAGE,
  CREATE_MESSAGE,
  REPLY_TO_MESSAGE,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  MESSAGE_ERROR,
  SEARCH_MESSAGES,
  SET_LOADING,
  CLEAR_LOADING,
  SET_ERROR,
  CLEAR_ERROR,
} from './types';

// Configuration de base pour axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Obtenir tous les messages d'un forum
export const getMessages = (forumId) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'messages' });
    dispatch({ type: CLEAR_ERROR });

    const res = await axios.get(`${API_URL}/forums/${forumId}/messages`);

    dispatch({
      type: GET_MESSAGES,
      payload: res.data,
    });

    dispatch({ type: CLEAR_LOADING });
  } catch (err) {
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors du chargement des messages',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors du chargement des messages',
        statusCode: err.response?.status,
        id: 'GET_MESSAGES_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
  }
};

// Obtenir un message spécifique
export const getMessage = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'message' });
    dispatch({ type: CLEAR_ERROR });

    const res = await axios.get(`${API_URL}/messages/${messageId}`);

    dispatch({
      type: GET_MESSAGE,
      payload: res.data,
    });

    dispatch({ type: CLEAR_LOADING });
  } catch (err) {
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors du chargement du message',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors du chargement du message',
        statusCode: err.response?.status,
        id: 'GET_MESSAGE_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
  }
};

// Créer un nouveau message
export const createMessage = (forumId, formData) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'createMessage' });
    dispatch({ type: CLEAR_ERROR });

    const res = await axios.post(`${API_URL}/forums/${forumId}/messages`, formData);

    dispatch({
      type: CREATE_MESSAGE,
      payload: res.data,
    });

    dispatch({ type: CLEAR_LOADING });
    return res.data;
  } catch (err) {
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors de la création du message',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors de la création du message',
        statusCode: err.response?.status,
        id: 'CREATE_MESSAGE_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
    throw err;
  }
};

// Répondre à un message
export const replyToMessage = (messageId, formData) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'replyToMessage' });
    dispatch({ type: CLEAR_ERROR });

    const res = await axios.post(`${API_URL}/messages/${messageId}/replies`, formData);

    dispatch({
      type: REPLY_TO_MESSAGE,
      payload: res.data,
    });

    dispatch({ type: CLEAR_LOADING });
    return res.data;
  } catch (err) {
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors de la réponse au message',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors de la réponse au message',
        statusCode: err.response?.status,
        id: 'REPLY_MESSAGE_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
    throw err;
  }
};

// Mettre à jour un message
export const updateMessage = (messageId, formData) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'updateMessage' });
    dispatch({ type: CLEAR_ERROR });

    const res = await axios.put(`${API_URL}/messages/${messageId}`, formData);

    dispatch({
      type: UPDATE_MESSAGE,
      payload: res.data,
    });

    dispatch({ type: CLEAR_LOADING });
    return res.data;
  } catch (err) {
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors de la mise à jour du message',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors de la mise à jour du message',
        statusCode: err.response?.status,
        id: 'UPDATE_MESSAGE_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
    throw err;
  }
};

// Supprimer un message
export const deleteMessage = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'deleteMessage' });
    dispatch({ type: CLEAR_ERROR });

    await axios.delete(`${API_URL}/messages/${messageId}`);

    dispatch({
      type: DELETE_MESSAGE,
      payload: messageId,
    });

    dispatch({ type: CLEAR_LOADING });
  } catch (err) {
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors de la suppression du message',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors de la suppression du message',
        statusCode: err.response?.status,
        id: 'DELETE_MESSAGE_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
  }
};

// Rechercher des messages
export const searchMessages = (searchParams) => async (dispatch) => {
  try {
    dispatch({ type: SET_LOADING, payload: 'searchMessages' });
    dispatch({ type: CLEAR_ERROR });

    // Construire les paramètres de requête
    const params = new URLSearchParams();
    
    // Paramètres de base
    if (searchParams.keywords) {
      params.append('keyword', searchParams.keywords);
    }
    
    if (searchParams.author) {
      params.append('author', searchParams.author);
    }
    
    if (searchParams.forumId) {
      params.append('forumId', searchParams.forumId);
    }
    
    if (searchParams.startDate) {
      params.append('startDate', searchParams.startDate);
    }
    
    if (searchParams.endDate) {
      params.append('endDate', searchParams.endDate);
    }
    
    // Paramètres de tri
    if (searchParams.sortBy) {
      params.append('sortBy', searchParams.sortBy);
    }
    
    if (searchParams.sortOrder) {
      params.append('sortOrder', searchParams.sortOrder);
    }
    
    // Mode de recherche (une seul mot, tout les mots, phrase exacte)
    if (searchParams.searchMode) {
      params.append('searchMode', searchParams.searchMode);
    }
    
    // Construire l'URL avec les paramètres
    const searchUrl = `http://localhost:5000/api/messages/test-search?${params.toString()}`;
    console.log('URL de recherche:', searchUrl);

    const res = await axios.get(searchUrl);

    dispatch({
      type: SEARCH_MESSAGES,
      payload: res.data,
    });

    dispatch({ type: CLEAR_LOADING });
    return res.data;
  } catch (err) {
    console.error('Erreur lors de la recherche:', err);
    
    dispatch({
      type: MESSAGE_ERROR,
      payload: {
        msg: err.response?.data?.message || 'Erreur lors de la recherche de messages',
        status: err.response?.status,
      },
    });

    dispatch({
      type: SET_ERROR,
      payload: {
        message: err.response?.data?.message || 'Erreur lors de la recherche de messages',
        statusCode: err.response?.status,
        id: 'SEARCH_MESSAGES_ERROR',
      },
    });

    dispatch({ type: CLEAR_LOADING });
    throw err;
  }
}; 