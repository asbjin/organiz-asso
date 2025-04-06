import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import { BsInfoCircle, BsExclamationTriangle, BsCheckCircle, BsXCircle } from 'react-icons/bs';

// Action types
import { CLEAR_ERROR } from '../../redux/actions/types';

/**
 * Composant de notifications en temps réel
 * Affiche les notifications système et les messages d'erreur
 */
const Notifications = () => {
  const { socket, connected } = useSocket();
  const dispatch = useDispatch();
  const error = useSelector(state => state.errors);
  
  const [notifications, setNotifications] = useState([]);

  // Écouter les erreurs Redux
  useEffect(() => {
    if (error && error.message) {
      addNotification({
        id: `error-${Date.now()}`,
        type: 'danger',
        title: 'Erreur',
        message: error.message,
        duration: 5000,
      });
      
      // Nettoyer l'erreur après l'avoir affichée
      setTimeout(() => {
        dispatch({ type: CLEAR_ERROR });
      }, 100);
    }
  }, [error, dispatch]);

  // Écouter les notifications socket.io
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNotification = (data) => {
      addNotification({
        id: `socket-${Date.now()}`,
        type: data.type || 'info',
        title: data.title || 'Notification',
        message: data.message,
        duration: data.duration || 5000,
      });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, connected]);

  // Ajouter une notification
  const addNotification = (notification) => {
    setNotifications(prev => [...prev, notification]);
  };

  // Supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Obtenir l'icône en fonction du type
  const getIcon = (type) => {
    switch (type) {
      case 'info':
        return <BsInfoCircle />;
      case 'warning':
        return <BsExclamationTriangle />;
      case 'success':
        return <BsCheckCircle />;
      case 'danger':
        return <BsXCircle />;
      default:
        return <BsInfoCircle />;
    }
  };

  return (
    <ToastContainer 
      className="p-3" 
      position="top-end"
      style={{ zIndex: 1050 }}
    >
      {notifications.map(notification => (
        <Toast 
          key={notification.id}
          bg={notification.type}
          onClose={() => removeNotification(notification.id)}
          delay={notification.duration}
          autohide
        >
          <Toast.Header>
            <span className="me-2">{getIcon(notification.type)}</span>
            <strong className="me-auto">{notification.title}</strong>
            <small>à l'instant</small>
          </Toast.Header>
          <Toast.Body className={notification.type === 'danger' || notification.type === 'dark' ? 'text-white' : ''}>
            {notification.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default Notifications; 