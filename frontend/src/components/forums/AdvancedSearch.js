import React, { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Button, Card, InputGroup, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BsSearch, 
  BsX, 
  BsCalendar, 
  BsPerson, 
  BsChat, 
  BsFilter, 
  BsSortDown,
  BsSortUp
} from 'react-icons/bs';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { searchMessages } from '../../redux/actions/messageActions';
import './SearchStyles.css';

/**
 * Composant de recherche avancée pour les messages
 */
const AdvancedSearch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // États pour la recherche
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('oneWord'); // 'oneWord', 'allWords', 'exactPhrase'
  
  // États pour les suggestions et l'autocomplétion
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [forumSuggestions, setForumSuggestions] = useState([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showForumSuggestions, setShowForumSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  
  // Références pour gérer les clics en dehors des suggestions
  const authorInputRef = useRef(null);
  const forumInputRef = useRef(null);
  
  // Formulaire de recherche
  const [formValues, setFormValues] = useState({
    keywords: searchParams.get('q') || '',
    author: searchParams.get('author') || '',
    forum: searchParams.get('forum') || '',
    forumId: searchParams.get('forumId') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    sortBy: searchParams.get('sortBy') || 'date',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });
  
  // Effet pour gérer les clics en dehors des suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (authorInputRef.current && !authorInputRef.current.contains(event.target)) {
        setShowAuthorSuggestions(false);
      }
      if (forumInputRef.current && !forumInputRef.current.contains(event.target)) {
        setShowForumSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Effet pour charger la recherche initiale si des paramètres sont présents
  useEffect(() => {
    if (location.search) {
      handleSearch();
    }
  }, [location.search]);
  
  // Fonction de gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Gestion de l'autocomplétion
    if (name === 'author' && value.length >= 2) {
      fetchAuthorSuggestions(value);
      setShowAuthorSuggestions(true);
    } else if (name === 'author') {
      setShowAuthorSuggestions(false);
    }
    
    if (name === 'forum' && value.length >= 2) {
      fetchForumSuggestions(value);
      setShowForumSuggestions(true);
    } else if (name === 'forum') {
      setShowForumSuggestions(false);
    }
  };
  
  // Fonction pour récupérer les suggestions d'auteurs
  const fetchAuthorSuggestions = async (query) => {
    try {
      // Récupérer le token d'authentification du localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/users/autocomplete?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAuthorSuggestions(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions d\'auteurs:', error);
    }
  };
  
  // Fonction pour récupérer les suggestions de forums
  const fetchForumSuggestions = async (query) => {
    try {
      // Récupérer le token d'authentification du localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/forums/autocomplete?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setForumSuggestions(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions de forums:', error);
    }
  };
  
  // Fonction de sélection d'une suggestion d'auteur
  const selectAuthorSuggestion = (author) => {
    setFormValues(prev => ({
      ...prev,
      author: author.username
    }));
    setShowAuthorSuggestions(false);
  };
  
  // Fonction de sélection d'une suggestion de forum
  const selectForumSuggestion = (forum) => {
    setFormValues(prev => ({
      ...prev,
      forum: forum.name,
      forumId: forum._id
    }));
    setShowForumSuggestions(false);
  };
  
  // Fonction de gestion de la navigation au clavier dans les suggestions
  const handleKeyDown = (e, suggestionsList, selectFn) => {
    // Touche Échap: fermer les suggestions
    if (e.key === 'Escape') {
      setShowAuthorSuggestions(false);
      setShowForumSuggestions(false);
      return;
    }
    
    if (!suggestionsList.length) return;
    
    // Touche flèche bas
    if (e.key === 'ArrowDown') {
      setActiveSuggestionIndex(prev => 
        prev < suggestionsList.length - 1 ? prev + 1 : 0
      );
      e.preventDefault();
    }
    // Touche flèche haut
    else if (e.key === 'ArrowUp') {
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestionsList.length - 1
      );
      e.preventDefault();
    }
    // Touche Entrée: sélectionner la suggestion active
    else if (e.key === 'Enter' && suggestionsList.length > 0) {
      selectFn(suggestionsList[activeSuggestionIndex]);
      e.preventDefault();
    }
  };
  
  // Fonction pour réinitialiser le formulaire
  const handleReset = () => {
    setFormValues({
      keywords: '',
      author: '',
      forum: '',
      forumId: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
    
    // Nettoyer l'URL et revenir à la page de recherche sans paramètres
    navigate('/search');
  };
  
  // Fonction pour basculer l'affichage des options avancées
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };
  
  // Fonction pour effectuer la recherche
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    // Construction des paramètres de requête
    const queryParams = new URLSearchParams();
    
    // Préparation des mots-clés selon le mode de recherche
    let preparedKeywords = formValues.keywords;
    if (formValues.keywords) {
      if (searchMode === 'allWords') {
        preparedKeywords = formValues.keywords.split(/\s+/).filter(Boolean).join(' AND ');
      } else if (searchMode === 'exactPhrase') {
        preparedKeywords = `"${formValues.keywords}"`;
      }
      queryParams.set('q', formValues.keywords);
    }
    
    // Ajout des autres paramètres
    if (formValues.author) queryParams.set('author', formValues.author);
    if (formValues.forum) queryParams.set('forum', formValues.forum);
    if (formValues.forumId) queryParams.set('forumId', formValues.forumId);
    if (formValues.startDate) queryParams.set('startDate', formValues.startDate);
    if (formValues.endDate) queryParams.set('endDate', formValues.endDate);
    if (formValues.sortBy) queryParams.set('sortBy', formValues.sortBy);
    if (formValues.sortOrder) queryParams.set('sortOrder', formValues.sortOrder);
    
    // Ajouter le mode de recherche
    queryParams.set('mode', searchMode);
    
    // Mettre à jour l'URL
    navigate(`/search?${queryParams.toString()}`);
    
    // Démarrer la recherche
    setIsLoading(true);
    
    dispatch(searchMessages({
      keywords: preparedKeywords,
      author: formValues.author,
      forumId: formValues.forumId,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      sortBy: formValues.sortBy,
      sortOrder: formValues.sortOrder,
      searchMode
    }))
    .then(() => {
      setIsLoading(false);
    })
    .catch(() => {
      setIsLoading(false);
    });
  };

  // Fonction pour générer l'avatar pour une suggestion d'auteur
  const renderUserAvatar = (user) => {
    if (user.profilePicture) {
      return <div className="suggestion-avatar"><img src={user.profilePicture} alt={user.username} /></div>;
    }
    return <div className="suggestion-avatar">{user.username.charAt(0).toUpperCase()}</div>;
  };
  
  return (
    <Card className="search-container">
      <Card.Body>
        <div className="search-header">
          <h1 className="search-title">Recherche de messages</h1>
        </div>
        
        <Form onSubmit={handleSearch}>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label htmlFor="keywords" className="visually-hidden">Rechercher des messages</Form.Label>
                <InputGroup>
                  <Form.Control
                    id="keywords"
                    name="keywords"
                    type="text"
                    placeholder="Mot-clé, auteur, contenu..."
                    value={formValues.keywords}
                    onChange={handleChange}
                    aria-label="Rechercher des messages"
                  />
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isLoading}
                    aria-label="Rechercher"
                  >
                    {isLoading ? 
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                      <BsSearch />
                    }
                  </Button>
                  {formValues.keywords && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setFormValues(prev => ({ ...prev, keywords: '' }))}
                      aria-label="Effacer la recherche"
                    >
                      <BsX />
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between mb-3">
            <div className="search-mode-selector">
              <Form.Check
                inline
                type="radio"
                id="searchMode-oneWord"
                name="searchMode"
                label="Un des mots"
                checked={searchMode === 'oneWord'}
                onChange={() => setSearchMode('oneWord')}
                className="search-mode-label"
              />
              <Form.Check
                inline
                type="radio"
                id="searchMode-allWords"
                name="searchMode"
                label="Tous les mots"
                checked={searchMode === 'allWords'}
                onChange={() => setSearchMode('allWords')}
                className="search-mode-label"
              />
              <Form.Check
                inline
                type="radio"
                id="searchMode-exactPhrase"
                name="searchMode"
                label="Expression exacte"
                checked={searchMode === 'exactPhrase'}
                onChange={() => setSearchMode('exactPhrase')}
                className="search-mode-label"
              />
            </div>
            
            <Button 
              variant="link" 
              onClick={toggleAdvanced}
              className="text-decoration-none"
              aria-expanded={showAdvanced}
              aria-controls="advanced-search-options"
            >
              <BsFilter className="me-1" />
              {showAdvanced ? 'Masquer les filtres' : 'Afficher les filtres'}
            </Button>
          </div>

          {showAdvanced && (
            <div id="advanced-search-options" className="search-filters">
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="position-relative" ref={authorInputRef}>
                    <Form.Label htmlFor="author">Auteur</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><BsPerson /></InputGroup.Text>
                      <Form.Control
                        id="author"
                        name="author"
                        type="text"
                        placeholder="Nom de l'auteur"
                        value={formValues.author}
                        onChange={handleChange}
                        onFocus={() => formValues.author.length >= 2 && setShowAuthorSuggestions(true)}
                        onKeyDown={(e) => handleKeyDown(e, authorSuggestions, selectAuthorSuggestion)}
                        autoComplete="off"
                      />
                      {formValues.author && (
                        <Button 
                          variant="outline-secondary"
                          onClick={() => setFormValues(prev => ({ ...prev, author: '' }))}
                        >
                          <BsX />
                        </Button>
                      )}
                    </InputGroup>
                    
                    {showAuthorSuggestions && authorSuggestions.length > 0 && (
                      <div className="autocomplete-suggestions">
                        {authorSuggestions.map((author, index) => (
                          <div
                            key={author._id}
                            className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                            onClick={() => selectAuthorSuggestion(author)}
                          >
                            {renderUserAvatar(author)}
                            <span>{author.username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="position-relative" ref={forumInputRef}>
                    <Form.Label htmlFor="forum">Forum</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><BsChat /></InputGroup.Text>
                      <Form.Control
                        id="forum"
                        name="forum"
                        type="text"
                        placeholder="Nom du forum"
                        value={formValues.forum}
                        onChange={handleChange}
                        onFocus={() => formValues.forum.length >= 2 && setShowForumSuggestions(true)}
                        onKeyDown={(e) => handleKeyDown(e, forumSuggestions, selectForumSuggestion)}
                        autoComplete="off"
                      />
                      {formValues.forum && (
                        <Button 
                          variant="outline-secondary"
                          onClick={() => setFormValues(prev => ({ ...prev, forum: '', forumId: '' }))}
                        >
                          <BsX />
                        </Button>
                      )}
                    </InputGroup>
                    
                    {showForumSuggestions && forumSuggestions.length > 0 && (
                      <div className="autocomplete-suggestions">
                        {forumSuggestions.map((forum, index) => (
                          <div
                            key={forum._id}
                            className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                            onClick={() => selectForumSuggestion(forum)}
                          >
                            <span>{forum.name}</span>
                            <Badge 
                              bg={forum.type === 'public' ? 'success' : 'warning'} 
                              className="ms-2"
                            >
                              {forum.type === 'public' ? 'Public' : 'Privé'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Label>Plage de dates</Form.Label>
                  <div className="date-range-container">
                    <div className="date-picker-container">
                      <InputGroup>
                        <InputGroup.Text><BsCalendar /></InputGroup.Text>
                        <Form.Control
                          id="startDate"
                          name="startDate"
                          type="date"
                          placeholder="Date de début"
                          value={formValues.startDate}
                          onChange={handleChange}
                          aria-label="Date de début"
                        />
                      </InputGroup>
                    </div>
                    <div className="date-picker-container">
                      <InputGroup>
                        <InputGroup.Text><BsCalendar /></InputGroup.Text>
                        <Form.Control
                          id="endDate"
                          name="endDate"
                          type="date"
                          placeholder="Date de fin"
                          value={formValues.endDate}
                          onChange={handleChange}
                          aria-label="Date de fin"
                        />
                      </InputGroup>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="sortBy">Trier par</Form.Label>
                    <Form.Select
                      id="sortBy"
                      name="sortBy"
                      value={formValues.sortBy}
                      onChange={handleChange}
                    >
                      <option value="date">Date</option>
                      <option value="author">Auteur</option>
                      <option value="relevance">Pertinence</option>
                      <option value="likes">Popularité</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="sortOrder">Ordre</Form.Label>
                    <InputGroup>
                      <Form.Select
                        id="sortOrder"
                        name="sortOrder"
                        value={formValues.sortOrder}
                        onChange={handleChange}
                      >
                        <option value="desc">Décroissant</option>
                        <option value="asc">Croissant</option>
                      </Form.Select>
                      <InputGroup.Text>
                        {formValues.sortOrder === 'desc' ? <BsSortDown /> : <BsSortUp />}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleReset}
                  className="me-2"
                >
                  Réinitialiser
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <BsSearch className="me-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AdvancedSearch; 