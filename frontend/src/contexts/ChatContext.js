import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const { currentUser, isAuthenticated } = useAuth();
  
  // État pour stocker les conversations
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  // Référence pour le verrouillage des appels API
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  // Récupérer la liste des conversations
  const fetchConversations = async () => {
    // Garde contre les appels multiples et simultanés
    if (isFetchingRef.current || !isAuthenticated) return;
    
    // Vérifier le délai minimum entre les appels (10 secondes)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 10000) {
      console.log('Délai minimum entre appels non atteint, requête ignorée');
      return;
    }
    
    try {
      // Verrouiller pour empêcher les appels parallèles
      isFetchingRef.current = true;
      
      // Mettre loading à true seulement si pas de conversations
      const shouldShowLoading = conversations.length === 0;
      if (shouldShowLoading) setLoading(true);
      
      console.log('Chargement des conversations...');
      const response = await axios.get('http://localhost:5000/api/chat/conversations', {
        withCredentials: true
      });
      
      // Mettre à jour le timestamp du dernier appel réussi
      lastFetchTimeRef.current = Date.now();
      
      // Mettre à jour les données
      setConversations(response.data);
      
      // Calculer le nombre total de messages non lus
      const total = response.data.reduce((acc, conv) => acc + conv.unreadCount, 0);
      setUnreadTotal(total);
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des conversations:', err);
      setError(err.response?.data?.message || 'Erreur lors de la récupération des conversations');
    } finally {
      // Déverrouiller pour permettre de futures requêtes
      isFetchingRef.current = false;
      if (conversations.length === 0) setLoading(false);
    }
  };
  
  // Récupérer les messages d'une conversation
  const fetchMessages = async (userId) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/chat/conversation/${userId}`, {
        withCredentials: true
      });
      
      setMessages(response.data);
      setActiveConversation(userId);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des messages:', err);
      setError(err.response?.data?.message || 'Erreur lors de la récupération des messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Envoyer un message
  const sendMessage = async (receiverId, content) => {
    if (!isAuthenticated || !receiverId || !content) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/chat/send', {
        receiverId,
        content
      }, {
        withCredentials: true
      });
      
      // Ajouter le message à la liste des messages
      setMessages(prev => [...prev, response.data.data]);
      
      // Envoyer le message via WebSocket pour une mise à jour en temps réel
      if (socket && connected) {
        socket.emit('private_message', {
          receiverId,
          content,
          messageId: response.data.data._id
        });
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du message');
      throw err;
    }
  };
  
  // Marquer un message comme lu
  const markMessageAsRead = async (messageId) => {
    if (!isAuthenticated || !messageId) return;
    
    try {
      await axios.put(`http://localhost:5000/api/chat/read/${messageId}`, {}, {
        withCredentials: true
      });
      
      // Mettre à jour l'état local du message
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true, readAt: new Date() } : msg
      ));
      
      // Mettre à jour les compteurs de messages non lus localement plutôt que de récupérer toutes les conversations
      if (activeConversation) {
        // Réduire le nombre total de messages non lus
        setUnreadTotal(prev => Math.max(0, prev - 1));
        
        // Mettre à jour le compteur pour cette conversation spécifique
        setConversations(prev => prev.map(conv => 
          conv.user._id === activeConversation 
            ? { ...conv, unreadCount: Math.max(0, (conv.unreadCount || 0) - 1) } 
            : conv
        ));
      }
      
    } catch (err) {
      console.error('Erreur lors du marquage du message comme lu:', err);
    }
  };
  
  // Supprimer un message
  const deleteMessage = async (messageId) => {
    if (!isAuthenticated || !messageId) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/chat/${messageId}`, {
        withCredentials: true
      });
      
      // Supprimer le message de l'état local
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
    } catch (err) {
      console.error('Erreur lors de la suppression du message:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du message');
    }
  };
  
  // Écouter les nouveaux messages via WebSocket
  useEffect(() => {
    if (!socket || !connected || !isAuthenticated || !currentUser) return;
    
    // Authentifier le socket
    socket.emit('authenticate', {
      userId: currentUser.id,
      username: currentUser.username
    });
    
    // Écouter les nouveaux messages privés
    const handlePrivateMessage = (data) => {
      console.log('Nouveau message privé reçu:', data);
      
      // Si c'est le même expéditeur que la conversation active, ajouter le message
      if (activeConversation && data.senderId === activeConversation) {
        // Construire un objet message compatible avec notre format
        const newMessage = {
          _id: data.messageId,
          content: data.content,
          sender: {
            _id: data.senderId,
            username: data.senderUsername
          },
          receiver: {
            _id: currentUser.id,
            username: currentUser.username
          },
          createdAt: data.timestamp,
          read: false
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Marquer automatiquement comme lu si la conversation est active
        markMessageAsRead(data.messageId);
      } else {
        // Si la conversation n'est pas active, seulement mettre à jour le compteur de non-lus
        // au lieu de refaire une requête complète
        setUnreadTotal(prev => prev + 1);
      }
    };
    
    // Écouter les événements de frappe
    const handleUserTyping = (data) => {
      // Mettre à jour l'état de frappe pour l'utilisateur concerné
      if (activeConversation && data.userId === activeConversation) {
        // Ici vous pouvez ajouter un état pour gérer l'indication de frappe
        console.log(`${data.username} est en train d'écrire...`, data.isTyping);
      }
    };
    
    socket.on('private_message', handlePrivateMessage);
    socket.on('user_typing', handleUserTyping);
    
    // Nettoyage lors du démontage du composant
    return () => {
      socket.off('private_message', handlePrivateMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, connected, isAuthenticated, currentUser, activeConversation, markMessageAsRead]);
  
  // Charger les conversations au montage et quand l'état d'authentification change
  useEffect(() => {
    // Utiliser une référence pour éviter l'appel si démonté
    let isMounted = true;
    
    // Eviter les appels multiples avec un timer
    const timer = setTimeout(() => {
      if (isAuthenticated && isMounted) {
        fetchConversations();
      }
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isAuthenticated]);  // Ne pas ajouter fetchConversations comme dépendance
  
  // Envoyer l'événement "typing" lorsque l'utilisateur est en train d'écrire
  const sendTypingStatus = (receiverId, isTyping) => {
    if (!socket || !connected || !isAuthenticated) return;
    
    socket.emit('typing', { receiverId, isTyping });
  };
  
  const value = {
    conversations,
    messages,
    loading,
    error,
    unreadTotal,
    activeConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    setActiveConversation,
    sendTypingStatus
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 