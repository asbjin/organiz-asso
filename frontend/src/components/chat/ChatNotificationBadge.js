import React, { useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import { useChat } from '../../contexts/ChatContext';

const ChatNotificationBadge = () => {
  const { unreadTotal, fetchConversations } = useChat();
  
  // Rafraîchir les conversations périodiquement pour mettre à jour le compteur
  useEffect(() => {
    // Rafraîchir au montage
    fetchConversations();
    
    // Puis toutes les 30 secondes
    const interval = setInterval(() => {
      fetchConversations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchConversations]);
  
  if (!unreadTotal) {
    return null;
  }
  
  return (
    <Badge 
      bg="danger" 
      pill 
      className="position-absolute top-0 start-100 translate-middle"
      style={{ fontSize: '0.6rem', padding: '0.25em 0.6em' }}
    >
      {unreadTotal > 99 ? '99+' : unreadTotal}
    </Badge>
  );
};

export default ChatNotificationBadge; 