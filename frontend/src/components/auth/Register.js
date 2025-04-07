import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    // Réinitialiser les erreurs
    setError('');

    // Vérifier que tous les champs sont remplis
    if (!username || !email || !password || !confirmPassword) {
      setError('Tous les champs sont obligatoires');
      return false;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await register(username, email, password);
      setSuccess(response.message || 'Inscription réussie. Votre compte est en attente de validation par un administrateur.');
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(
        err.response?.data?.message || 
        'Échec de l\'inscription. Veuillez réessayer plus tard.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center">
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Inscription</h2>
            {error && <Alert variant="danger">{typeof error === 'object' ? error.msg || error.message || JSON.stringify(error) : error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="username" className="mb-3">
                <Form.Label>Nom d'utilisateur</Form.Label>
                <Form.Control 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </Form.Group>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <Form.Text className="text-muted">
                  Le mot de passe doit contenir au moins 6 caractères.
                </Form.Text>
              </Form.Group>
              <Form.Group id="password-confirm" className="mb-3">
                <Form.Label>Confirmer le mot de passe</Form.Label>
                <Form.Control 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </Form.Group>
              <Button disabled={loading} className="w-100" type="submit">
                {loading ? 'Chargement...' : 'S\'inscrire'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Déjà un compte? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </Container>
  );
};

export default Register;
