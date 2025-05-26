/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Badge, ButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getForums, getForumMessageCount } from '../../services/forumService';
import { useAuth } from '../../contexts/AuthContext';
import { BsChat, BsCalendar3, BsPeople, BsArrowUpRightCircle, BsLock, BsPlus, BsTrash, BsCalendar, BsPerson, BsChevronRight, BsLockFill } from 'react-icons/bs';
import axios from 'axios';
import './ForumStyles.css';

const ForumList = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  const [sortMethod, setSortMethod] = useState('recent'); // 'recent', 'popular', 'alphabetical'
  
  // États pour le modal de création de forum
  const [showModal, setShowModal] = useState(false);
  const [newForumName, setNewForumName] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  const [newForumType, setNewForumType] = useState('open');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [deletingForum, setDeletingForum] = useState(null);

  useEffect(() => {
    // On n'essaie de charger les forums que si l'authentification est terminée
    if (!authLoading) {
      fetchForums();
    }
  }, [authLoading]);

  const fetchForums = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getForums();
      
      // Filtrer les forums privés pour les utilisateurs non-admin
      const filteredForums = data.filter(forum => 
        forum.type !== 'closed' || (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin'))
      );
      
      // Récupérer le nombre de messages pour chaque forum
      const forumsWithMessageCount = await Promise.all(
        filteredForums.map(async (forum) => {
          try {
            const messageCount = await getForumMessageCount(forum._id);
            return {
              ...forum,
              messageCount: messageCount
            };
          } catch (err) {
            console.error(`Erreur lors du chargement du compteur de messages pour ${forum.name}:`, err);
            return {
              ...forum,
              messageCount: 0
            };
          }
        })
      );
      
      // Ajouter un log pour voir les forums et leurs créateurs
      console.log('Forums chargés:', forumsWithMessageCount);
      console.log('Utilisateur actuel:', currentUser);
      
      setForums(forumsWithMessageCount);
    } catch (err) {
      console.error('Erreur lors du chargement des forums:', err);
      
      // Gestion spécifique des erreurs 401
      if (err.response && err.response.status === 401) {
        setError('Vous devez être connecté pour voir les forums. Veuillez vous connecter ou rafraîchir la page.');
      } else {
        setError('Impossible de charger les forums. Veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async (e) => {
    e.preventDefault();
    if (!newForumName || !newForumDescription) {
      setCreateError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Vérifier si l'utilisateur est admin pour les forums privés
    if (newForumType === 'closed' && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      setCreateError('Vous n\'avez pas les droits nécessaires pour créer un forum privé. Seuls les administrateurs peuvent créer des forums privés.');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      await axios.post('http://localhost:5000/api/forums', {
        name: newForumName,
        description: newForumDescription,
        type: newForumType
      }, { withCredentials: true });

      // Réinitialiser les champs et fermer le modal
      setNewForumName('');
      setNewForumDescription('');
      setNewForumType('open');
      setShowModal(false);

      // Actualiser la liste des forums
      fetchForums();
    } catch (err) {
      console.error('Erreur lors de la création du forum:', err);
      if (err.response && err.response.status === 401) {
        setCreateError('Vous devez être connecté pour créer un forum.');
      } else if (err.response && err.response.status === 403) {
        setCreateError('Vous n\'avez pas les droits nécessaires pour créer un forum.');
      } else {
        setCreateError('Une erreur est survenue lors de la création du forum.');
      }
    } finally {
      setCreating(false);
    }
  };

  // Fonction pour supprimer un forum
  const handleDeleteForum = async (forumId, e) => {
    e.preventDefault(); // Empêcher la navigation vers le forum
    e.stopPropagation(); // Empêcher le clic de se propager

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce forum et tous ses messages ?')) {
      return;
    }

    try {
      setDeletingForum(forumId);
      await axios.delete(`http://localhost:5000/api/forums/${forumId}`, { withCredentials: true });
      // Mettre à jour la liste des forums après suppression
      fetchForums();
    } catch (err) {
      console.error('Erreur lors de la suppression du forum:', err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression du forum');
    } finally {
      setDeletingForum(null);
    }
  };

  const getSortedForums = () => {
    if (!forums) return [];
    
    switch (sortMethod) {
      case 'popular':
        return [...forums].sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
      case 'alphabetical':
        return [...forums].sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
      default:
        return [...forums].sort((a, b) => new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt));
    }
  };

  // Fonction pour vérifier si l'utilisateur est le créateur du forum
  const isForumCreator = (forum) => {
    if (!currentUser || !forum || !forum.createdBy) return false;
    
    // Comparer les IDs en tant que strings pour éviter les problèmes de comparaison d'objets
    return forum.createdBy.toString() === currentUser.id.toString();
  };

  if (authLoading) {
    return (
      <Container className="auth-loading-container">
        <div className="loading-animation">
          <Spinner animation="border" role="status" className="spinner-large">
            <span className="visually-hidden">Chargement de l'authentification...</span>
          </Spinner>
          <p>Vérification de l'authentification...</p>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="loading-container">
        <div className="loading-animation">
          <Spinner animation="border" role="status" className="spinner-large">
            <span className="visually-hidden">Chargement des forums...</span>
          </Spinner>
          <p>Chargement des forums...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="error-container">
        <Alert variant="danger" className="error-alert">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Oups! Une erreur s'est produite</h4>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchForums} className="retry-button">
              Réessayer
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const sortedForums = getSortedForums();

  return (
    <Container className="forum-container">
      <div className="header-section">
        <div className="title-section">
          <h1>Forums</h1>
          <p className="text-muted">Découvrez et participez aux discussions</p>
        </div>
        <div className="action-section">
          {currentUser && (
            <Button 
              variant="primary" 
              className="create-forum-btn"
              onClick={() => setShowModal(true)}
            >
              <BsPlus size={20} /> Créer un forum
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <ButtonGroup className="sorting-tabs">
          <Button 
            variant={sortMethod === 'recent' ? 'primary' : 'light'} 
            onClick={() => setSortMethod('recent')}
            className="sort-tab-btn"
          >
            Récent
          </Button>
          <Button 
            variant={sortMethod === 'popular' ? 'primary' : 'light'} 
            onClick={() => setSortMethod('popular')}
            className="sort-tab-btn"
          >
            Populaire
          </Button>
          <Button 
            variant={sortMethod === 'alphabetical' ? 'primary' : 'light'} 
            onClick={() => setSortMethod('alphabetical')}
            className="sort-tab-btn"
          >
            A-Z
          </Button>
        </ButtonGroup>
      </div>

      {sortedForums.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏝️</div>
          <h3>Aucun forum disponible</h3>
          <p>Soyez le premier à créer un forum pour commencer les discussions!</p>
          {currentUser && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Créer votre premier forum
            </Button>
          )}
        </div>
      ) : (
        <div className="forums-list">
          {sortedForums.map((forum, index) => (
            <div key={forum._id} className="forum-card-wrapper fade-in" style={{animationDelay: `${index * 0.05}s`}}>
              <Link to={`/forum/${forum._id}`} className="forum-card-link">
                <Card className="forum-card">
                  <Card.Body className="forum-card-content">
                    <div className="forum-info">
                      <h3 className="forum-title">
                        {forum.name}
                        {forum.type === 'closed' && (
                          <BsLock className="forum-lock-icon" title="Forum privé" />
                        )}
                        {(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || isForumCreator(forum))) && (
                          <Button 
                            variant="link" 
                            className="delete-forum-btn text-danger"
                            onClick={(e) => handleDeleteForum(forum._id, e)}
                            disabled={deletingForum === forum._id}
                            title="Supprimer ce forum"
                          >
                            <BsTrash size={20} />
                          </Button>
                        )}
                      </h3>
                      <p className="forum-description">
                        {forum.description || "Aucune description disponible"}
                      </p>
                      
                      {/* Informations meta alignées */}
                      <div className="forum-meta-info">
                        <div className="forum-meta-item">
                          <BsCalendar className="forum-meta-icon" />
                          {forum.createdAt ? new Date(forum.createdAt).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric'
                          }) : 'Date inconnue'}
                        </div>
                        <div className="forum-meta-item">
                          <BsPerson className="forum-meta-icon" />
                          {forum.creator ? forum.creator.username : "Administrateur"}
                        </div>
                        <div className="forum-meta-item">
                          <BsChat className="forum-meta-icon" />
                          {typeof forum.messageCount === 'number' ? forum.messageCount : 0} message{(forum.messageCount !== 1) ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="forum-action">
                      <BsChevronRight size={20} />
                    </div>
                  </Card.Body>
                  <Card.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                    <div className="forum-badges">
                      <Badge bg={forum.type === 'open' ? 'primary' : 'secondary'} className="forum-badge">
                        {forum.type === 'open' ? 'Public' : 'Privé'}
                      </Badge>
                      {(forum.messageCount > 10 || forum.messageCount === 0) && (
                        <Badge bg={forum.messageCount > 0 ? "success" : "danger"} className="forum-badge">
                          {forum.messageCount > 10 ? 'Actif' : forum.messageCount === 0 ? 'Aucun message' : ''}
                        </Badge>
                      )}
                    </div>
                  </Card.Footer>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour créer un nouveau forum */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        centered
        className="forum-creation-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Créer un nouveau forum</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && (
            <Alert variant="danger" className="creation-error">
              {typeof createError === 'object' ? createError.msg || createError.message || JSON.stringify(createError) : createError}
            </Alert>
          )}
          <Form onSubmit={handleCreateForum}>
            <Form.Group className="mb-3">
              <Form.Label>Nom du forum *</Form.Label>
              <Form.Control 
                type="text" 
                value={newForumName}
                onChange={(e) => setNewForumName(e.target.value)}
                placeholder="Entrez le nom du forum"
                className="creation-input"
                required
              />
              <Form.Text className="text-muted">
                Choisissez un nom clair et descriptif (max 50 caractères)
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={newForumDescription}
                onChange={(e) => setNewForumDescription(e.target.value)}
                placeholder="Décrivez l'objectif de ce forum"
                className="creation-textarea"
                required
              />
              <Form.Text className="text-muted">
                Expliquez le sujet du forum et les règles de base
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type de forum</Form.Label>
              <div className="forum-type-options">
                <div 
                  className={`forum-type-option ${newForumType === 'open' ? 'selected' : ''}`}
                  onClick={() => setNewForumType('open')}
                >
                  <div className="option-icon">🌐</div>
                  <div className="option-info">
                    <h5>Public</h5>
                    <p>Visible et accessible par tous les membres</p>
                  </div>
                </div>
                <div 
                  className={`forum-type-option ${newForumType === 'closed' ? 'selected' : ''}`}
                  onClick={() => (currentUser.role === 'admin' || currentUser.role === 'superadmin') ? setNewForumType('closed') : setCreateError('Seuls les administrateurs peuvent créer des forums privés.')}
                >
                  <div className="option-icon">🔒</div>
                  <div className="option-info">
                    <h5>Privé {currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && <small>(Admin uniquement)</small>}</h5>
                    <p>Accès restreint aux administrateurs</p>
                  </div>
                </div>
              </div>
              {currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && newForumType === 'open' && (
                <Alert variant="info" className="mt-3">
                  En tant qu'utilisateur, vous ne pouvez créer que des forums publics.
                </Alert>
              )}
            </Form.Group>
            <div className="modal-actions">
              <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={creating || !newForumName || !newForumDescription || (newForumType === 'closed' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin')}
                className="create-button"
              >
                {creating ? 'Création en cours...' : 'Créer le forum'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ForumList; 