import React from 'react';
import './QuizOption.css';

const QuizOption = ({ label, text, selected, correct, wrong, disabled, onClick }) => {
  const stateClass = correct ? 'quiz-option--correct'
    : wrong ? 'quiz-option--wrong'
    : selected ? 'quiz-option--selected'
    : '';

  return (
    <button
      className={`quiz-option ${stateClass} ${disabled ? 'quiz-option--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className="quiz-option__label">{label}</span>
      <span className="quiz-option__text">{text}</span>
      {correct && <span className="quiz-option__badge quiz-option__badge--correct">✓</span>}
      {wrong && <span className="quiz-option__badge quiz-option__badge--wrong">✗</span>}
    </button>
  );
};

export default QuizOption;
