import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/users/pending', { withCredentials: true });
        setPendingUsers(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs en attente');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  const handleUserValidation = async (userId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/users/validate/${userId}`, { status }, { withCredentials: true });
      
      // Mettre à jour la liste des utilisateurs en attente
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      
      setSuccess(`L'utilisateur a été ${status === 'active' ? 'validé' : 'rejeté'} avec succès`);
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Erreur lors de la ${status === 'active' ? 'validation' : 'rejet'} de l'utilisateur`);
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
      <h2 className="mb-4">Utilisateurs en attente de validation</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {pendingUsers.length === 0 ? (
        <Alert variant="info">Aucun utilisateur en attente de validation</Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleUserValidation(user._id, 'active')}
                      >
                        Valider
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleUserValidation(user._id, 'rejected')}
                      >
                        Rejeter
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default PendingUsers;
