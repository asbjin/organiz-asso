import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Nav, InputGroup, Button } from 'react-bootstrap';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import SearchResults from '../components/forums/SearchResults';
import { searchMessages } from '../redux/actions/messageActions';
import { useAuth } from '../contexts/AuthContext';
import { BsSearch, BsPersonFill, BsChatFill, BsFileTextFill } from 'react-icons/bs';
import axios from 'axios';
import '../components/forums/SearchStyles.css';

/**
 * Page de recherche de style LinkedIn
 */
const SearchPage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // États locaux
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'messages');
  const [userResults, setUserResults] = useState([]);
  const [forumResults, setForumResults] = useState([]);
  
  // Récupérer les résultats du state Redux
  const { messages, loading, error } = useSelector(state => state.messages);
  
  // Fonction pour effectuer la recherche
  const performSearch = (query, type) => {
    if (!query || query.trim() === '') {
      return;
    }
    
    setIsLoading(true);
    console.log(`Début recherche: ${type} pour "${query}"`);
    
    if (type === 'messages') {
      // Recherche de messages
      console.log('Envoi de la requête de recherche de messages');
      dispatch(searchMessages({
        keywords: query,
        sortBy: 'relevance',
        sortOrder: 'desc'
      }))
      .then((data) => {
        console.log('Résultats messages reçus:', data?.length || 0);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Erreur dans la recherche de messages:', err);
        setIsLoading(false);
      });
    } else if (type === 'users') {
      // Recherche d'utilisateurs
      const token = localStorage.getItem('authToken');
      const url = `http://localhost:5000/api/users/test-search?q=${encodeURIComponent(query)}`;
      console.log('Envoi de requête utilisateurs:', url);
      
      axios.get(url)
      .then(response => {
        console.log('Résultats utilisateurs reçus:', response.data?.length || 0);
        setUserResults(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error.response?.data || error.message);
        setUserResults([]);
        setIsLoading(false);
      });
    } else if (type === 'forums') {
      // Recherche de forums
      const token = localStorage.getItem('authToken');
      // Vérifier si l'utilisateur est admin pour choisir la route appropriée
      const isAdmin = currentUser && currentUser.role === 'admin';
      const endpoint = isAdmin ? 'admin-search' : 'test-search';
      const url = `http://localhost:5000/api/forums/${endpoint}?q=${encodeURIComponent(query)}`;
      
      console.log(`Envoi de requête forums (${isAdmin ? 'admin' : 'standard'}) sur "${query}" via ${endpoint}`);
      
      axios.get(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      .then(response => {
        console.log('Résultats forums reçus:', response.data?.length || 0, response.data);
        setForumResults(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Erreur lors de la recherche de forums:', error.response?.data || error.message);
        // Essayer la route de test en dernier recours
        if (endpoint !== 'test-search') {
          console.log('Tentative via route de test');
          const testUrl = `http://localhost:5000/api/forums/test-search?q=${encodeURIComponent(query)}`;
          
          axios.get(testUrl)
            .then(response => {
              console.log('Résultats forums reçus (fallback):', response.data?.length || 0);
              setForumResults(response.data);
              setIsLoading(false);
            })
            .catch(testError => {
              console.error('Échec de la recherche de forums:', testError.message);
              setForumResults([]);
              setIsLoading(false);
            });
        } else {
          setForumResults([]);
          setIsLoading(false);
        }
      });
    }
  };
  
  // Effet pour exécuter la recherche lors du chargement ou changement de URL
  useEffect(() => {
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'messages';
    
    if (!query || query.trim() === '') return;
    
    setSearchQuery(query);
    setSearchType(type);
    
    // Effectuer la recherche en fonction du type
    performSearch(query, type);
  }, [location.search]);
  
  // Fonction pour changer le type de recherche
  const handleTypeChange = (type) => {
    setSearchType(type);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
  };
  
  // Fonction pour soumettre la recherche
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
  };
  
  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Rendu du composant d'utilisateur
  const renderUserItem = (user) => (
    <div key={user._id} className="search-result-card p-3 mb-3">
      <div className="d-flex align-items-center">
        <div className="me-3">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.username} 
              className="rounded-circle" 
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
          ) : (
            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
              style={{ width: '50px', height: '50px' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h5 className="mb-1">{user.username}</h5>
          <p className="text-muted mb-0">
            {user.role === 'admin' ? 'Administrateur' : 'Membre'}
          </p>
        </div>
      </div>
    </div>
  );
  
  // Rendu du composant de forum
  const renderForumItem = (forum) => (
    <div key={forum._id} className="search-result-card p-3 mb-3">
      <div className="d-flex align-items-center">
        <div className="me-3">
          <div className="rounded bg-light d-flex align-items-center justify-content-center" 
            style={{ width: '50px', height: '50px' }}>
            <BsChatFill size={24} className="text-primary" />
          </div>
        </div>
        <div>
          <h5 className="mb-1">{forum.name}</h5>
          <p className="text-muted mb-0">
            {forum.type === 'closed' ? 'Forum privé' : 'Forum public'}
          </p>
          <small className="text-muted">{forum.description?.substring(0, 100)}...</small>
        </div>
      </div>
    </div>
  );
  
  return (
    <Container className="py-4">
      <div className="search-page mb-4">
        <h1 className="mb-4">Recherche</h1>
        
        {/* Formulaire de recherche */}
        <Form onSubmit={handleSubmit} className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Rechercher dans Organiz'asso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <Button type="submit" variant="primary">
              <BsSearch />
            </Button>
          </InputGroup>
        </Form>
        
        {/* Onglets de navigation */}
        <Nav variant="tabs" className="search-tabs mb-4">
          <Nav.Item>
            <Nav.Link 
              active={searchType === 'messages'} 
              onClick={() => handleTypeChange('messages')}
              className="d-flex align-items-center"
            >
              <BsFileTextFill className="me-2" />
              Messages
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={searchType === 'users'} 
              onClick={() => handleTypeChange('users')}
              className="d-flex align-items-center"
            >
              <BsPersonFill className="me-2" />
              Personnes
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={searchType === 'forums'} 
              onClick={() => handleTypeChange('forums')}
              className="d-flex align-items-center"
            >
              <BsChatFill className="me-2" />
              Forums
            </Nav.Link>
          </Nav.Item>
        </Nav>
        
        {/* Résultats de recherche */}
        {searchQuery && location.search.includes('q=') && (
          <div className="search-results">
            <h2 className="h5 mb-3">
              Résultats pour "{searchQuery}" dans {searchType === 'messages' ? 'les messages' : 
              searchType === 'users' ? 'les personnes' : 'les forums'}
            </h2>
            
            {isLoading || loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Recherche en cours...</span>
                </div>
                <div className="mt-3">Recherche en cours...</div>
              </div>
            ) : (
              <>
                {searchType === 'messages' && (
                  <SearchResults
                    results={Array.isArray(messages) ? messages : []} 
                    searchQuery={searchQuery}
                    isLoading={false}
                  />
                )}
                
                {searchType === 'users' && (
                  <div className="user-results">
                    {userResults.length > 0 ? (
                      userResults.map(renderUserItem)
                    ) : (
                      <div className="text-center py-4">
                        <p>Aucun utilisateur trouvé pour "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
                
                {searchType === 'forums' && (
                  <div className="forum-results">
                    {forumResults.length > 0 ? (
                      forumResults.map(renderForumItem)
                    ) : (
                      <div className="text-center py-4">
                        <p>Aucun forum trouvé pour "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger" role="alert">
            Une erreur est survenue lors de la recherche: {error.msg || error.message || JSON.stringify(error)}
          </div>
        )}
      </div>
    </Container>
  );
};

export default SearchPage; 