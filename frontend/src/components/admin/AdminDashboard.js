import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ListGroup, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalForums: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les statistiques
        const usersRes = await axios.get('http://localhost:5000/api/users', { withCredentials: true });
        const pendingUsersRes = await axios.get('http://localhost:5000/api/users/pending', { withCredentials: true });
        const forumsRes = await axios.get('http://localhost:5000/api/forums', { withCredentials: true });
        
        // Stocker la liste des utilisateurs
        setUsers(usersRes.data);
        
        // Calculer les statistiques
        setStats({
          totalUsers: usersRes.data.length,
          pendingUsers: pendingUsersRes.data.length,
          totalForums: forumsRes.data.length,
          totalMessages: 0 // À implémenter: endpoint pour compter les messages
        });
        
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des données administratives');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Fonction pour changer le rôle d'un utilisateur
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:5000/api/users/role/${userId}`, { 
        role: newRole 
      }, { withCredentials: true });
      
      // Mettre à jour la liste des utilisateurs avec le nouveau rôle
      setUsers(users.map(user => {
        if (user._id === userId) {
          return { ...user, role: newRole };
        }
        return user;
      }));
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du rôle');
      console.error(err);
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
      <h2 className="mb-4">Tableau de bord administrateur</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3>{stats.totalUsers}</h3>
              <p>Utilisateurs inscrits</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-warning text-white">
            <Card.Body>
              <h3>{stats.pendingUsers}</h3>
              <p>Utilisateurs en attente</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3>{stats.totalForums}</h3>
              <p>Forums</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3>{stats.totalMessages}</h3>
              <p>Messages</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Utilisateurs en attente</h4>
              <Button as={Link} to="/admin/pending-users" variant="primary" size="sm">
                Gérer
              </Button>
            </Card.Header>
            <Card.Body>
              {stats.pendingUsers === 0 ? (
                <Alert variant="info">Aucun utilisateur en attente de validation</Alert>
              ) : (
                <Alert variant="warning">
                  {stats.pendingUsers} utilisateur(s) en attente de validation
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestion des forums</h4>
              <Button as={Link} to="/admin/forums" variant="primary" size="sm">
                Gérer
              </Button>
            </Card.Header>
            <Card.Body>
              <p>Créer, modifier ou supprimer des forums</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Liste des utilisateurs inscrits */}
      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Utilisateurs inscrits</h4>
        </Card.Header>
        <Card.Body>
          {users.length === 0 ? (
            <Alert variant="info">Aucun utilisateur inscrit</Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Rôle</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <Link to={`/profile/${user._id}`} className="text-decoration-none">
                        {user.username}
                      </Link>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.status === 'active' && <Badge bg="success">Actif</Badge>}
                      {user.status === 'pending' && <Badge bg="warning">En attente</Badge>}
                      {user.status === 'rejected' && <Badge bg="danger">Rejeté</Badge>}
                    </td>
                    <td>
                      {user.role === 'admin' ? (
                        <Badge bg="primary">Administrateur</Badge>
                      ) : (
                        <Badge bg="secondary">Membre</Badge>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.status === 'active' && (
                        <>
                          {user.role === 'admin' ? (
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => handleRoleChange(user._id, 'member')}
                            >
                              Rétrograder
                            </Button>
                          ) : (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleRoleChange(user._id, 'admin')}
                            >
                              Promouvoir
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;
