import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ListGroup, Button, Spinner, Alert, Table, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BsSearch } from 'react-icons/bs';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la liste des utilisateurs
      const usersRes = await axios.get('http://localhost:5000/api/users/', { 
        withCredentials: true 
      });
      
      // Récupérer la liste des utilisateurs en attente
      const pendingUsersRes = await axios.get('http://localhost:5000/api/users/pending', { 
        withCredentials: true 
      });
      
      // Récupérer la liste des forums
      const forumsRes = await axios.get('http://localhost:5000/api/forums/', { 
        withCredentials: true 
      });
      
      // Compter les messages
      const messagesRes = await axios.get('http://localhost:5000/api/messages/count', { 
        withCredentials: true 
      }).catch(err => {
        console.warn('Erreur lors du comptage des messages:', err);
        return { data: { count: 0 } }; // Valeur par défaut si l'API échoue
      });
      
      // Stocker la liste des utilisateurs
      setUsers(usersRes.data);
      setFilteredUsers(usersRes.data);
      
      // Calculer les statistiques
      setStats({
        totalUsers: usersRes.data.length,
        pendingUsers: pendingUsersRes.data.length,
        totalForums: forumsRes.data.length,
        totalMessages: messagesRes.data?.count || 0
      });
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données administratives');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Ajouter un effet pour rafraîchir les données lorsque l'utilisateur revient sur la page
  useEffect(() => {
    const handleFocus = () => {
      console.log("Fenêtre de retour au premier plan, actualisation des compteurs d'administration");
      fetchAdminData();
    };

    window.addEventListener('focus', handleFocus);
    
    // Rafraîchir régulièrement les statistiques
    const refreshInterval = setInterval(() => {
      fetchAdminData();
    }, 60000); // Rafraîchir toutes les 60 secondes
    
    // Nettoyage de l'écouteur d'événement et de l'intervalle
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, []);

  // Filtrer les utilisateurs lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(lowercasedSearch) || 
        user.email.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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

  // Fonction pour gérer la recherche
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
      
      {error && <Alert variant="danger">{typeof error === 'object' ? error.msg || error.message || JSON.stringify(error) : error}</Alert>}
      
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
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Utilisateurs inscrits</h4>
          <Form className="d-flex" style={{ width: '300px' }}>
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Rechercher un utilisateur..."
                aria-label="Rechercher"
                value={searchTerm}
                onChange={handleSearch}
              />
              <Button variant="outline-primary">
                <BsSearch />
              </Button>
            </InputGroup>
          </Form>
        </Card.Header>
        <Card.Body>
          {filteredUsers.length === 0 ? (
            <Alert variant="info">
              {searchTerm ? 'Aucun utilisateur correspondant à votre recherche' : 'Aucun utilisateur inscrit'}
            </Alert>
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
                {filteredUsers.map(user => (
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
                      <Button 
                        variant={user.role === 'admin' ? 'outline-secondary' : 'outline-primary'} 
                        size="sm"
                        onClick={() => handleRoleChange(
                          user._id, 
                          user.role === 'admin' ? 'user' : 'admin'
                        )}
                      >
                        {user.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                      </Button>
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
