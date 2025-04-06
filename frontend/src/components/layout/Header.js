import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Organiz'asso</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {currentUser ? (
              <>
                <Nav.Link as={Link} to="/">Forums</Nav.Link>
                {isAdmin && (
                  <NavDropdown title="Administration" id="admin-dropdown">
                    <NavDropdown.Item as={Link} to="/admin">Tableau de bord</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/pending-users">Utilisateurs en attente</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/forums">Gérer les forums</NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Connexion</Nav.Link>
                <Nav.Link as={Link} to="/register">Inscription</Nav.Link>
              </>
            )}
          </Nav>
          {currentUser && (
            <Nav>
              <NavDropdown title={currentUser.username} id="user-dropdown">
                <NavDropdown.Item as={Link} to={`/profile/${currentUser.id}`}>Mon profil</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/profile/edit">Modifier mon profil</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Déconnexion</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
