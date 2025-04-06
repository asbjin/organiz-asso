import React from 'react';
import { Card as BootstrapCard } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Composant Card réutilisable avec accessibilité améliorée
 */
const Card = ({
  title,
  subtitle,
  children,
  footer,
  variant = 'primary',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  tabIndex = 0,
  role = 'region',
  ariaLabelledby,
  ...rest
}) => {
  const headerId = ariaLabelledby || `card-header-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <BootstrapCard
      className={`custom-card border-${variant} ${className}`}
      tabIndex={tabIndex}
      role={role}
      aria-labelledby={headerId}
      {...rest}
    >
      {title && (
        <BootstrapCard.Header className={`bg-${variant} text-white ${headerClassName}`}>
          <BootstrapCard.Title id={headerId}>{title}</BootstrapCard.Title>
          {subtitle && <BootstrapCard.Subtitle className="mb-2 text-white-50">{subtitle}</BootstrapCard.Subtitle>}
        </BootstrapCard.Header>
      )}
      <BootstrapCard.Body className={bodyClassName}>
        {children}
      </BootstrapCard.Body>
      {footer && (
        <BootstrapCard.Footer className={`text-muted ${footerClassName}`}>
          {footer}
        </BootstrapCard.Footer>
      )}
    </BootstrapCard>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  variant: PropTypes.string,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  tabIndex: PropTypes.number,
  role: PropTypes.string,
  ariaLabelledby: PropTypes.string,
};

export default Card; 