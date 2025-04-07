import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Card, ListGroup, Badge, Spinner, Form, InputGroup, Button, Modal } from 'react-bootstrap';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { BsSearch, BsPlus, BsX, BsChat } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

const ConversationsList = ({ onSelectConversation }) => {
  const { conversations, loading, fetchConversations, activeConversation } = useChat();
  const navigate = useNavigate();
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitializedRef = useRef(false);
  
  // État pour le modal de nouvelle conversation
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Fonction debounce pour limiter les appels avec protection contre les appels multiples
  const debouncedFetchConversations = useCallback(() => {
    const now = Date.now();
    // Minimum 10 secondes entre rafraîchissements manuels 
    if (now - lastFetchTime > 10000 && !isRefreshing && !loading) {
      console.log('Rafraîchissement des conversations');
      setIsRefreshing(true);
      
      fetchConversations()
        .finally(() => {
          setLastFetchTime(now);
          setIsRefreshing(false);
        });
    } else {
      console.log('Rafraîchissement ignoré - délai insuffisant ou déjà en cours');
    }
  }, [fetchConversations, lastFetchTime, loading, isRefreshing]);
  
  // Un seul chargement initial des conversations
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Charger les conversations avec délai pour éviter les appels en cascade au démarrage
      const timer = setTimeout(() => {
        fetchConversations()
          .finally(() => {
            setLastFetchTime(Date.now());
            hasInitializedRef.current = true;
          });
      }, 1500);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [fetchConversations]);
  
  const formatDate = (date) => {
    if (!date) return '';
    
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: fr
    });
  };
  
  const handleSelectConversation = (userId) => {
    if (onSelectConversation) {
      onSelectConversation(userId);
    } else {
      navigate(`/chat/${userId}`);
    }
  };
  
  // Recherche d'utilisateurs pour le modal
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    setSearchError('');
    
    try {
      const response = await axios.get(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
        withCredentials: true
      });
      
      // Filtrer les utilisateurs qui ont déjà une conversation
      const existingUserIds = conversations.map(conv => conv.user._id);
      const filteredResults = response.data.filter(user => !existingUserIds.includes(user._id));
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', err);
      setSearchError('Impossible de charger les utilisateurs. Veuillez réessayer.');
    } finally {
      setSearchLoading(false);
    }
  }, [conversations]);
  
  // Effect pour la recherche avec debounce
  useEffect(() => {
    if (!showNewConversationModal) return;
    
    const searchTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);
    
    return () => clearTimeout(searchTimer);
  }, [searchQuery, searchUsers, showNewConversationModal]);
  
  // Réinitialiser la recherche quand le modal s'ouvre
  useEffect(() => {
    if (showNewConversationModal) {
      setSearchQuery('');
      setSearchResults([]);
      setSearchError('');
    }
  }, [showNewConversationModal]);
  
  const handleStartConversation = (userId) => {
    setShowNewConversationModal(false);
    handleSelectConversation(userId);
  };
  
  const renderUserItem = (user) => (
    <ListGroup.Item 
      key={user._id}
      action
      className="d-flex align-items-center"
      onClick={() => handleStartConversation(user._id)}
    >
      <div className="avatar-container me-2">
        <div className="avatar-placeholder">
          {user.username.charAt(0).toUpperCase()}
        </div>
        {user.lastLogin && (
          <div 
            className={`online-indicator ${new Date(user.lastLogin) > new Date(Date.now() - 10 * 60 * 1000) ? 'online' : 'offline'}`}
          />
        )}
      </div>
      <div>
        <div className="fw-bold">{user.username}</div>
        <small className="text-muted">
          {user.role === 'admin' ? 'Administrateur' : 'Membre'}
        </small>
      </div>
    </ListGroup.Item>
  );
  
  if (loading && conversations.length === 0) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  
  return (
    <>
      <Card className="conversations-list">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Conversations</h5>
            <div>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowNewConversationModal(true)}
                className="me-2"
              >
                <BsPlus /> Nouveau
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={debouncedFetchConversations}
                disabled={loading || isRefreshing || Date.now() - lastFetchTime < 10000}
              >
                {loading || isRefreshing ? <Spinner animation="border" size="sm" /> : 'Actualiser'}
              </Button>
            </div>
          </div>
          <InputGroup className="mt-2">
            <Form.Control
              placeholder="Rechercher une conversation..."
              aria-label="Rechercher"
            />
            <Button variant="outline-secondary">
              <BsSearch />
            </Button>
          </InputGroup>
        </Card.Header>
        <ListGroup variant="flush">
          {conversations.length === 0 ? (
            <ListGroup.Item className="text-center text-muted py-4">
              Aucune conversation pour le moment.
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setShowNewConversationModal(true)}
                >
                  <BsPlus /> Démarrer une conversation
                </Button>
              </div>
            </ListGroup.Item>
          ) : (
            conversations.map((conversation) => (
              <ListGroup.Item 
                key={conversation.user._id}
                action
                active={activeConversation === conversation.user._id}
                onClick={() => handleSelectConversation(conversation.user._id)}
                className="conversation-item"
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="avatar-container me-2">
                      <div className="avatar-placeholder">
                        {conversation.user.username.charAt(0).toUpperCase()}
                      </div>
                      {conversation.user.lastLogin && (
                        <div 
                          className={`online-indicator ${new Date(conversation.user.lastLogin) > new Date(Date.now() - 10 * 60 * 1000) ? 'online' : 'offline'}`}
                        />
                      )}
                    </div>
                    <div>
                      <div className="username">{conversation.user.username}</div>
                      <small className="text-muted last-message">
                        {conversation.lastMessage ? (
                          conversation.lastMessage.content.length > 30
                            ? conversation.lastMessage.content.substring(0, 30) + '...'
                            : conversation.lastMessage.content
                        ) : (
                          'Aucun message'
                        )}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end">
                    <small className="text-muted timestamp">
                      {conversation.lastMessage ? formatDate(conversation.lastMessage.createdAt) : ''}
                    </small>
                    {conversation.unreadCount > 0 && (
                      <Badge 
                        bg="primary" 
                        pill
                        className="unread-badge"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>

      {/* Modal pour créer une nouvelle conversation */}
      <Modal show={showNewConversationModal} onHide={() => setShowNewConversationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <BsChat className="me-2" />
            Nouvelle conversation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rechercher un utilisateur</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Entrez un nom d'utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setSearchQuery('')}
                  >
                    <BsX />
                  </Button>
                )}
                <Button variant="outline-primary">
                  <BsSearch />
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Entrez au moins 2 caractères pour rechercher.
              </Form.Text>
            </Form.Group>
          </Form>

          {searchError && <div className="alert alert-danger">{searchError}</div>}

          {searchLoading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Recherche en cours...</p>
            </div>
          ) : (
            <>
              {searchQuery.length >= 2 && (
                <div className="mb-2">
                  {searchResults.length > 0 ? (
                    <small>{searchResults.length} utilisateur(s) trouvé(s)</small>
                  ) : (
                    <small>Aucun utilisateur trouvé</small>
                  )}
                </div>
              )}

              <ListGroup>
                {searchResults.map(renderUserItem)}
              </ListGroup>

              {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="text-center text-muted my-4">
                  <p>Aucun utilisateur ne correspond à votre recherche.</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewConversationModal(false)}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConversationsList; 