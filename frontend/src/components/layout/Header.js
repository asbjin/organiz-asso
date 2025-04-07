import React, { useState, useRef, useEffect } from 'react';
import { Navbar, Container, Nav, Button, NavDropdown, Form, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';
import { BsSearch, BsHouseDoor, BsChat, BsPersonCircle, BsGear, BsBoxArrowRight, BsShieldCheck, BsX, BsList } from 'react-icons/bs';

function Header() {
  const { currentUser: user, isAuthenticated, logout } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Débogage: Afficher l'objet utilisateur complet
  useEffect(() => {
    if (user) {
      console.log('Détails de l\'utilisateur actuel:', JSON.stringify(user, null, 2));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Rediriger vers la page de recherche avec la requête comme paramètre
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=messages`);
    setShowMobileSearch(false);
  };

  // Obtenir les initiales du nom d'utilisateur pour l'avatar
  const getUserInitials = () => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <Navbar fixed="top" expand="lg" className="reddit-header">
      <Container fluid className="header-container">
        <Navbar.Brand as={Link} to="/" className="header-brand">
          <div className="brand-logo">O</div>
          <span className="brand-text">Organiz'asso</span>
        </Navbar.Brand>

        {/* Recherche pour desktop */}
        <div className="search-container d-none d-md-block">
          <Form onSubmit={handleSearch} className="w-100">
            <div className="position-relative d-flex align-items-center">
              <Form.Control
                type="text"
                placeholder="Rechercher dans Organiz'asso..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="position-absolute end-0 search-btn">
                <BsSearch />
              </Button>
            </div>
          </Form>
        </div>

        {/* Icône de recherche mobile */}
        <div className="d-md-none ml-auto d-flex align-items-center">
          <Button 
            variant="link" 
            className="mobile-search-icon" 
            onClick={toggleMobileSearch}
          >
            <BsSearch />
          </Button>
        </div>

        <Navbar.Toggle 
          aria-controls="navbar-nav" 
          className="header-toggle" 
          onClick={() => setShowOffcanvas(true)}
        >
          <BsList />
        </Navbar.Toggle>

        <Navbar.Offcanvas
          id="navbar-offcanvas"
          aria-labelledby="navbar-offcanvas-label"
          placement="end"
          show={showOffcanvas}
          onHide={() => setShowOffcanvas(false)}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="navbar-offcanvas-label">Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="header-nav">
              {isAuthenticated ? (
                <>
                  <Nav.Link as={Link} to="/" className="nav-item">
                    <BsHouseDoor className="nav-icon" />
                    <span className="nav-text">Accueil</span>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/forums" className="nav-item">
                    <BsChat className="nav-icon" />
                    <span className="nav-text">Forums</span>
                  </Nav.Link>
                  {user && (user.role === 'admin' || user.role === 'superadmin') && (
                    <Nav.Link as={Link} to="/admin" className="nav-item">
                      <BsShieldCheck className="nav-icon" />
                      <span className="nav-text">Admin</span>
                    </Nav.Link>
                  )}
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login" className="nav-item">
                    <span className="nav-text">Connexion</span>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/register" className="nav-item">
                    <span className="nav-text">Inscription</span>
                  </Nav.Link>
                </>
              )}
            </Nav>

            {isAuthenticated && (
              <div className="user-section">
                <NavDropdown 
                  title={
                    <div className="user-dropdown-toggle">
                      <div className="avatar">{getUserInitials()}</div>
                      <div className="user-info d-none d-lg-block">
                        <span className="username">{user?.username}</span>
                      </div>
                    </div>
                  } 
                  id="user-dropdown"
                  align="end"
                  className="user-dropdown"
                >
                  <div className="dropdown-header">
                    <div className="user-greeting">Connecté en tant que</div>
                    <div className="user-name">{user?.username}</div>
                  </div>
                  <NavDropdown.Item 
                    as={Link} 
                    to={user && user.id ? `/profile/${user.id}` : '#'} 
                    onClick={(e) => {
                      if (!user || !user.id) {
                        e.preventDefault();
                        console.error('ID utilisateur non disponible', user);
                        alert('Impossible d\'accéder au profil. Veuillez vous reconnecter.');
                      } else {
                        console.log('Navigation vers le profil avec ID:', user.id);
                      }
                    }}
                    className="dropdown-item"
                  >
                    <BsPersonCircle className="dropdown-icon" />
                    Mon profil
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/profile/edit" className="dropdown-item">
                    <BsGear className="dropdown-icon" />
                    Paramètres
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="dropdown-item logout-item">
                    <BsBoxArrowRight className="dropdown-icon" />
                    Déconnexion
                  </NavDropdown.Item>
                </NavDropdown>
              </div>
            )}
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>

      {/* Barre de recherche mobile */}
      {showMobileSearch && (
        <div className="mobile-search-bar">
          <Form onSubmit={handleSearch} className="d-flex align-items-center">
            <Form.Control
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher dans Organiz'asso..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              variant="link" 
              className="search-close" 
              onClick={() => setShowMobileSearch(false)}
            >
              <BsX />
            </Button>
          </Form>
        </div>
      )}
    </Navbar>
  );
}

export default Header;
