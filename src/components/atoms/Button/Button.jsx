import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // 'small' → 'sm', 'medium' → 'md', 'large' → 'lg' 정규화
  const normalizedSize = size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : size;

  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${normalizedSize}`,
    fullWidth ? 'btn--full' : '',
    loading ? 'btn--loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={normalizedSize === 'sm' ? 14 : normalizedSize === 'lg' ? 20 : 16} className="btn__icon btn__icon--left" />
      )}
      <span className="btn__label">{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={normalizedSize === 'sm' ? 14 : normalizedSize === 'lg' ? 20 : 16} className="btn__icon btn__icon--right" />
      )}
    </button>
  );
};

export default Button;
