import React from 'react';
import { Button as BootstrapButton } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Composant Button réutilisable avec accessibilité améliorée
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...rest
}) => {
  return (
    <BootstrapButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={`custom-button ${className}`}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...rest}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Chargement...
        </>
      ) : (
        children
      )}
    </BootstrapButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  size: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Button; 