import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';

// Configurer axios globalement
axios.defaults.withCredentials = true;
const API_URL = 'http://localhost:5000/api';

// Créer le contexte d'authentification
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Fonction pour appliquer le token à axios
  const applyTokenToAxios = (newToken) => {
    if (newToken) {
      console.log('Application du token aux en-têtes axios');
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      console.log('Suppression du token des en-têtes axios');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Configurer axios pour utiliser le token si disponible
  useEffect(() => {
    applyTokenToAxios(token);
  }, [token]);

  // Vérifier l'état de l'authentification au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // S'assurer que le token est appliqué
        applyTokenToAxios(token);
        
        const res = await axios.get(`${API_URL}/auth/check`);
        
        if (res.data.isAuthenticated) {
          // S'assurer que l'utilisateur a un ID accessible à _id
          const userData = res.data.user;
          if (userData.id && !userData._id) {
            userData._id = userData.id;
          }
          
          console.log('Données utilisateur reçues:', userData);
          setCurrentUser(userData);
        } else {
          // Si le serveur dit que nous ne sommes pas authentifiés malgré le token, nettoyer
          localStorage.removeItem('authToken');
          setToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.log('Non connecté ou session expirée', err);
        localStorage.removeItem('authToken');
        setToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [token]);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setError(null);
      console.log('Tentative de connexion avec:', { email });
      
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      console.log('Réponse du serveur (login):', res.data);
      
      // Stocker le token dans le localStorage
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        
        // Appliquer immédiatement le token aux en-têtes
        applyTokenToAxios(res.data.token);
        
        // Mettre à jour l'état
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        
        // Attendre un court instant pour s'assurer que le token est bien appliqué
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return res.data;
    } catch (err) {
      console.error('Erreur de connexion:', err);
      let errorMessage;
      
      if (err.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        errorMessage = err.response.data?.message || `Erreur serveur: ${err.response.status}`;
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion.';
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        errorMessage = 'Erreur de configuration de la requête: ' + err.message;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  // Fonction d'inscription
  const register = async (username, email, password) => {
    try {
      console.log('Tentative d\'inscription avec:', { username, email });
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      console.log('Réponse du serveur:', res.data);
      return res.data;
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      let errorMessage;
      
      if (err.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        errorMessage = err.response.data?.message || `Erreur serveur: ${err.response.status}`;
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion.';
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        errorMessage = 'Erreur de configuration de la requête: ' + err.message;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {});
      setCurrentUser(null);
      localStorage.removeItem('authToken');
      setToken(null);
    } catch (err) {
      console.error('Erreur lors de la déconnexion', err);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'superadmin',
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
