import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Smile, Laugh, Meh, Frown, Flame, X } from 'lucide-react';
import './DifficultyModal.css';

const DIFFICULTIES = [
  { value: 1, label: 'Very Easy', sub: '매우 쉬움', Icon: Laugh, color: '#00b894' },
  { value: 2, label: 'Easy',      sub: '쉬움',     Icon: Smile, color: '#55efc4' },
  { value: 3, label: 'Normal',    sub: '보통',     Icon: Meh,   color: '#6C5CE7' },
  { value: 4, label: 'Hard',      sub: '어려움',   Icon: Frown, color: '#e17055' },
  { value: 5, label: 'Very Hard', sub: '매우 어려움', Icon: Flame, color: '#d63031' },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

/**
 * Molecule: DifficultyModal
 * 퀴즈 시작 전 난이도와 문제 수를 선택하는 모달.
 *
 * Props:
 *   isOpen     - 모달 표시 여부
 *   onClose    - 모달 닫기 콜백
 *   onConfirm  - ({ difficulty: number, count: number }) => void
 */
const DifficultyModal = ({ isOpen, onClose, onConfirm }) => {
  const [selected, setSelected] = useState(null);
  const [count, setCount] = useState(10);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm({ difficulty: selected, count });
    setSelected(null);
    setCount(10);
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) {
      setSelected(null);
      setCount(10);
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="difficulty-modal__backdrop" onClick={handleBackdrop}>
      <div className="difficulty-modal">
        <button className="difficulty-modal__close" onClick={() => { setSelected(null); setCount(10); onClose(); }}>
          <X size={18} />
        </button>

        <h2 className="difficulty-modal__title">퀴즈 설정</h2>
        <p className="difficulty-modal__desc">난이도와 문제 수를 선택하세요.</p>

        <p className="difficulty-modal__section-label">난이도</p>
        <div className="difficulty-modal__options">
          {DIFFICULTIES.map(({ value, label, sub, Icon, color }) => (
            <button
              key={value}
              className={`difficulty-modal__option${selected === value ? ' difficulty-modal__option--selected' : ''}`}
              style={{ '--accent': color }}
              onClick={() => setSelected(value)}
            >
              <Icon size={28} className="option__icon" />
              <span className="option__label">{label}</span>
              <span className="option__sub">{sub}</span>
            </button>
          ))}
        </div>

        <p className="difficulty-modal__section-label">문제 수</p>
        <div className="difficulty-modal__count-options">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              className={`difficulty-modal__count-btn${count === n ? ' difficulty-modal__count-btn--selected' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}문제
            </button>
          ))}
        </div>

        <button
          className="difficulty-modal__confirm"
          disabled={!selected}
          onClick={handleConfirm}
        >
          시작하기
        </button>
      </div>
    </div>,
    document.body
  );
};

export default DifficultyModal;
