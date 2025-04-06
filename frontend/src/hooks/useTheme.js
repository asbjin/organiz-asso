import { useState, useEffect } from 'react';

const useTheme = () => {
  // Vérifier les préférences système de l'utilisateur
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Obtenir le thème depuis le localStorage ou utiliser les préférences système
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (prefersDarkMode ? 'dark' : 'light');
  });

  // Appliquer le thème au document
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
};

export default useTheme; 