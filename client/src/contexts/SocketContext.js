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
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(5);
  const pingIntervalRef = useRef(null); // Référence pour l'intervalle ping/pong

  useEffect(() => {
    let socketInstance = null;
    
    // Fonction pour limiter les tentatives de reconnexion
    const connectSocket = () => {
      // Limiter les tentatives de reconnexion
      if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
        console.error('Nombre maximal de tentatives de reconnexion atteint');
        return;
      }
      
      if (isAuthenticated && currentUser) {
        console.log('Tentative de connexion WebSocket avec l\'utilisateur:', 
                   currentUser.username, currentUser.id);
                   
        // Ne créer une nouvelle instance que si nécessaire
        if (!socketInstance) {
          socketInstance = io('http://localhost:5000', {
            withCredentials: true,
            reconnection: false, // Désactiver la reconnexion automatique
            auth: {
              token: localStorage.getItem('authToken') // Ajout du token dans la connexion
            },
            extraHeaders: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}` // Utilisation d'un header standard
            }
          });
          
          // Gestionnaires d'événements pour la connexion socket
          socketInstance.on('connect', () => {
            console.log('Socket connecté avec ID:', socketInstance.id);
            setConnected(true);
            reconnectAttemptsRef.current = 0;
            
            // Authentifier le socket après connexion
            socketInstance.emit('authenticate', {
              userId: currentUser.id,
              username: currentUser.username
            });
          });
          
          // Recevoir la confirmation d'authentification
          socketInstance.on('authenticated', (response) => {
            console.log('Authentification WebSocket:', response);
          });
          
          socketInstance.on('connect_error', (err) => {
            console.error('Erreur de connexion socket:', err);
            reconnectAttemptsRef.current++;
            setConnected(false);
          });
          
          socketInstance.on('disconnect', (reason) => {
            console.log('Socket déconnecté:', reason);
            setConnected(false);
          });
          
          socketInstance.on('pong', () => {
            console.log('Pong reçu du serveur');
          });
          
          setSocket(socketInstance);
          socketRef.current = socketInstance;
        }
      } else if (socketInstance) {
        // Déconnexion si l'utilisateur n'est plus authentifié
        console.log('Déconnexion WebSocket (utilisateur non authentifié)');
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setConnected(false);
      }
    };
    
    connectSocket();
    
    // Nettoyage
    return () => {
      // Nettoyer l'intervalle de ping
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Nettoyer la connexion socket
      if (socketInstance) {
        console.log('Nettoyage de la connexion WebSocket');
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, [isAuthenticated, currentUser]);

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
