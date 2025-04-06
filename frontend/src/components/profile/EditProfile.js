import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EditProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/users/profile/${currentUser.id}`, { withCredentials: true });
        
        setFormData({
          username: res.data.username || '',
          email: res.data.email || '',
          bio: res.data.bio || '',
          profilePicture: res.data.profilePicture || ''
        });
        
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des données du profil');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

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
      setSubmitting(true);
      setError('');
      
      const res = await axios.put(`http://localhost:5000/api/users/profile/${currentUser.id}`, formData, { withCredentials: true });
      
      setSuccess('Profil mis à jour avec succès');
      
      // Rediriger vers la page de profil après 2 secondes
      setTimeout(() => {
        navigate(`/profile/${currentUser.id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSubmitting(false);
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
      <h2 className="mb-4">Modifier mon profil</h2>
      
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom d'utilisateur</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Parlez-nous de vous..."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>URL de la photo de profil</Form.Label>
              <Form.Control
                type="text"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleChange}
                placeholder="https://exemple.com/image.jpg"
              />
              <Form.Text className="text-muted">
                Entrez l'URL d'une image pour votre photo de profil
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate(`/profile/${currentUser.id}`)}>
                Annuler
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditProfile;
