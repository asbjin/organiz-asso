import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useChat } from '../../contexts/ChatContext';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BsSend, BsThreeDots } from 'react-icons/bs';

const ConversationView = ({ userId }) => {
  const { 
    messages, 
    loading, 
    error, 
    fetchMessages, 
    sendMessage, 
    sendTypingStatus,
    setActiveConversation,
    markMessageAsRead
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousUserIdRef = useRef(null);
  const hasInitialLoadRef = useRef(false);
  
  // Créer une fonction stable pour charger les messages avec limitation d'appels
  const loadMessagesAndSetActive = useCallback(async (id) => {
    if (!id) return;
    
    const now = Date.now();
    // Empêcher les chargements pendant qu'un autre est en cours
    if (isLoadingMessages) {
      console.log('Chargement des messages déjà en cours, ignoré');
      return;
    }
    
    // N'actualiser que si c'est un nouvel ID ou après 15 secondes pour le même ID
    if (previousUserIdRef.current !== id || now - lastFetchTime > 15000) {
      try {
        setIsLoadingMessages(true);
        console.log(`Chargement des messages pour l'utilisateur: ${id}`);
        
        await fetchMessages(id);
        setActiveConversation(id);
        previousUserIdRef.current = id;
        
        // Marquer comme initialisé si c'est le premier chargement
        if (!hasInitialLoadRef.current) {
          hasInitialLoadRef.current = true;
        }
      } catch (err) {
        console.error('Erreur lors du chargement des messages:', err);
      } finally {
        setLastFetchTime(now);
        setIsLoadingMessages(false);
      }
    } else {
      console.log('Chargement des messages ignoré - même utilisateur et délai insuffisant');
    }
  }, [fetchMessages, setActiveConversation, lastFetchTime, isLoadingMessages]);
  
  // Charger les messages au montage et quand userId change
  useEffect(() => {
    // Si aucun ID n'est fourni, ne pas charger
    if (!userId) return;
    
    // Si l'ID est le même que précédemment et qu'on a chargé récemment, ne pas recharger
    if (userId === previousUserIdRef.current && Date.now() - lastFetchTime < 10000) {
      return;
    }
    
    // Ajouter un délai pour empêcher les appels trop fréquents
    const timer = setTimeout(() => {
      loadMessagesAndSetActive(userId);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // Nettoyer le timeout de frappe lors du démontage
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, loadMessagesAndSetActive]);
  
  // Faire défiler automatiquement vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Marquer automatiquement les messages comme lus lorsqu'ils s'affichent
  useEffect(() => {
    if (!messages.length || !userId) return;
    
    // Filtrer les messages non lus reçus (où l'expéditeur est l'userId actuel)
    const unreadMessages = messages.filter(
      msg => !msg.read && msg.sender._id === userId
    );
    
    // Marquer chaque message non lu comme lu
    if (unreadMessages.length > 0) {
      console.log(`Marquage de ${unreadMessages.length} message(s) comme lu(s)`);
      
      unreadMessages.forEach(message => {
        markMessageAsRead(message._id);
      });
    }
  }, [messages, userId, markMessageAsRead]);
  
  const formatMessageTime = (date) => {
    if (!date) return '';
    
    return formatDistance(new Date(date), new Date(), { 
      addSuffix: false,
      locale: fr
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;
    
    try {
      setSending(true);
      await sendMessage(userId, newMessage.trim());
      setNewMessage('');
      
      // Indiquer que l'utilisateur n'est plus en train de taper
      sendTypingStatus(userId, false);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
    } finally {
      setSending(false);
    }
  };
  
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Envoyer l'événement "typing" lors de la frappe
    sendTypingStatus(userId, true);
    
    // Annuler le timeout précédent s'il existe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Créer un nouveau timeout pour indiquer la fin de la frappe après 1.5s
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(userId, false);
    }, 1500);
  };
  
  if (!userId) {
    return (
      <Card className="conversation-view h-100">
        <Card.Body className="d-flex flex-column justify-content-center align-items-center text-muted">
          <p>Sélectionnez une conversation pour commencer à discuter.</p>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className="conversation-view h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          {messages.length > 0 && messages[0].sender._id === userId
            ? messages[0].sender.username
            : messages.length > 0 && messages[0].receiver._id === userId
              ? messages[0].receiver.username
              : 'Conversation'}
        </h5>
        <Button variant="link" className="p-0">
          <BsThreeDots size={20} />
        </Button>
      </Card.Header>
      <Card.Body className="messages-container p-3">
        {loading && messages.length === 0 ? (
          <div className="d-flex justify-content-center my-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted py-4">
            Aucun message pour le moment. Commencez la conversation !
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => {
              const isSentByMe = message.sender._id !== userId;
              
              return (
                <div 
                  key={message._id} 
                  className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-info">
                    <small className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </small>
                    {isSentByMe && (
                      <small className="message-status">
                        {message.read ? 'Lu' : 'Envoyé'}
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card.Body>
      <Card.Footer className="p-2">
        <Form onSubmit={handleSubmit}>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={handleInputChange}
              disabled={sending}
              className="message-input me-2"
            />
            <Button 
              type="submit" 
              variant="primary" 
              disabled={sending || !newMessage.trim()}
              className="send-button"
            >
              {sending ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                <BsSend />
              )}
            </Button>
          </div>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default ConversationView; 