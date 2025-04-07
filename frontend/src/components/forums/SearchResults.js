import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import { BsCalendar, BsPerson, BsChat, BsSearch, BsEmojiFrown } from 'react-icons/bs';
import './SearchStyles.css';

/**
 * Composant pour afficher les résultats de recherche de messages
 */
const SearchResults = ({ results = [], searchQuery = '', isLoading }) => {
  // Vérifier que results est bien un tableau
  const validResults = Array.isArray(results) ? results : [];
  
  // Filtres pour la mise en évidence des mots-clés
  const getHighlightedText = (text, keywords) => {
    if (!keywords || !text) return text;
    
    // S'assurer que text est une chaîne de caractères
    const safeText = typeof text === 'string' ? text : String(text || '');
    const sanitizedText = DOMPurify.sanitize(safeText);
    
    // Cas où on cherche une expression exacte
    if (keywords.startsWith('"') && keywords.endsWith('"')) {
      const exactPhrase = keywords.slice(1, -1).trim();
      if (!exactPhrase) return sanitizedText;
      
      const regex = new RegExp(`(${escapeRegExp(exactPhrase)})`, 'gi');
      return sanitizedText.replace(regex, '<span class="keyword-highlight">$1</span>');
    }
    
    // Cas standard avec plusieurs mots-clés
    const keywordsList = keywords.split(/\s+/).filter(Boolean);
    if (keywordsList.length === 0) return sanitizedText;
    
    // Créer le regex pour tous les mots-clés
    const regex = new RegExp(`(${keywordsList.map(escapeRegExp).join('|')})`, 'gi');
    return sanitizedText.replace(regex, '<span class="keyword-highlight">$1</span>');
  };
  
  // Échapper les caractères spéciaux pour le regex
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Extraire un extrait du contenu avec les mots-clés en évidence
  const getContentSnippet = (content, keywords, maxLength = 250) => {
    if (!content) return '';
    
    // S'assurer que content est une chaîne de caractères
    const safeContent = typeof content === 'string' ? content : String(content || '');
    
    // Nettoyer le HTML
    let plainText = safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!keywords || !keywords.trim()) {
      // Sans mot-clé, retourner le début du contenu
      return plainText.length > maxLength 
        ? plainText.substring(0, maxLength) + '...' 
        : plainText;
    }
    
    // Recherche de la première occurrence d'un mot-clé
    const keywordsList = keywords.split(/\s+/).filter(Boolean);
    let startIndex = 0;
    
    for (const keyword of keywordsList) {
      const index = plainText.toLowerCase().indexOf(keyword.toLowerCase());
      if (index !== -1) {
        // Trouver le début de la phrase contenant le mot-clé
        startIndex = Math.max(0, plainText.lastIndexOf('.', index) + 1);
        break;
      }
    }
    
    // Extraire un fragment autour du mot-clé
    let endIndex = Math.min(startIndex + maxLength, plainText.length);
    let snippet = plainText.substring(startIndex, endIndex);
    
    // Ajouter des ellipses au début et à la fin si nécessaire
    if (startIndex > 0) snippet = '...' + snippet;
    if (endIndex < plainText.length) snippet += '...';
    
    return snippet;
  };
  
  // Formatage de la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString || 'Date inconnue';
    }
  };
  
  // Rendu des résultats vides
  const renderEmptyResults = () => (
    <div className="empty-results">
      <BsEmojiFrown className="empty-results-icon" />
      <div className="empty-results-message">Aucun résultat ne correspond à votre recherche.</div>
      <div className="empty-results-suggestion">
        Essayez de modifier vos critères de recherche ou d'utiliser des termes différents.
      </div>
    </div>
  );
  
  // Rendu d'un résultat de recherche
  const renderSearchResult = (message) => {
    if (!message || typeof message !== 'object') {
      return null;
    }
    
    return (
      <Card key={message._id} className="search-result-card mb-3">
        <Card.Body>
          <div className="search-result-header">
            <Card.Title className="search-result-title">
              <Link to={`/forum/${message.forum._id || message.forum}${message.parentMessage ? `#reply-${message._id}` : ''}`}>
                {message.title || `Message de ${message.author?.username || 'Utilisateur inconnu'}`}
              </Link>
            </Card.Title>
            <Badge bg="secondary" className="search-result-forum">
              <BsChat className="me-1" />
              {message.forum?.name || 'Forum inconnu'}
            </Badge>
          </div>
          
          <div className="search-result-meta">
            <div className="search-result-meta-item">
              <BsPerson className="search-result-meta-icon" />
              {message.author ? (
                <Link to={`/profile/${message.author._id}`}>
                  {message.author.username || 'Utilisateur inconnu'}
                </Link>
              ) : (
                'Utilisateur inconnu'
              )}
            </div>
            <div className="search-result-meta-item">
              <BsCalendar className="search-result-meta-icon" />
              {formatDate(message.createdAt)}
            </div>
          </div>
          
          <div 
            className="search-result-snippet"
            dangerouslySetInnerHTML={{
              __html: getHighlightedText(
                getContentSnippet(message.content, searchQuery),
                searchQuery
              )
            }}
          />
        </Card.Body>
      </Card>
    );
  };
  
  // Affichage du nombre de résultats
  const renderResultsInfo = () => {
    const count = validResults.length;
    return (
      <div className="search-results-info mb-3">
        <BsSearch className="me-2" />
        {count > 0 
          ? `${count} message${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
          : 'Aucun message trouvé'}
      </div>
    );
  };
  
  // Si la recherche est en cours
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Recherche en cours...</span>
        </div>
        <div className="mt-3">Recherche en cours...</div>
      </div>
    );
  }
  
  return (
    <div className="search-results-container">
      {validResults.length > 0 ? (
        <>
          {renderResultsInfo()}
          <Row>
            <Col>
              {validResults.map((message, index) => (
                <React.Fragment key={message._id || index}>
                  {renderSearchResult(message)}
                </React.Fragment>
              ))}
            </Col>
          </Row>
        </>
      ) : (
        renderEmptyResults()
      )}
    </div>
  );
};

export default SearchResults; 