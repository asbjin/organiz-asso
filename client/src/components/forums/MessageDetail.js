import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

// Composant pour afficher une réponse et ses réponses enfants
const Reply = ({ reply, onDelete, onReply, parentId, depth = 0, targetReplyId }) => {
  const { currentUser } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(reply.isDeleted || false);
  const replyRef = useRef(null);
  
  // Mettre en évidence le message ciblé
  const isTargeted = targetReplyId === reply._id;
  
  // Faire défiler jusqu'à la réponse si c'est celle qui est ciblée
  useEffect(() => {
    if (isTargeted && replyRef.current) {
      // Petit délai pour s'assurer que le DOM est complètement chargé
      setTimeout(() => {
        replyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isTargeted, reply._id]);
  
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
    if (deleting) return; // Éviter les multiples clics
    
    setDeleting(true);
    try {
      await onDelete(reply._id);
      // Le changement d'état sera géré par la fonction parente
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setDeleting(false);
    }
  };
  
  // Déterminer la classe CSS selon le niveau d'imbrication
  const depthClass = `reply-level-${depth % 6}`;
  
  // Gérer explicitement la modification du champ de saisie
  const handleReplyContentChange = (e) => {
    // Mise à jour directe simple sans preventDefault
    setReplyContent(e.target.value);
  };

  return (
    <div>
      <ListGroup.Item 
        id={`reply-${reply._id}`}
        ref={replyRef}
        className={`nested-reply ${depthClass} ${isDeleted ? 'message-deleted' : ''}`}
        style={{ 
          paddingLeft: `${depth * 25}px`, 
          borderLeft: depth > 0 ? '4px solid' : 'none', 
          marginBottom: '10px',
          marginLeft: depth > 0 ? '10px' : '0px',
          borderRadius: '8px',
          backgroundColor: isDeleted ? '#f8f8f8' : (depth % 2 === 0 ? 'white' : '#f9f9ff'),
          border: isTargeted ? '1px solid #e0e0e0' : 'none',
          transition: 'border 0.3s ease'
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
            {!isDeleted && (currentUser.id === reply.author._id || currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
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
                onChange={handleReplyContentChange}
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
              targetReplyId={targetReplyId}
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
  const { joinForum, leaveForum, sendMessage, socket, connected } = useSocket();
  const location = useLocation();
  
  const [message, setMessage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [forum, setForum] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [targetReplyId, setTargetReplyId] = useState(null);

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

  // Effet pour extraire l'id du message ciblé à partir du hash de l'URL
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.startsWith('#reply-')) {
      const targetId = hash.replace('#reply-', '');
      setTargetReplyId(targetId);
      console.log(`Message ciblé: ${targetId}`);
    }
  }, [location.hash]);

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

  // Effet pour charger les données du message
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
    };
  }, [id]); // Retrait de message des dépendances pour éviter les boucles

  // Effet séparé pour gérer les connexions WebSocket
  useEffect(() => {
    // Rejoindre le forum seulement si socket connecté et message chargé
    if (socket && connected && message && message.forum) {
      console.log('Rejoindre le forum via WebSocket:', message.forum);
      joinForum(message.forum);
    }
    
    // Quitter le forum lors du démontage
    return () => {
      if (socket && connected && message && message.forum) {
        console.log('Quitter le forum via WebSocket:', message.forum);
        leaveForum(message.forum);
      }
    };
  }, [socket, connected, message, joinForum, leaveForum]);

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
    
    await handleReply(id, newReply);
    setNewReply('');
  };
  
  // Fonction pour ajouter une réponse
  const handleReply = async (parentId, content) => {
    try {
      setSubmitting(true);
      
      const res = await axios.post('http://localhost:5000/api/messages', {
        content,
        forumId: message.forum,
        parentMessageId: parentId
      }, { withCredentials: true });
      
      console.log('Réponse ajoutée:', res.data);
      
      // Fonction récursive pour mettre à jour une réponse dans l'arborescence
      const updateRepliesRecursively = (repliesList) => {
        return repliesList.map(reply => {
          if (reply._id === parentId) {
            // Si on trouve la réponse parent, on ajoute la nouvelle réponse à ses enfants
            return {
              ...reply,
              children: [...(reply.children || []), res.data.messageData]
            };
          }
          
          // Sinon, on continue à chercher dans les enfants
          if (reply.children && reply.children.length > 0) {
            return {
              ...reply,
              children: updateRepliesRecursively(reply.children)
            };
          }
          
          return reply;
        });
      };
      
      // Si la réponse est directement au message parent
      if (parentId === id) {
        setReplies(prevReplies => [...prevReplies, res.data.messageData]);
      } else {
        // Sinon, mettre à jour l'arborescence des réponses
        setReplies(prevReplies => updateRepliesRecursively(prevReplies));
      }
      
      // Envoyer une version simplifiée de la réponse via WebSocket
      const replyData = res.data.messageData;
      sendMessage({
        _id: replyData._id,
        content: replyData.content,
        createdAt: replyData.createdAt,
        forumId: message.forum,
        parentMessage: parentId,
        author: {
          _id: replyData.author._id,
          username: replyData.author.username,
          profilePicture: replyData.author.profilePicture || ''
        }
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
    // Vérifier si une suppression est déjà en cours
    if (deleteOperation.inProgress) {
      console.log('Une suppression est déjà en cours, ignoré');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      // Réinitialiser l'état de suppression si l'utilisateur annule
      setDeleteOperation({
        inProgress: false,
        clickCount: 0,
        messageId: null,
        lastClickTime: 0
      });
      return;
    }
    
    try {
      // Marquer la suppression comme en cours
      setDeleteOperation({
        inProgress: true,
        clickCount: 1,
        messageId: messageId,
        lastClickTime: Date.now()
      });
      
      setSubmitting(true); // Désactiver le bouton pendant la suppression
      
      // Effet visuel immédiat - supprimer la réponse de l'UI avant même la requête API
      if (messageId === id) {
        // Supprimer le message principal
        setMessage(prev => ({
          ...prev,
          isDeleted: true
        }));
        // Redirection immédiate
        window.location.href = `/forum/${message.forum}`;
        return; // Sortir de la fonction
      } else {
        // Pour toutes les réponses, les supprimer immédiatement de l'interface
        const removeReplyRecursively = (replyList, idToRemove) => {
          return replyList.filter(reply => {
            if (reply._id === idToRemove) {
              return false; // Supprimer cette réponse et toutes ses réponses enfants
            }
            if (reply.children && reply.children.length > 0) {
              reply.children = removeReplyRecursively(reply.children, idToRemove);
            }
            return true;
          });
        };
        
        setReplies(prevReplies => removeReplyRecursively(prevReplies, messageId));
      }
      
      // Ensuite envoyer la requête au serveur (en arrière-plan)
      axios.delete(`http://localhost:5000/api/messages/${messageId}`, { 
        withCredentials: true,
        timeout: 15000 // Timeout plus long pour éviter les problèmes de connexion
      })
      .then(response => {
        console.log('Réponse de suppression:', response.data);
      })
      .catch(err => {
        console.error('Erreur lors de la suppression côté serveur:', err);
        // Note: on ne revient pas en arrière dans l'UI car l'élément est déjà visuellement supprimé
      });
      
    } catch (err) {
      console.error('Erreur lors de la suppression côté client:', err);
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
    handleDeleteMessage(replyId);
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
    return (
      <div className="text-center">
        <Alert variant="danger" className="mb-4">
          {typeof error === 'object' ? error.msg || error.message || JSON.stringify(error) : error}
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
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#007bff',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}
            >
              {getUserInitials(message.author.username)}
            </div>
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
          {!message.isDeleted && (currentUser.id === message.author._id || currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
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
                  onReply={handleReply}
                  parentId={id}
                  depth={0}
                  targetReplyId={targetReplyId}
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
