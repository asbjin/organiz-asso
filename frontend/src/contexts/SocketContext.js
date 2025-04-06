import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { currentUser } = useAuth();
  // Utiliser useRef pour conserver les messages déjà envoyés entre les rendus
  const sentMessagesRef = useRef(new Set());

  useEffect(() => {
    let newSocket = null;
    
    // Initialiser la connexion socket uniquement si l'utilisateur est connecté
    if (currentUser) {
      try {
        newSocket = io('http://localhost:5000', {
          withCredentials: true,
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

        newSocket.on('error', (error) => {
          console.error('Erreur WebSocket:', error);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du socket:', error);
        setSocket(null);
        setConnected(false);
      }
    } else {
      // Si l'utilisateur n'est pas connecté, réinitialiser le socket
      setSocket(null);
      setConnected(false);
    }

    // Nettoyer la connexion lors du démontage du composant
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser]);

  // Fonctions pour interagir avec les WebSockets
  const joinForum = (forumId) => {
    if (socket && connected && forumId) {
      // Vérifier que l'ID du forum est valide (24 caractères hex)
      if (typeof forumId === 'string' && /^[0-9a-fA-F]{24}$/.test(forumId)) {
        console.log(`Rejoindre le forum: ${forumId}`);
        socket.emit('join_forum', forumId);
      } else {
        console.warn(`Tentative de rejoindre un forum avec un ID invalide: ${forumId}`);
      }
    }
  };

  const leaveForum = (forumId) => {
    if (socket && connected && forumId) {
      // Vérifier que l'ID du forum est valide (24 caractères hex)
      if (typeof forumId === 'string' && /^[0-9a-fA-F]{24}$/.test(forumId)) {
        console.log(`Quitter le forum: ${forumId}`);
        socket.emit('leave_forum', forumId);
      } else {
        console.warn(`Tentative de quitter un forum avec un ID invalide: ${forumId}`);
      }
    }
  };

  const sendMessage = (messageData) => {
    if (socket && connected && messageData) {
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
    }
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
