import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ForumDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { joinForum, leaveForum, sendMessage, socket } = useSocket();
  
  const [forum, setForum] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteOps, setDeleteOps] = useState({});

  useEffect(() => {
    const fetchForumData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails du forum
        const forumRes = await axios.get(`http://localhost:5000/api/forums/${id}`, { withCredentials: true });
        setForum(forumRes.data);
        
        // Récupérer les messages du forum
        const messagesRes = await axios.get(`http://localhost:5000/api/messages/forum/${id}`, { withCredentials: true });
        setMessages(messagesRes.data);
        
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du forum');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForumData();
    
    // Rejoindre le forum via WebSocket
    if (id) {
      joinForum(id);
    }
    
    // Quitter le forum lors du démontage du composant
    return () => {
      if (id) {
        leaveForum(id);
      }
    };
  }, [id, joinForum, leaveForum]);
  
  // Écouter les nouveaux messages via WebSocket
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (messageData) => {
        // Vérifier si le message appartient à ce forum
        if (messageData.forumId === id && messageData.parentMessage === null) {
          // Ajouter le nouveau message au début de la liste
          setMessages(prevMessages => [messageData, ...prevMessages]);
        }
      };
      
      // S'abonner à l'événement de réception de message
      socket.on('receive_message', handleNewMessage);
      
      // Se désabonner lors du démontage du composant
      return () => {
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [socket, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || submitting) return;
    
    try {
      setSubmitting(true);
      
      const res = await axios.post('http://localhost:5000/api/messages', {
        content: newMessage,
        forumId: id,
        parentMessageId: null
      }, { withCredentials: true });
      
      // Ajouter le nouveau message à la liste locale avant d'envoyer via WebSocket
      setMessages(prevMessages => [res.data.messageData, ...prevMessages]);
      setNewMessage('');
      
      // Envoyer le message via WebSocket pour une mise à jour en temps réel
      sendMessage({
        ...res.data.messageData,
        forumId: id
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du message');
      console.error('Erreur d\'envoi de message:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour gérer les clics multiples sur le bouton de suppression
  const handleDeleteButtonClick = (messageId) => {
    const now = Date.now();
    
    // Si une suppression est déjà en cours pour ce message
    if (deleteOps[messageId] && deleteOps[messageId].inProgress) {
      // Vérifier si moins de 2 secondes se sont écoulées depuis le dernier clic
      if (now - deleteOps[messageId].lastClickTime < 2000) {
        // Incrémenter le compteur de clics
        const newClickCount = deleteOps[messageId].clickCount + 1;
        
        setDeleteOps({
          ...deleteOps,
          [messageId]: {
            ...deleteOps[messageId],
            clickCount: newClickCount,
            lastClickTime: now
          }
        });
        
        // Si l'utilisateur a cliqué plusieurs fois, afficher un message
        if (newClickCount >= 3) {
          alert("Opération de suppression en cours, veuillez patienter...");
        }
      }
      return; // Ne pas lancer une nouvelle suppression
    }
    
    // Sinon, lancer l'opération de suppression
    setDeleteOps({
      ...deleteOps,
      [messageId]: {
        inProgress: true,
        clickCount: 1, 
        lastClickTime: now
      }
    });
    
    // Procéder à la confirmation et suppression
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      try {
        // Désactiver le bouton pendant la suppression
        const btn = document.activeElement;
        if (btn) btn.disabled = true;
        
        axios.delete(`http://localhost:5000/api/messages/${messageId}`, { 
          withCredentials: true,
          timeout: 10000 // Timeout plus long pour éviter les problèmes de connexion
        })
          .then((response) => {
            console.log('Réponse de suppression:', response.data);
            
            if (response.data.completelyRemoved) {
              // Si complètement supprimé, enlever de la liste
              setMessages(prev => prev.filter(m => m._id !== messageId));
              alert('Message supprimé avec succès!');
            } else {
              // Si juste marqué comme supprimé, mettre à jour le message local
              setMessages(prev => prev.map(m => {
                if (m._id === messageId) {
                  return {
                    ...m,
                    content: "[Ce message a été supprimé]",
                    isDeleted: true
                  };
                }
                return m;
              }));
              alert('Message marqué comme supprimé!');
            }
          })
          .catch(err => {
            console.error('Erreur lors de la suppression:', err);
            
            // Afficher le message d'erreur approprié
            if (err.response && err.response.data) {
              alert(`Erreur lors de la suppression: ${err.response.data.message || 'Erreur serveur'}`);
            } else if (err.request) {
              alert('Le serveur n\'a pas répondu. Vérifiez votre connexion.');
            } else {
              alert(`Erreur: ${err.message}`);
            }
          })
          .finally(() => {
            // Réactiver le bouton
            if (btn) btn.disabled = false;
            
            // Réinitialiser l'état de l'opération
            setDeleteOps({
              ...deleteOps,
              [messageId]: {
                inProgress: false,
                clickCount: 0,
                lastClickTime: 0
              }
            });
          });
      } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur système: ${error.message}`);
        
        // Réinitialiser l'état de l'opération
        setDeleteOps({
          ...deleteOps,
          [messageId]: {
            inProgress: false,
            clickCount: 0,
            lastClickTime: 0
          }
        });
      }
    } else {
      // Annulation - réinitialiser l'état de l'opération
      setDeleteOps({
        ...deleteOps,
        [messageId]: {
          inProgress: false,
          clickCount: 0,
          lastClickTime: 0
        }
      });
    }
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
          <p className="text-muted">{forum.description}</p>
        </div>
        <Link to="/" className="btn btn-primary">
          Retour aux forums
        </Link>
      </div>

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

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h4 className="mb-0">Messages</h4>
        </Card.Header>
        <Card.Body>
          {messages.length === 0 ? (
            <Alert variant="info">Aucun message dans ce forum pour le moment.</Alert>
          ) : (
            <ListGroup variant="flush">
              {messages.map((message) => (
                <ListGroup.Item 
                  key={message._id} 
                  className={`mb-3 border-bottom p-3 ${message.isDeleted ? 'bg-light' : ''}`}
                >
                  <div className="d-flex justify-content-between">
                    <div className="d-flex align-items-center">
                      <img
                        src={message.author.profilePicture || "https://via.placeholder.com/40"}
                        alt={message.author.username}
                        className="rounded-circle me-2"
                        width="40"
                        height="40"
                        style={{ opacity: message.isDeleted ? 0.5 : 1 }}
                      />
                      <div>
                        <Link to={`/profile/${message.author._id}`} className="fw-bold text-decoration-none">
                          {message.author.username}
                        </Link>
                        <div className="text-muted small">
                          {new Date(message.createdAt).toLocaleString()}
                          {message.isEdited && !message.isDeleted && ' (modifié)'}
                          {message.isDeleted && ' (supprimé)'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Link 
                        to={`/message/${message._id}`} 
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => {
                          // Vérifier si l'ID est valide avant de naviguer
                          if (!message._id || typeof message._id !== 'string' || !message._id.match(/^[0-9a-fA-F]{24}$/)) {
                            e.preventDefault();
                            alert("Ce message n'est pas accessible");
                          }
                        }}
                      >
                        Voir les réponses
                      </Link>
                      {!message.isDeleted && (currentUser.id === message.author._id || currentUser.role === 'admin') && (
                        <Button 
                          variant="danger" 
                          size="sm"
                          className="ms-2"
                          onClick={() => handleDeleteButtonClick(message._id)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className={`mt-2 p-2 bg-light rounded ${message.isDeleted ? 'fst-italic text-muted' : ''}`}>
                    {message.content}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ForumDetail;
