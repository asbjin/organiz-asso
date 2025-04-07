import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConversationsList from '../components/chat/ConversationsList';
import ConversationView from '../components/chat/ConversationView';
import './ChatPage.css';

const ChatPage = () => {
  const { userId } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  useEffect(() => {
    // Si nous avons un userId dans les paramètres, utiliser celui-là
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [userId]);
  
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  const handleSelectConversation = (userId) => {
    setSelectedUserId(userId);
    navigate(`/chat/${userId}`);
  };
  
  if (authLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          Vous devez être connecté pour accéder à cette page.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid className="chat-container py-4">
      <Row className="chat-wrapper">
        <Col md={4} lg={3} className="conversations-column">
          <ConversationsList 
            onSelectConversation={handleSelectConversation} 
          />
        </Col>
        <Col md={8} lg={9} className="conversation-column">
          <ConversationView userId={selectedUserId} />
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage; 