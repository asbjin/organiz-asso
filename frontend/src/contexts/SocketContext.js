import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();
  // Utiliser useRef pour conserver les messages déjà envoyés entre les rendus
  const sentMessagesRef = useRef(new Set());
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fonction pour établir la connexion WebSocket
  const establishConnection = () => {
    // Ne pas initialiser le socket si l'utilisateur n'est pas authentifié
    if (!isAuthenticated || !currentUser) {
      console.log('Pas de connexion WebSocket: utilisateur non authentifié');
      return;
    }

    // Récupérer le token actuel
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      console.log('Pas de connexion WebSocket: token manquant');
      return;
    }

    try {
      console.log('Initialisation du WebSocket avec l\'utilisateur:', currentUser.username);
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        auth: {
          token: authToken
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Événements de connexion
      newSocket.on('connect', () => {
        console.log('Connexion WebSocket établie');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Connexion WebSocket fermée');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Erreur de connexion WebSocket:', error.message);
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du socket:', error);
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  };

  useEffect(() => {
    // Nettoyer les anciennes tentatives de reconnexion
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Fermer la connexion existante si nécessaire
    if (socketRef.current) {
      console.log('Fermeture de la connexion WebSocket existante');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }

    // Si l'utilisateur est authentifié, établir une nouvelle connexion
    if (isAuthenticated && currentUser) {
      // Petit délai pour s'assurer que le token est bien défini dans localStorage
      reconnectTimeoutRef.current = setTimeout(() => {
        establishConnection();
      }, 500);
    }

    // Nettoyer la connexion lors du démontage du composant
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser, isAuthenticated]);

  // Fonctions pour interagir avec les WebSockets
  const joinForum = (forumId) => {
    if (!socket || !connected) {
      console.warn('Impossible de rejoindre le forum: WebSocket non connecté');
      return;
    }
    
    if (!forumId) {
      console.warn('Impossible de rejoindre le forum: ID du forum manquant');
      return;
    }
    
    // Vérifier que l'ID du forum est valide (24 caractères hex)
    if (typeof forumId === 'string' && /^[0-9a-fA-F]{24}$/.test(forumId)) {
      console.log(`Rejoindre le forum: ${forumId}`);
      socket.emit('join_forum', forumId);
    } else {
      console.warn(`Tentative de rejoindre un forum avec un ID invalide: ${forumId}`);
    }
  };

  const leaveForum = (forumId) => {
    if (!socket || !connected) {
      console.warn('Impossible de quitter le forum: WebSocket non connecté');
      return;
    }
    
    if (!forumId) {
      console.warn('Impossible de quitter le forum: ID du forum manquant');
      return;
    }
    
    // Vérifier que l'ID du forum est valide (24 caractères hex)
    if (typeof forumId === 'string' && /^[0-9a-fA-F]{24}$/.test(forumId)) {
      console.log(`Quitter le forum: ${forumId}`);
      socket.emit('leave_forum', forumId);
    } else {
      console.warn(`Tentative de quitter un forum avec un ID invalide: ${forumId}`);
    }
  };

  const sendMessage = (messageData) => {
    if (!socket || !connected) {
      console.warn('Impossible d\'envoyer le message: WebSocket non connecté');
      return;
    }
    
    if (!messageData) {
      console.warn('Impossible d\'envoyer le message: données du message manquantes');
      return;
    }
    
    // Vérifier si le message a un ID et s'il n'a pas déjà été envoyé
    if (messageData._id) {
      const messageKey = messageData._id;
      
      // Si le message a déjà été envoyé, ne pas l'envoyer à nouveau
      if (sentMessagesRef.current.has(messageKey)) {
        console.log('Message déjà envoyé, émission ignorée:', messageKey);
        return;
      }
      
      // Ajouter l'ID du message à la liste des messages envoyés
      sentMessagesRef.current.add(messageKey);
      
      // Limiter la taille de la liste des messages envoyés (garder les 100 derniers)
      if (sentMessagesRef.current.size > 100) {
        const iterator = sentMessagesRef.current.values();
        sentMessagesRef.current.delete(iterator.next().value);
      }
    }
    
    // Créer un objet simplifié pour éviter les structures circulaires
    const safeMessageData = {
      _id: messageData._id,
      content: messageData.content,
      createdAt: messageData.createdAt,
      forumId: messageData.forumId || messageData.forum,
      parentMessage: messageData.parentMessage || null,
      author: messageData.author ? {
        _id: messageData.author._id,
        username: messageData.author.username,
        profilePicture: messageData.author.profilePicture
      } : null
    };
    
    console.log('Émission de nouveau message:', safeMessageData);
    socket.emit('new_message', safeMessageData);
  };

  const value = {
    socket,
    connected,
    joinForum,
    leaveForum,
    sendMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
