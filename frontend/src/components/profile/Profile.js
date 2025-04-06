import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, ListGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('ID du profil demandé:', id);
    console.log('Utilisateur actuel:', currentUser);
    
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les informations du profil
        console.log('Envoi requête pour profil:', `http://localhost:5000/api/users/profile/${id}`);
        const profileRes = await axios.get(`http://localhost:5000/api/users/profile/${id}`, { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }).catch(err => {
          console.error('Erreur réponse profil:', err.response?.data || err.message);
          throw err;
        });
        
        console.log('Réponse profil:', profileRes.data);
        setProfile(profileRes.data);
        
        // Récupérer les messages de l'utilisateur
        const messagesRes = await axios.get(`http://localhost:5000/api/messages/user/${id}`, { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }).catch(err => {
          console.warn('Erreur récupération messages:', err.response?.data || err.message);
          // On continue même si les messages ne sont pas récupérés
          return { data: [] };
        });
        
        setMessages(messagesRes.data);
        setError('');
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
        if (err.response?.status === 404) {
          setError(`Utilisateur avec l'ID ${id} non trouvé.`);
        } else {
          setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileData();
    } else {
      setError('ID utilisateur manquant');
      setLoading(false);
    }
  }, [id, currentUser]);

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

  if (!profile) {
    return <Alert variant="warning">Profil non trouvé</Alert>;
  }

  return (
    <div>
      <h2 className="mb-4">Profil de {profile.username}</h2>
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body className="text-center">
              <img
                src={profile.profilePicture || "https://via.placeholder.com/150"}
                alt={profile.username}
                className="rounded-circle mb-3"
                width="150"
                height="150"
              />
              <h4>{profile.username}</h4>
              <p className="text-muted">{profile.email}</p>
              
              <div className="mb-3">
                <Badge bg={profile.role === 'admin' ? 'danger' : 'primary'}>
                  {profile.role === 'admin' ? 'Administrateur' : 'Membre'}
                </Badge>
              </div>
              
              {profile.bio && (
                <div className="mt-3">
                  <h5>Bio</h5>
                  <p>{profile.bio}</p>
                </div>
              )}
              
              <div className="mt-3">
                <p className="text-muted">
                  Membre depuis: {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                {profile.lastLogin && (
                  <p className="text-muted">
                    Dernière connexion: {new Date(profile.lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header>
              <h4>Messages récents</h4>
            </Card.Header>
            <ListGroup variant="flush">
              {messages.length === 0 ? (
                <ListGroup.Item>Aucun message publié</ListGroup.Item>
              ) : (
                messages.map(message => (
                  <ListGroup.Item key={message._id}>
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6>Forum: {message.forum.name}</h6>
                        <p>{message.content.length > 100 ? `${message.content.substring(0, 100)}...` : message.content}</p>
                      </div>
                      <small className="text-muted">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
