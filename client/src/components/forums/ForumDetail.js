/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { BsReply, BsPencil, BsTrash } from 'react-icons/bs';
import ReplyItem from './ReplyItem';

const ForumDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { joinForum, leaveForum, sendMessage, socket, connected } = useSocket();
  const location = useLocation();
  
  const [forum, setForum] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState({});
  const [replyForm, setReplyForm] = useState({
    messageId: null,
    content: ''
  });
  const [targetReplyId, setTargetReplyId] = useState(null);
  
  // Effet pour extraire l'id du message ciblé à partir du hash de l'URL
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.startsWith('#reply-')) {
      const targetId = hash.replace('#reply-', '');
      setTargetReplyId(targetId);
      console.log(`Message ciblé dans forum: ${targetId}`);
    }
  }, [location.hash]);
  
  // Définir fetchForumData au niveau global du composant pour pouvoir l'utiliser dans d'autres fonctions
  const fetchForumData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les détails du forum
      const forumRes = await axios.get(`http://localhost:5000/api/forums/${id}`, { withCredentials: true });
      const forumData = forumRes.data;
      
      // Log le rôle de l'utilisateur pour le débogage
      console.log('Accès forum privé - Rôle utilisateur:', currentUser.role);
      console.log('Type du forum:', forumData.type);
      
      // Vérifier si l'utilisateur a accès au forum privé
      if (forumData.type === 'closed' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        setError('Vous n\'avez pas les droits nécessaires pour accéder à ce forum privé.');
        setLoading(false);
        return;
      }
      
      setForum(forumData);
      
      // Récupérer les messages du forum
      const messagesRes = await axios.get(`http://localhost:5000/api/messages/forum/${id}`, { withCredentials: true });
      const messagesData = messagesRes.data;
      
      // Filtrer les messages avec content "[Ce message a été supprimé]" pour les retirer complètement
      const filteredMessages = messagesData.filter(message => message.content !== "[Ce message a été supprimé]");
      setMessages(filteredMessages);
      
      // Charger automatiquement les réponses pour tous les messages (non supprimés)
      if (filteredMessages.length > 0) {
        filteredMessages.forEach(message => {
          loadReplies(message._id);
        });
      }
      
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Vous n\'avez pas les droits nécessaires pour accéder à ce forum privé.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement du forum');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Chargement initial des données du forum
  useEffect(() => {
    fetchForumData();
  }, [id]);
  
  // Gestion des WebSockets
  useEffect(() => {
    if (socket && connected && id) {
      console.log('Rejoindre le forum via WebSocket:', id);
      joinForum(id);
      
      // Écouter les nouveaux messages
      const handleNewMessage = (messageData) => {
        if (messageData.forumId === id) {
          // Vérifier si le message existe déjà pour éviter les doublons
          if (messageData.parentMessage === null) {
            // C'est un message principal
            setMessages(prevMessages => {
              // Vérifier si ce message existe déjà
              const messageExists = prevMessages.some(m => m._id === messageData._id);
              if (messageExists) return prevMessages;
              
              return [messageData, ...prevMessages];
            });
          } else {
            // C'est une réponse
            const parentId = messageData.parentMessage;
            
            // Si c'est une réponse à un message principal, mettre à jour les réponses
            setReplies(prev => {
              if (prev[parentId]) {
                // Vérifier si cette réponse existe déjà
                const replyExists = prev[parentId].data && 
                  prev[parentId].data.some(r => r._id === messageData._id);
                if (replyExists) return prev;
                
                // Ajouter à la liste des réponses existantes
                return {
                  ...prev,
                  [parentId]: {
                    ...prev[parentId],
                    data: [...(prev[parentId].data || []), messageData]
                  }
                };
              }
              return prev;
            });
          }
        }
      };
      
      socket.on('receive_message', handleNewMessage);
      
      return () => {
        console.log('Quitter le forum via WebSocket:', id);
        leaveForum(id);
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [id, joinForum, leaveForum, socket, connected]);

  // Charger les réponses pour un message
  const loadReplies = async (messageId) => {
    try {
      // Indiquer que les réponses sont en cours de chargement
      setReplies(prev => ({
        ...prev,
        [messageId]: { 
          ...prev[messageId],
          loading: true
        }
      }));
      
      const res = await axios.get(`http://localhost:5000/api/messages/replies/${messageId}`, { 
        withCredentials: true 
      });
      
      // Filtrer les réponses supprimées récursivement
      const filterDeletedReplies = (replies) => {
        if (!replies) return [];
        
        return replies
          .filter(reply => reply.content !== "[Ce message a été supprimé]")
          .map(reply => ({
            ...reply,
            children: filterDeletedReplies(reply.children)
          }));
      };
      
      const filteredReplies = filterDeletedReplies(res.data);
      
      // Stocker les réponses filtrées une fois chargées
      setReplies(prev => ({
        ...prev,
        [messageId]: { 
          loading: false, 
          data: filteredReplies,
          visible: true
        }
      }));
    } catch (err) {
      console.error(`Erreur lors du chargement des réponses:`, err);
      setReplies(prev => ({
        ...prev,
        [messageId]: { 
          loading: false, 
          data: [], 
          error: err.message,
          visible: true
        }
      }));
    }
  };

  // Publier un nouveau message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/messages', {
        content: newMessage,
        forumId: id,
        parentMessageId: null
      }, { withCredentials: true });
      
      const newMessageData = res.data.messageData;
      
      // Ajouter le nouveau message en local
      setMessages(prev => [newMessageData, ...prev]);
      setNewMessage('');
      
      // Envoyer via WebSocket
      if (socket && connected) {
        sendMessage({
          _id: newMessageData._id,
          content: newMessageData.content,
          createdAt: newMessageData.createdAt,
          forumId: id,
          author: {
            _id: newMessageData.author._id,
            username: newMessageData.author.username,
            profilePicture: newMessageData.author.profilePicture
          }
        });
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un message ou une réponse avec suppression en cascade
  const handleDeleteMessage = async (messageId) => {
    try {
      // Vérifier d'abord si c'est un message principal
      const isMainMessage = messages.some(m => m._id === messageId);
      
      // Confirmation de suppression
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message et toutes ses réponses ?')) {
        return;
      }
      
      // 1. Envoyer la requête au serveur pour supprimer le message en cascade
      await axios.delete(`http://localhost:5000/api/messages/${messageId}/cascade`, { 
        withCredentials: true 
      });
      
      console.log(`Message ${messageId} et ses réponses ont été marqués comme supprimés`);
      
      // 2. Actualiser les données du forum pour voir les messages supprimés
      await fetchForumData();
      
      // 3. Actualiser le compteur de messages
      try {
        const countRes = await axios.get(`http://localhost:5000/api/messages/forum/${id}/count`, {
          withCredentials: true
        });
        console.log(`Nombre de messages mis à jour: ${countRes.data.count}`);
      } catch (countErr) {
        console.error("Erreur lors de la mise à jour du compteur:", countErr);
      }
      
    } catch (err) {
      console.error('Erreur lors de la suppression du message:', err);
      setError('Erreur lors de la suppression du message');
      
      // En cas d'erreur, recharger les données pour rétablir l'état correct
      fetchForumData();
    }
  };

  // Ouvrir le formulaire de réponse
  const handleReplyClick = (messageId) => {
    // Charger les réponses si elles n'existent pas encore
    if (!replies[messageId]) {
      loadReplies(messageId);
    }
    
    // Ouvrir/fermer le formulaire de réponse
    setReplyForm(prev => {
      if (prev.messageId === messageId) {
        return { messageId: null, content: '' };
      } else {
        return { messageId: messageId, content: '' };
      }
    });
  };

  // Répondre à un message ou une réponse
  const handleReply = async (parentId, content) => {
    try {
      setSubmitting(true);
      
      const res = await axios.post('http://localhost:5000/api/messages', {
        content,
        forumId: id,
        parentMessageId: parentId
      }, { withCredentials: true });
      
      const newReply = {
        ...res.data.messageData,
        children: []
      };
      
      // Vérifier si c'est une réponse à un message principal
      const isMainMessage = messages.some(m => m._id === parentId);
      
      if (isMainMessage) {
        // C'est une réponse à un message principal
        setReplies(prev => {
          // Si les réponses n'existent pas encore pour ce message
          if (!prev[parentId]) {
            return {
              ...prev,
              [parentId]: {
                loading: false,
                data: [newReply],
                visible: true
              }
            };
          }
          
          // Vérifier si cette réponse existe déjà pour éviter les doublons
          const replyExists = prev[parentId].data.some(r => r._id === newReply._id);
          if (replyExists) {
            // Si la réponse existe déjà, ne pas la dupliquer
            return prev;
          }
          
          // Sinon ajouter à la liste existante
          return {
            ...prev,
            [parentId]: {
              ...prev[parentId],
              data: [...(prev[parentId].data || []), newReply]
            }
          };
        });
      } else {
        // C'est une réponse à une réponse - rechercher dans l'arborescence
        setReplies(prev => {
          const updated = { ...prev };
          
          // Fonction pour ajouter une réponse imbriquée
          const addNestedReply = (repliesArray, targetId, newReplyData) => {
            if (!repliesArray) return [];
            
            return repliesArray.map(reply => {
              // Si c'est la réponse parente, ajouter la nouvelle réponse comme enfant
              if (reply._id === targetId) {
                // Vérifier si cette réponse existe déjà pour éviter les doublons
                const childExists = (reply.children || []).some(r => r._id === newReplyData._id);
                if (childExists) {
                  return reply; // Ne pas dupliquer
                }
                
                return {
                  ...reply,
                  children: [...(reply.children || []), newReplyData]
                };
              }
              
              // Sinon, traiter ses enfants récursivement
              if (reply.children && reply.children.length > 0) {
                return {
                  ...reply,
                  children: addNestedReply(reply.children, targetId, newReplyData)
                };
              }
              
              return reply;
            });
          };
          
          // Parcourir toutes les réponses pour trouver la réponse parente
          for (const msgId of Object.keys(updated)) {
            if (updated[msgId] && updated[msgId].data) {
              updated[msgId].data = addNestedReply(updated[msgId].data, parentId, newReply);
            }
          }
          
          return updated;
        });
      }
      
      // Envoyer via WebSocket seulement si l'utilisateur est connecté
      // pour éviter que la personne qui poste reçoive son propre message en double
      if (socket && connected) {
        // Ajouter un délai très court pour éviter les doublons
        setTimeout(() => {
          sendMessage({
            _id: newReply._id,
            content: newReply.content,
            createdAt: newReply.createdAt,
            forumId: id,
            parentMessage: parentId,
            author: {
              _id: newReply.author._id,
              username: newReply.author.username,
              profilePicture: newReply.author.profilePicture || ''
            }
          });
        }, 50);
      }
      
      // Fermer le formulaire
      setReplyForm({ messageId: null, content: '' });
      
      return newReply;
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la réponse:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };
  
  // Fonction pour obtenir les initiales du nom d'utilisateur
  const getUserInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="forum-detail-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{forum.name}</h2>
          <p className="text-muted">
            {forum.description}
            {messages.length > 0 && (
              <span className="badge bg-info ms-2">{messages.length} message{messages.length > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <Link to="/" className="btn btn-primary" onClick={() => setTimeout(() => window.location.reload(), 100)}>
          Retour aux forums
        </Link>
      </div>

      {/* Formulaire pour nouveau message */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label><strong>Nouveau message</strong></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                required
                className="border-primary"
              />
            </Form.Group>
            <Button type="submit" disabled={submitting} variant="success">
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  Envoi en cours...
                </>
              ) : 'Publier'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Liste des messages */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h4 className="mb-0">
            Messages {messages.length > 0 ? (
              <span className="badge bg-primary ms-2">{messages.length} message{messages.length > 1 ? 's' : ''}</span>
            ) : (
              <span className="badge bg-secondary ms-2">0 message</span>
            )}
          </h4>
        </Card.Header>
        <Card.Body>
          {messages.length > 0 ? (
            messages.map(message => (
              <div 
                key={message._id} 
                className="forum-message mb-4"
                id={`message-${message._id}`}
              >
                <div className="message-header">
                  <div className="message-author">
                    <div 
                      className="author-avatar-initials"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#007bff',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}
                    >
                      {getUserInitials(message.author?.username)}
                    </div>
                    <span className="author-name">{message.author?.username || "Utilisateur"}</span>
                  </div>
                  <small className="text-muted">
                    {new Date(message.createdAt).toLocaleString()}
                    {message.isEdited && ' (modifié)'}
                  </small>
                </div>
                
                <div className="message-content">
                  {message.content === "[Ce message a été supprimé]" ? (
                    <em className="text-muted">[Ce message a été supprimé]</em>
                  ) : (
                    message.content
                  )}
                </div>
                
                <div className="message-actions">
                  <Button 
                    variant="link" 
                    className="btn-sm text-primary" 
                    onClick={() => handleReplyClick(message._id)}
                  >
                    <BsReply /> Répondre
                  </Button>
                  
                  {(currentUser && currentUser.id === message.author?._id) || currentUser.role === 'admin' || currentUser.role === 'superadmin' ? (
                    <>
                      <Button 
                        variant="link" 
                        className="btn-sm text-warning" 
                        onClick={() => alert('Fonctionnalité de modification à venir')}
                      >
                        <BsPencil /> Modifier
                      </Button>
                      <Button 
                        variant="link" 
                        className="btn-sm text-danger" 
                        onClick={() => handleDeleteMessage(message._id)}
                      >
                        <BsTrash /> Supprimer
                      </Button>
                    </>
                  ) : null}
                </div>
                
                {/* Formulaire de réponse */}
                {replyForm.messageId === message._id && (
                  <Form onSubmit={(e) => {
                    e.preventDefault();
                    if (!replyForm.content.trim() || submitting) return;
                    handleReply(message._id, replyForm.content);
                  }} className="reply-form mt-3 mb-3 p-3 border border-light rounded">
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={replyForm.content}
                        onChange={(e) => setReplyForm({
                          messageId: message._id,
                          content: e.target.value
                        })}
                        placeholder={`Répondre à ${message.author?.username}...`}
                        required
                      />
                    </Form.Group>
                    <div className="d-flex">
                      <Button type="submit" size="sm" disabled={submitting} variant="primary" className="me-2">
                        {submitting ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-1"
                            />
                            Envoi...
                          </>
                        ) : 'Répondre'}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={() => setReplyForm({messageId: null, content: ''})}
                      >
                        Annuler
                      </Button>
                    </div>
                  </Form>
                )}
                
                {/* Liste des réponses */}
                {replies[message._id] && (
                  <div className="replies-container mt-3 ms-4 border-start ps-3">
                    <h6 className="replies-header mb-2">
                      {replies[message._id].data && replies[message._id].data.length > 0 
                        ? `${replies[message._id].data.length} réponse(s)` 
                        : 'Réponses'}
                    </h6>
                    
                    {replies[message._id].loading && (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                        <span className="ms-2">Chargement des réponses...</span>
                      </div>
                    )}
                    
                    {replies[message._id].data && replies[message._id].data.length > 0 ? (
                      replies[message._id].data.map(reply => (
                        <ReplyItem 
                          key={reply._id}
                          reply={reply}
                          onDelete={handleDeleteMessage}
                          onReply={handleReply}
                          targetReplyId={targetReplyId}
                        />
                      ))
                    ) : !replies[message._id].loading ? (
                      <p className="text-muted">Aucune réponse pour ce message.</p>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-messages">
              <p>Aucun message dans ce forum. Soyez le premier à publier !</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ForumDetail;
