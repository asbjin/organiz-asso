import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  // Utiliser useRef pour conserver les messages déjà envoyés entre les rendus
  const sentMessagesRef = useRef(new Set());
  // Référence pour suivre les tentatives de reconnexion
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

  useEffect(() => {
    let newSocket = null;
    
    // Initialiser la connexion socket uniquement si l'utilisateur est connecté et que le chargement d'authentification est terminé
    if (currentUser && !authLoading) {
      try {
        console.log(`Tentative de connexion WebSocket à ${WS_URL}`);
        newSocket = io(WS_URL, {
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          timeout: 10000 // augmenter le timeout à 10 secondes
        });

        // Événements de connexion
        newSocket.on('connect', () => {
          console.log('Connexion WebSocket établie');
          setConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0; // Réinitialiser le compteur de tentatives
        });

        newSocket.on('disconnect', () => {
          console.log('Connexion WebSocket fermée');
          setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Erreur de connexion WebSocket:', err.message);
          reconnectAttemptsRef.current++;
          
          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            setError('Impossible de se connecter au serveur WebSocket après plusieurs tentatives');
            newSocket.disconnect(); // Arrêter les tentatives après le maximum d'essais
          }
        });

        newSocket.on('error', (error) => {
          console.error('Erreur WebSocket:', error);
          setError(`Erreur de socket: ${error.message || 'Erreur inconnue'}`);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du socket:', error);
        setSocket(null);
        setConnected(false);
        setError(`Erreur d'initialisation: ${error.message || 'Erreur inconnue'}`);
      }
    } else {
      // Si l'utilisateur n'est pas connecté ou si l'authentification est en cours, réinitialiser le socket
      setSocket(null);
      setConnected(false);
    }

    // Nettoyer la connexion lors du démontage du composant
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser, authLoading, WS_URL]);

  // Fonctions pour interagir avec les WebSockets
  const joinForum = (forumId) => {
    if (!socket || !connected) {
      console.warn('Tentative de rejoindre un forum sans connexion socket active');
      return;
    }
    
    if (!forumId) {
      console.warn('ID de forum manquant');
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
      console.warn('Tentative de quitter un forum sans connexion socket active');
      return;
    }
    
    if (!forumId) {
      console.warn('ID de forum manquant');
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
      console.warn('Tentative d\'envoi de message sans connexion socket active');
      return;
    }
    
    if (!messageData) {
      console.warn('Données de message manquantes');
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
    
    console.log('Émission de nouveau message:', messageData);
    socket.emit('new_message', messageData);
  };

  // Fonction pour réinitialiser la connexion WebSocket
  const resetConnection = () => {
    if (socket) {
      socket.disconnect();
      reconnectAttemptsRef.current = 0;
      setError(null);
      
      // Recréer une nouvelle connexion si l'utilisateur est connecté
      if (currentUser) {
        const newSocket = io(WS_URL, {
          withCredentials: true,
          reconnection: true,
          timeout: 10000
        });
        
        newSocket.on('connect', () => {
          console.log('Connexion WebSocket rétablie');
          setConnected(true);
          setError(null);
        });
        
        setSocket(newSocket);
      }
    }
  };

  const value = {
    socket,
    connected,
    error,
    joinForum,
    leaveForum,
    sendMessage,
    resetConnection
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
