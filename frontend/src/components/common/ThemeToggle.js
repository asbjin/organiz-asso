import React from 'react';
import { Button } from 'react-bootstrap';
import { BsSun, BsMoon } from 'react-icons/bs';
import useTheme from '../../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant={theme === 'dark' ? 'light' : 'dark'}
      size="sm"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      className="d-flex align-items-center"
    >
      {theme === 'dark' ? (
        <>
          <BsSun className="me-1" /> Thème clair
        </>
      ) : (
        <>
          <BsMoon className="me-1" /> Thème sombre
        </>
      )}
    </Button>
  );
};

export default ThemeToggle; 