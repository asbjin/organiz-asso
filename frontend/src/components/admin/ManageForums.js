import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const ManageForums = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // État pour le modal de création/modification
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [currentForum, setCurrentForum] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'open'
  });

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/forums', { withCredentials: true });
      setForums(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des forums');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, forum = null) => {
    setModalMode(mode);
    
    if (mode === 'edit' && forum) {
      setCurrentForum(forum);
      setFormData({
        name: forum.name,
        description: forum.description,
        type: forum.type
      });
    } else {
      setCurrentForum(null);
      setFormData({
        name: '',
        description: '',
        type: 'open'
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await axios.post('http://localhost:5000/api/forums', formData, { withCredentials: true });
        setSuccess('Forum créé avec succès');
      } else {
        await axios.put(`http://localhost:5000/api/forums/${currentForum._id}`, formData, { withCredentials: true });
        setSuccess('Forum mis à jour avec succès');
      }
      
      // Fermer le modal et rafraîchir la liste des forums
      handleCloseModal();
      fetchForums();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Erreur lors de la ${modalMode === 'create' ? 'création' : 'modification'} du forum`);
    }
  };

  const handleDeleteForum = async (forumId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce forum ? Tous les messages associés seront également supprimés.')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/forums/${forumId}`, { withCredentials: true });
      
      // Mettre à jour la liste des forums
      setForums(forums.filter(forum => forum._id !== forumId));
      
      setSuccess('Forum supprimé avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du forum');
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des forums</h2>
        <Button variant="success" onClick={() => handleOpenModal('create')}>
          Créer un nouveau forum
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {forums.length === 0 ? (
        <Alert variant="info">Aucun forum disponible. Créez votre premier forum !</Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Créé par</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forums.map(forum => (
                  <tr key={forum._id}>
                    <td>{forum.name}</td>
                    <td>{forum.description}</td>
                    <td>{forum.type === 'open' ? 'Ouvert' : 'Fermé'}</td>
                    <td>{forum.createdBy?.username || 'Administrateur'}</td>
                    <td>{new Date(forum.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleOpenModal('edit', forum)}
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteForum(forum._id)}
                      >
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      
      {/* Modal pour créer/modifier un forum */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Créer un nouveau forum' : 'Modifier le forum'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom du forum</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Type de forum</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="open">Ouvert (accessible à tous les membres)</option>
                <option value="closed">Fermé (réservé aux administrateurs)</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ManageForums;
