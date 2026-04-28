import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Smile, Laugh, Meh, Frown, Flame, X } from 'lucide-react';
import './DifficultyModal.css';

const DIFFICULTIES = [
  { value: 'very_easy', label: 'Very Easy', sub: '매우 쉬움', Icon: Laugh, color: '#00b894' },
  { value: 'easy',      label: 'Easy',      sub: '쉬움',     Icon: Smile, color: '#55efc4' },
  { value: 'normal',    label: 'Normal',    sub: '보통',     Icon: Meh,   color: '#6C5CE7' },
  { value: 'hard',      label: 'Hard',      sub: '어려움',   Icon: Frown, color: '#e17055' },
  { value: 'very_hard', label: 'Very Hard', sub: '매우 어려움', Icon: Flame, color: '#d63031' },
];

/**
 * Molecule: DifficultyModal
 * 퀴즈 시작 전 난이도를 선택하는 모달.
 *
 * Props:
 *   isOpen     - 모달 표시 여부
 *   onClose    - 모달 닫기 콜백
 *   onConfirm  - (difficulty: string) => void  난이도 선택 완료 콜백
 */
const DifficultyModal = ({ isOpen, onClose, onConfirm }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected(null);
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) {
      setSelected(null);
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="difficulty-modal__backdrop" onClick={handleBackdrop}>
      <div className="difficulty-modal">
        <button className="difficulty-modal__close" onClick={() => { setSelected(null); onClose(); }}>
          <X size={18} />
        </button>

        <h2 className="difficulty-modal__title">난이도 선택</h2>
        <p className="difficulty-modal__desc">본인 수준에 맞는 난이도를 선택하세요.</p>

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
