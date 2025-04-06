import React, { useState } from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { BsSearch, BsX } from 'react-icons/bs';
import useForm from '../../hooks/useForm';
import { searchMessages } from '../../redux/actions/messageActions';

/**
 * Composant de recherche avancée pour les messages
 */
const AdvancedSearch = () => {
  const dispatch = useDispatch();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Configuration du formulaire avec validation
  const { values, handleChange, handleSubmit, resetForm } = useForm(
    {
      keywords: '',
      author: '',
      forum: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
    },
    null, // Pas de validation spécifique
    (formValues) => {
      dispatch(searchMessages(formValues));
    }
  );

  // Réinitialiser la recherche
  const handleReset = () => {
    resetForm();
    dispatch(searchMessages({ keywords: '' }));
  };

  // Afficher/masquer les options avancées
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col sm={12}>
              <Form.Group>
                <Form.Label htmlFor="keywords" className="visually-hidden">Rechercher des messages</Form.Label>
                <div className="input-group">
                  <Form.Control
                    id="keywords"
                    name="keywords"
                    type="text"
                    placeholder="Rechercher des messages..."
                    value={values.keywords}
                    onChange={handleChange}
                    aria-label="Rechercher des messages"
                  />
                  <Button 
                    variant="primary" 
                    type="submit"
                    aria-label="Rechercher"
                  >
                    <BsSearch />
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleReset}
                    aria-label="Réinitialiser la recherche"
                  >
                    <BsX />
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mb-3">
            <Button 
              variant="link" 
              onClick={toggleAdvanced}
              className="text-decoration-none"
              aria-expanded={showAdvanced}
              aria-controls="advanced-search-options"
            >
              {showAdvanced ? 'Masquer les options avancées' : 'Afficher les options avancées'}
            </Button>
          </div>

          {showAdvanced && (
            <div id="advanced-search-options">
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="author">Auteur</Form.Label>
                    <Form.Control
                      id="author"
                      name="author"
                      type="text"
                      placeholder="Nom de l'auteur"
                      value={values.author}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="forum">Forum</Form.Label>
                    <Form.Control
                      id="forum"
                      name="forum"
                      type="text"
                      placeholder="Nom du forum"
                      value={values.forum}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="startDate">Date de début</Form.Label>
                    <Form.Control
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={values.startDate}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="endDate">Date de fin</Form.Label>
                    <Form.Control
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={values.endDate}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="sortBy">Trier par</Form.Label>
                    <Form.Select
                      id="sortBy"
                      name="sortBy"
                      value={values.sortBy}
                      onChange={handleChange}
                    >
                      <option value="date">Date</option>
                      <option value="author">Auteur</option>
                      <option value="title">Titre</option>
                      <option value="likes">Popularité</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="sortOrder">Ordre</Form.Label>
                    <Form.Select
                      id="sortOrder"
                      name="sortOrder"
                      value={values.sortOrder}
                      onChange={handleChange}
                    >
                      <option value="desc">Décroissant</option>
                      <option value="asc">Croissant</option>
                    </Form.Select>
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
                >
                  Rechercher
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