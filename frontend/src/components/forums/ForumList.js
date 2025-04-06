import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getForums } from '../../services/forumService';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ForumList = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  
  // États pour le modal de création de forum
  const [showModal, setShowModal] = useState(false);
  const [newForumName, setNewForumName] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  const [newForumType, setNewForumType] = useState('open');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

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
      setForums(data);
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

  if (authLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement de l'authentification...</span>
        </Spinner>
        <p className="mt-2">Vérification de l'authentification...</p>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement des forums...</span>
        </Spinner>
        <p className="mt-2">Chargement des forums...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button variant="outline-primary" onClick={fetchForums}>Réessayer</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Forums disponibles</h2>
        {currentUser && (
          <Button variant="success" onClick={() => setShowModal(true)}>
            Créer un forum
          </Button>
        )}
      </div>

      {forums.length === 0 ? (
        <Alert variant="info">
          Aucun forum disponible pour le moment.
        </Alert>
      ) : (
        <Row>
          {forums.map((forum) => (
            <Col key={forum._id} md={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{forum.name}</Card.Title>
                  <Card.Text>{forum.description}</Card.Text>
                  <Link to={`/forum/${forum._id}`}>
                    <Button variant="primary">Voir le forum</Button>
                  </Link>
                </Card.Body>
                <Card.Footer className="text-muted">
                  {forum.messageCount || 0} messages · Créé le {new Date(forum.createdAt).toLocaleDateString()}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal pour créer un nouveau forum */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Créer un nouveau forum</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          <Form onSubmit={handleCreateForum}>
            <Form.Group className="mb-3">
              <Form.Label>Nom du forum *</Form.Label>
              <Form.Control 
                type="text" 
                value={newForumName}
                onChange={(e) => setNewForumName(e.target.value)}
                placeholder="Entrez le nom du forum"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={newForumDescription}
                onChange={(e) => setNewForumDescription(e.target.value)}
                placeholder="Décrivez l'objectif de ce forum"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type de forum</Form.Label>
              <Form.Select 
                value={newForumType}
                onChange={(e) => setNewForumType(e.target.value)}
              >
                <option value="open">Public</option>
                <option value="closed">Privé</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button variant="success" type="submit" disabled={creating}>
                {creating ? 'Création...' : 'Créer le forum'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ForumList;
