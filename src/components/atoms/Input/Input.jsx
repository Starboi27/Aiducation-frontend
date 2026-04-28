import React from 'react';
import './Input.css';

const Input = React.forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  error,
  hint,
  disabled = false,
  fullWidth = true,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full' : ''} ${className}`}>
      {label && (
        <label className="input__label" htmlFor={inputId}>{label}</label>
      )}
      <div className={`input__container input__container--${size} ${error ? 'input__container--error' : ''} ${disabled ? 'input__container--disabled' : ''}`}>
        {Icon && <Icon size={16} className="input__icon" />}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className="input__field"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && <p className="input__error">{error}</p>}
      {hint && !error && <p className="input__hint">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
