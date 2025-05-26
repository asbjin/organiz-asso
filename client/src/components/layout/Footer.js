import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-light py-3 mt-5">
      <Container className="text-center">
        <p className="mb-0">
          &copy; {currentYear} Organiz'asso - Tous droits réservés
        </p>
        <p className="text-muted small mb-0">
          Développé dans le cadre du cours 3IN017 - Technologies du Web
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
