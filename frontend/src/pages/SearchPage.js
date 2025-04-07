import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import AdvancedSearch from '../components/forums/AdvancedSearch';
import SearchResults from '../components/forums/SearchResults';
import { searchMessages } from '../redux/actions/messageActions';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page de recherche avancée
 */
const SearchPage = () => {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Récupérer les résultats du state Redux
  const { messages, loading, error } = useSelector(state => state.messages);
  
  // Effet pour exécuter la recherche lors du chargement ou changement de URL
  useEffect(() => {
    const query = searchParams.get('q');
    const author = searchParams.get('author');
    const forumId = searchParams.get('forumId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const searchMode = searchParams.get('mode') || 'oneWord';
    
    // Si nous avons des paramètres de recherche, exécuter la recherche
    if (query || author || forumId || startDate || endDate) {
      setIsLoading(true);
      
      // Préparation des mots-clés selon le mode de recherche
      let preparedKeywords = query || '';
      if (query) {
        if (searchMode === 'allWords') {
          preparedKeywords = query.split(/\s+/).filter(Boolean).join(' AND ');
        } else if (searchMode === 'exactPhrase') {
          preparedKeywords = `"${query}"`;
        }
      }
      
      dispatch(searchMessages({
        keywords: preparedKeywords,
        author,
        forumId,
        startDate,
        endDate,
        sortBy: sortBy || 'date',
        sortOrder: sortOrder || 'desc',
        searchMode
      }))
      .then(() => {
        setIsLoading(false);
        setHasSearched(true);
      })
      .catch(() => {
        setIsLoading(false);
        setHasSearched(true);
      });
    }
  }, [dispatch, location.search]);
  
  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <AdvancedSearch />
        </Col>
      </Row>
      {(hasSearched || messages.length > 0) && (
        <Row>
          <Col>
            <SearchResults 
              results={messages} 
              searchQuery={searchParams.get('q') || ''} 
              isLoading={isLoading || loading}
            />
          </Col>
        </Row>
      )}
      {error && (
        <Row>
          <Col>
            <div className="alert alert-danger" role="alert">
              Une erreur est survenue lors de la recherche: {error}
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default SearchPage; 