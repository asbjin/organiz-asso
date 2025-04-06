import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

// Composant pour afficher une réponse et ses réponses enfants
const Reply = ({ reply, onDelete, onReply, parentId, depth = 0 }) => {
  const { currentUser } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(reply.isDeleted || false);
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;
    
    setSubmitting(true);
    await onReply(reply._id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
    setSubmitting(false);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      try {
        setDeleting(true);
        
        // Appel direct à l'API sans passer par la fonction parente
        const response = await axios.delete(`http://localhost:5000/api/messages/${reply._id}`, { 
          withCredentials: true,
          // Ajouter un timeout plus long pour éviter les problèmes de connexion
          timeout: 10000
        });
        
        console.log('Réponse de suppression:', response.data);
        
        if (response.data.completelyRemoved) {
          // Si complètement supprimé, informer le parent
          onDelete(reply._id);
          alert('Message supprimé avec succès!');
        } else {
          // Marquer comme supprimé localement
          setIsDeleted(true);
          reply.content = "[Ce message a été supprimé]";
          reply.isDeleted = true;
          alert('Message marqué comme supprimé!');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert(`Erreur lors de la suppression du message: ${err.response?.data?.message || err.message}`);
      } finally {
        setDeleting(false);
      }
    }
  };
  
  // Déterminer la classe CSS selon le niveau d'imbrication
  const depthClass = `reply-level-${depth % 6}`;
  
  return (
    <div>
      <ListGroup.Item 
        className={`nested-reply ${depthClass} ${isDeleted ? 'message-deleted' : ''}`}
        style={{ 
          paddingLeft: `${depth * 25}px`, 
          borderLeft: depth > 0 ? '4px solid' : 'none', 
          marginBottom: '10px',
          marginLeft: depth > 0 ? '10px' : '0px',
          borderRadius: '8px',
          backgroundColor: isDeleted ? '#f8f8f8' : (depth % 2 === 0 ? 'white' : '#f9f9ff')
        }}
      >
        <div className="d-flex justify-content-between">
          <div className="d-flex align-items-center">
            <img
              src={reply.author.profilePicture || "https://via.placeholder.com/40"}
              alt={reply.author.username}
              className="rounded-circle me-2"
              width="40"
              height="40"
              style={{ opacity: isDeleted ? 0.5 : 1 }}
            />
            <div>
              <Link to={`/profile/${reply.author._id}`} className="fw-bold text-decoration-none">
                {reply.author.username}
              </Link>
              <div className="text-muted small">
                {new Date(reply.createdAt).toLocaleString()}
                {reply.isEdited && !isDeleted && ' (modifié)'}
                {isDeleted && ' (supprimé)'}
                {depth > 0 && <span className="depth-indicator">Niveau {depth}</span>}
              </div>
            </div>
          </div>
          <div>
            {!isDeleted && (currentUser.id === reply.author._id || currentUser.role === 'admin') && (
              <Button 
                variant="danger" 
                size="sm"
                className="me-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-1"
                    />
                    Suppression...
                  </>
                ) : 'Supprimer'}
              </Button>
            )}
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Répondre
            </Button>
          </div>
        </div>
        <div className={`mt-2 p-2 ${isDeleted ? 'fst-italic text-muted' : ''}`}>
          {reply.content}
        </div>
        
        {/* Formulaire de réponse */}
        {showReplyForm && (
          <Form onSubmit={handleReplySubmit} className="mt-3 mb-2 p-2 border border-light rounded">
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                rows={2}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Écrivez votre réponse ici..."
                required
              />
            </Form.Group>
            <div className="d-flex">
              <Button type="submit" size="sm" disabled={submitting} className="me-2">
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
                ) : 'Envoyer'}
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowReplyForm(false)}
              >
                Annuler
              </Button>
            </div>
          </Form>
        )}
      </ListGroup.Item>
      
      {/* Afficher les réponses enfants de manière récursive */}
      {reply.children && reply.children.length > 0 && (
        <div className="ms-3">
          {reply.children.map((child) => (
            <Reply
              key={child._id}
              reply={child}
              onDelete={onDelete}
              onReply={onReply}
              parentId={reply._id}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MessageDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { joinForum, leaveForum, sendMessage, socket } = useSocket();
  
  const [message, setMessage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [forum, setForum] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  // État pour suivre si une opération de suppression est en cours
  const [deleteOperation, setDeleteOperation] = useState({
    inProgress: false,
    clickCount: 0,
    messageId: null,
    lastClickTime: 0
  });

  // Fonction pour gérer les clics multiples sur le bouton supprimer
  const handleDeleteButtonClick = (messageId) => {
    const now = Date.now();
    
    // Si une suppression est déjà en cours pour ce message
    if (deleteOperation.inProgress && deleteOperation.messageId === messageId) {
      // Vérifier si moins de 2 secondes se sont écoulées depuis le dernier clic
      if (now - deleteOperation.lastClickTime < 2000) {
        // Incrémenter le compteur de clics
        const newClickCount = deleteOperation.clickCount + 1;
        setDeleteOperation({
          ...deleteOperation,
          clickCount: newClickCount,
          lastClickTime: now
        });
        
        // Si l'utilisateur a cliqué plusieurs fois, afficher un message
        if (newClickCount >= 3) {
          alert("Opération de suppression en cours, veuillez patienter...");
        }
      }
      return; // Ne pas lancer une nouvelle suppression
    }
    
    // Sinon, lancer l'opération de suppression
    setDeleteOperation({
      inProgress: true,
      clickCount: 1,
      messageId: messageId,
      lastClickTime: now
    });
    
    // Appeler la fonction de suppression
    handleDeleteMessage(messageId);
  };

  // Effet pour gérer la redirection automatique en cas d'erreur
  useEffect(() => {
    let redirectTimer;
    if (error && !loading) {
      setRedirectCountdown(5);
      redirectTimer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(redirectTimer);
            window.location.href = '/'; // Rediriger vers la page des forums
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (redirectTimer) clearInterval(redirectTimer);
    };
  }, [error, loading]);

  useEffect(() => {
    let isMounted = true; // Pour éviter les mises à jour sur un composant démonté
    
    const fetchMessageData = async () => {
      try {
        setLoading(true);
        
        // Récupérer d'abord le message parent
        try {
          const parentMessageRes = await axios.get(`http://localhost:5000/api/messages/${id}`, { withCredentials: true });
          
          // Vérifier si le composant est toujours monté
          if (!isMounted) return;
          
          if (parentMessageRes.data) {
            setMessage(parentMessageRes.data);
            
            // Si nous avons le message parent, récupérer le forum
            if (parentMessageRes.data.forum) {
              const forumRes = await axios.get(`http://localhost:5000/api/forums/${parentMessageRes.data.forum}`, { withCredentials: true });
              
              // Vérifier à nouveau si le composant est toujours monté
              if (!isMounted) return;
              
              setForum(forumRes.data);
              
              // Rejoindre le forum via WebSocket
              joinForum(parentMessageRes.data.forum);
              
              // Récupérer les réponses au message avec structure imbriquée
              const repliesRes = await axios.get(`http://localhost:5000/api/messages/replies/${id}`, { withCredentials: true });
              
              // Vérifier à nouveau si le composant est toujours monté
              if (!isMounted) return;
              
              setReplies(repliesRes.data);
            }
          } else {
            // Le serveur a retourné 200 mais pas de données
            setError('Message introuvable ou supprimé.');
          }
        } catch (err) {
          // Vérifier si le composant est toujours monté
          if (!isMounted) return;
          
          console.error('Erreur lors de la récupération du message parent:', err);
          setError('Message introuvable ou supprimé.');
        }
      } catch (err) {
        // Vérifier si le composant est toujours monté
        if (!isMounted) return;
        
        console.error('Erreur lors du chargement des données:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement du message');
      } finally {
        // Vérifier si le composant est toujours monté
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Vérifier si l'ID est valide avant de faire l'appel (24 caractères hexadécimaux)
    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
      fetchMessageData();
    } else {
      setError('ID de message invalide');
      setLoading(false);
    }
    
    // Nettoyer au démontage du composant
    return () => {
      isMounted = false;
      // Quitter le forum lors du démontage du composant
      if (message && message.forum) {
        leaveForum(message.forum);
      }
    };
  }, [id, joinForum, leaveForum]); // Retrait de message des dépendances pour éviter les boucles
  
  // Écouter les nouveaux messages via WebSocket
  useEffect(() => {
    if (socket && message) {
      const handleNewMessage = (messageData) => {
        // Mise à jour pour gérer les réponses imbriquées
        if (messageData.parentMessage) {
          // Si c'est une réponse directe au message principal
          if (messageData.parentMessage === id) {
            setReplies(prevReplies => [...prevReplies, { ...messageData, children: [] }]);
          } else {
            // Si c'est une réponse à une autre réponse, mettre à jour la structure imbriquée
            const updateRepliesRecursively = (replyList) => {
              return replyList.map(reply => {
                if (reply._id === messageData.parentMessage) {
                  // Ajouter la réponse aux enfants
                  return {
                    ...reply,
                    children: [...(reply.children || []), { ...messageData, children: [] }]
                  };
                } else if (reply.children && reply.children.length > 0) {
                  // Rechercher dans les enfants
                  return {
                    ...reply,
                    children: updateRepliesRecursively(reply.children)
                  };
                }
                return reply;
              });
            };
            
            setReplies(prevReplies => updateRepliesRecursively(prevReplies));
          }
        }
      };
      
      // S'abonner à l'événement de réception de message
      socket.on('receive_message', handleNewMessage);
      
      // Se désabonner lors du démontage du composant
      return () => {
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [socket, id, message]);

  // Fonction pour soumettre une réponse au message principal
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newReply.trim() || submitting) return;
    
    await submitReply(id, newReply);
    setNewReply('');
  };
  
  // Fonction commune pour soumettre une réponse (au message principal ou à une autre réponse)
  const submitReply = async (parentId, content) => {
    if (!content.trim() || submitting) return;
    
    try {
      setSubmitting(true);
      
      const res = await axios.post('http://localhost:5000/api/messages', {
        content: content,
        forumId: message.forum,
        parentMessageId: parentId
      }, { withCredentials: true });
      
      // Mise à jour pour gérer les réponses imbriquées
      if (parentId === id) {
        // Si c'est une réponse au message principal
        setReplies(prevReplies => [...prevReplies, { ...res.data.messageData, children: [] }]);
      } else {
        // Si c'est une réponse à une autre réponse
        const updateRepliesRecursively = (replyList) => {
          return replyList.map(reply => {
            if (reply._id === parentId) {
              // Ajouter la réponse aux enfants
              return {
                ...reply,
                children: [...(reply.children || []), { ...res.data.messageData, children: [] }]
              };
            } else if (reply.children && reply.children.length > 0) {
              // Rechercher dans les enfants
              return {
                ...reply,
                children: updateRepliesRecursively(reply.children)
              };
            }
            return reply;
          });
        };
        
        setReplies(prevReplies => updateRepliesRecursively(prevReplies));
      }
      
      // Envoyer la réponse via WebSocket pour une mise à jour en temps réel
      sendMessage({
        ...res.data.messageData,
        forumId: message.forum,
        parentMessage: parentId,
        children: []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de la réponse');
      console.error('Erreur d\'envoi de réponse:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Mettre à jour handleDeleteMessage pour réinitialiser l'état à la fin
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      // Réinitialiser l'état si l'utilisateur annule
      setDeleteOperation({
        inProgress: false,
        clickCount: 0,
        messageId: null,
        lastClickTime: 0
      });
      return;
    }
    
    try {
      setSubmitting(true); // Désactiver le bouton pendant la suppression
      
      const response = await axios.delete(`http://localhost:5000/api/messages/${messageId}`, { 
        withCredentials: true,
        timeout: 10000 // Timeout plus long pour éviter les problèmes de connexion
      });
      
      console.log('Réponse de suppression:', response.data);
      
      // Si c'est le message parent qui est supprimé
      if (messageId === id) {
        if (response.data.completelyRemoved) {
          // Si complètement supprimé, rediriger vers le forum
          alert('Message supprimé avec succès! Redirection vers le forum...');
          window.location.href = `/forum/${message.forum}`;
          return; // Sortir de la fonction après redirection
        } else {
          // Si juste marqué comme supprimé, mettre à jour le message localement
          setMessage(prev => ({
            ...prev,
            content: "[Ce message a été supprimé]",
            isDeleted: true
          }));
          alert('Message marqué comme supprimé.');
        }
      } else {
        // Pour les réponses, mise à jour récursive pour marquer comme supprimée ou supprimer complètement
        if (response.data.completelyRemoved) {
          // Suppression complète, retirer de la liste locale
          const removeReplyRecursively = (replyList, idToRemove) => {
            return replyList.filter(reply => {
              if (reply._id === idToRemove) {
                return false; // Supprimer cette réponse
              }
              if (reply.children && reply.children.length > 0) {
                reply.children = removeReplyRecursively(reply.children, idToRemove);
              }
              return true;
            });
          };
          
          setReplies(prevReplies => removeReplyRecursively(prevReplies, messageId));
          alert('Réponse supprimée avec succès!');
        } else {
          // Marqué comme supprimé, mettre à jour dans la liste locale
          const updateReplyRecursively = (replyList, idToUpdate) => {
            return replyList.map(reply => {
              if (reply._id === idToUpdate) {
                // Marquer cette réponse comme supprimée
                return {
                  ...reply,
                  content: "[Ce message a été supprimé]",
                  isDeleted: true
                };
              }
              if (reply.children && reply.children.length > 0) {
                reply.children = updateReplyRecursively(reply.children, idToUpdate);
              }
              return reply;
            });
          };
          
          setReplies(prevReplies => updateReplyRecursively(prevReplies, messageId));
          alert('Message marqué comme supprimé!');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      
      // Si l'API renvoie une erreur, afficher ce message
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Erreur lors de la suppression du message');
        alert(`Erreur lors de la suppression du message: ${err.response.data.message || 'Erreur serveur'}`);
      } else if (err.request) {
        // Si la requête a été envoyée mais qu'il n'y a pas eu de réponse
        setError('Le serveur n\'a pas répondu. Vérifiez votre connexion.');
        alert('Le serveur n\'a pas répondu. Vérifiez votre connexion.');
      } else {
        // Si une erreur s'est produite lors de la configuration de la requête
        setError(err.message || 'Erreur lors de la suppression du message');
        alert(`Erreur: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
      
      // Réinitialiser l'état de l'opération de suppression
      setDeleteOperation({
        inProgress: false,
        clickCount: 0,
        messageId: null,
        lastClickTime: 0
      });
    }
  };

  // Fonction pour passer le handleDeleteButtonClick au composant Reply
  const handleReplyDelete = (replyId) => {
    // Appeler la fonction de gestion des clics multiples
    handleDeleteButtonClick(replyId);
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
    return (
      <div className="text-center">
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
        <p>Le message que vous cherchez a peut-être été supprimé ou n'a jamais existé.</p>
        <div className="mt-4">
          <p>Redirection vers la page d'accueil dans {redirectCountdown} secondes...</p>
          <Link to="/" className="btn btn-primary me-3">
            Retour aux forums
          </Link>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="text-center">
        <Alert variant="warning" className="mb-4">
          Message introuvable ou supprimé.
        </Alert>
        <p>Le message que vous cherchez a peut-être été supprimé ou n'a jamais existé.</p>
        <div className="mt-4">
          <p>Redirection vers la page d'accueil dans {redirectCountdown} secondes...</p>
          <Link to="/" className="btn btn-primary me-3">
            Retour aux forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="message-detail-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Discussion</h2>
        <Link to={`/forum/${message.forum}`} className="btn btn-primary">
          Retour au forum
        </Link>
      </div>

      {/* Message parent */}
      <Card className={`mb-4 shadow-sm message-card ${message.isDeleted ? 'bg-light message-deleted' : ''}`}>
        <Card.Header className="d-flex justify-content-between bg-light">
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
          {!message.isDeleted && (currentUser.id === message.author._id || currentUser.role === 'admin') && (
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => handleDeleteButtonClick(message._id)}
              disabled={submitting}
            >
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
                  Suppression...
                </>
              ) : 'Supprimer'}
            </Button>
          )}
        </Card.Header>
        <Card.Body style={{ borderLeft: '4px solid #4a89dc' }}>
          <Card.Text className={`p-2 ${message.isDeleted ? 'fst-italic text-muted' : ''}`}>
            {message.content}
          </Card.Text>
        </Card.Body>
      </Card>

      {/* Formulaire de réponse au message principal */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label><strong>Votre réponse</strong></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Écrivez votre réponse ici..."
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
              ) : 'Répondre'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Liste des réponses imbriquées */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h4 className="mb-0">Réponses</h4>
        </Card.Header>
        <Card.Body>
          {replies.length === 0 ? (
            <Alert variant="info">Aucune réponse pour le moment.</Alert>
          ) : (
            <ListGroup variant="flush">
              {replies.map((reply) => (
                <Reply
                  key={reply._id}
                  reply={reply}
                  onDelete={handleReplyDelete}
                  onReply={submitReply}
                  parentId={id}
                  depth={0}
                />
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MessageDetail;
