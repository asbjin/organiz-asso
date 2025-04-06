import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Configurer axios pour utiliser le token si disponible
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Vérifier le statut d'authentification au chargement
  const checkAuthStatus = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Vérifier le statut d'authentification avec le serveur
      const res = await axios.get(`${API_URL}/api/auth/check`, {
        withCredentials: true,
        // Ajouter un timeout pour éviter que la requête ne reste en attente indéfiniment
        timeout: 10000
      });
      
      if (res.data.user) {
        setCurrentUser(res.data.user);
        setIsAdmin(res.data.user.role === 'admin');
        setAuthToken(res.data.token);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setAuthToken(null);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification de l'authentification:", err);
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de connexion
  const login = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // Essayer d'abord avec withCredentials
      try {
        const res = await axios.post(`${API_URL}/api/auth/login`,
          formData,
          { withCredentials: true }
        );
        
        setCurrentUser(res.data.user);
        setIsAdmin(res.data.user.role === 'admin');
        setAuthToken(res.data.token);
        localStorage.setItem('authInitialized', 'true');
        return res.data;
      } catch (err) {
        // Si la première tentative échoue, essayer sans withCredentials
        const res = await axios.post(
          `${API_URL}/api/auth/login`,
          formData
        );
        
        setCurrentUser(res.data.user);
        setIsAdmin(res.data.user.role === 'admin');
        setAuthToken(res.data.token);
        localStorage.setItem('authInitialized', 'true');
        return res.data;
      }
    } catch (err) {
      const errorMessage = 
        err.response?.data?.message || 
        "Erreur lors de la connexion. Veuillez vérifier vos informations.";
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // Première tentative avec withCredentials
      try {
        const res = await axios.post(
          `${API_URL}/api/auth/register`,
          formData,
          { withCredentials: true }
        );
        return res.data;
      } catch (err) {
        // Si la première tentative échoue, essayer sans withCredentials
        const res = await axios.post(
          `${API_URL}/api/auth/register`,
          formData
        );
        return res.data;
      }
    } catch (err) {
      const errorMessage = 
        err.response?.data?.message || 
        "Erreur lors de l'inscription. Veuillez réessayer.";
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      
      // Nettoyer les données d'utilisateur et le token
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthToken(null);
      localStorage.removeItem('authInitialized');
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      
      // Même en cas d'erreur, on nettoie les données côté client
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthToken(null);
      localStorage.removeItem('authInitialized');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier l'authentification au chargement si le localStorage indique une initialisation
    const hasAuthBeenInitialized = localStorage.getItem('authInitialized') === 'true';
    
    if (hasAuthBeenInitialized) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  // Valeurs exposées par le contexte
  const value = {
    currentUser,
    isAdmin,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
