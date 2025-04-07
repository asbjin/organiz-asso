/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { BsReply, BsPencil, BsTrash } from 'react-icons/bs';

// Composant pour afficher une réponse individuelle
const ReplyItem = ({ reply, onDelete, onReply, depth = 0, targetReplyId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef(null);
  
  // Déterminer si cette réponse est ciblée
  const isTargeted = targetReplyId === reply._id;
  
  // Faire défiler jusqu'à la réponse si elle est ciblée
  useEffect(() => {
    if (isTargeted && replyRef.current) {
      setTimeout(() => {
        replyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isTargeted, targetReplyId]);

  // Protection contre les données invalides
  if (!reply || typeof reply !== 'object') {
    return null;
  }

  const handleReplyClick = () => {
    setShowReplyForm(!showReplyForm);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      await onReply(reply._id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Style basé sur le niveau d'imbrication
  const depthClass = `reply-level-${depth % 6}`;

  return (
    <div 
      id={`reply-${reply._id}`}
      ref={replyRef}
      className={`reply-item ${depthClass} ${isTargeted ? 'targeted-reply' : ''}`}
      style={{
        border: isTargeted ? '1px solid #e0e0e0' : 'none',
        borderRadius: isTargeted ? '8px' : '0',
        padding: isTargeted ? '8px' : '0',
        transition: 'border 0.3s ease'
      }}
    >
      <div className="message-header">
        <div className="message-author">
          <img 
            src={reply.author?.profilePicture || "https://via.placeholder.com/30"} 
            alt={reply.author?.username || "Utilisateur"} 
            className="author-avatar"
            style={{ width: '30px', height: '30px' }}
          />
          <span className="author-name">{reply.author?.username || "Utilisateur"}</span>
        </div>
        <small className="text-muted">
          {new Date(reply.createdAt).toLocaleString()}
          {reply.isEdited && ' (modifié)'}
        </small>
      </div>
      
      <div className="message-content">
        {reply.content === "[Ce message a été supprimé]" ? (
          <em className="text-muted">[Ce message a été supprimé]</em>
        ) : (
          reply.content
        )}
      </div>
      
      <div className="message-actions">
        <Button 
          variant="link" 
          size="sm"
          className="text-primary" 
          onClick={handleReplyClick}
        >
          <BsReply /> Répondre
        </Button>
        
        {reply.isCurrentUserAuthor && (
          <>
            <Button 
              variant="link" 
              size="sm"
              className="text-warning" 
              onClick={() => alert('Fonctionnalité de modification à venir')}
            >
              <BsPencil /> Modifier
            </Button>
            <Button 
              variant="link" 
              size="sm"
              className="text-danger" 
              onClick={() => onDelete(reply._id)}
            >
              <BsTrash /> Supprimer
            </Button>
          </>
        )}
      </div>
      
      {/* Formulaire de réponse */}
      {showReplyForm && (
        <Form onSubmit={handleReplySubmit} className="reply-form mt-3 p-3 border border-light rounded bg-light">
          <Form.Group className="mb-2">
            <Form.Control
              as="textarea"
              rows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Répondre à ${reply.author?.username}...`}
              required
            />
          </Form.Group>
          <div className="d-flex">
            <Button type="submit" size="sm" disabled={submitting} variant="primary" className="me-2">
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  Envoi...
                </>
              ) : 'Répondre'}
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
              }}
            >
              Annuler
            </Button>
          </div>
        </Form>
      )}
      
      {/* Réponses imbriquées */}
      {Array.isArray(reply.children) && reply.children.length > 0 && (
        <div className="nested-replies mt-2 ms-3 border-start ps-3">
          {reply.children
            .filter(childReply => childReply)
            .map(childReply => (
              <ReplyItem 
                key={childReply._id} 
                reply={childReply} 
                onDelete={onDelete}
                onReply={onReply}
                depth={depth + 1} 
                targetReplyId={targetReplyId}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default ReplyItem; 