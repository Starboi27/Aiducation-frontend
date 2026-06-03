import React, { useState, useRef } from 'react';
import {
  ChevronRight, Trash2, Brain, Layers, Edit2, Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../atoms';
import { TopicRow, AddFileModal } from '../../molecules';
import './SubjectCard.css';

const TOPIC_COLORS = [
  '#6C5CE7', '#00cec9', '#fd79a8', '#fdcb6e',
  '#00b894', '#e17055', '#0984e3', '#a29bfe',
];

/**
 * Organism: SubjectCard
 * 과목(Subject) 하나를 나타내는 확장 가능한 카드.
 * - Molecules: Badge, TopicRow
 * - Atoms: Button(via raw button)
 * 상태: 펼침/접힘
 */
const SubjectCard = ({
  subject,
  isExpanded,
  onToggle,
  onDelete,
  onStartQuiz,
  onStartAll,
  onAddTopic,
  onMergeTopic,
  onRename,
  colorIndex = 0,
}) => {
  // 이름 변경 관련 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(subject.name);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  // 빈 상태 업로드 존 드래그
  const [uploadZoneDragOver, setUploadZoneDragOver] = useState(false);

  // 파일 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);

  // 드래그 앤 드롭 상태 (토픽 병합용)
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [merging, setMerging] = useState(false);

  const accentColor = TOPIC_COLORS[colorIndex % TOPIC_COLORS.length];

  // 서버 ID(정수)인 경우에만 드래그 허용
  const isServerTopic = (id) => !isNaN(Number(id));

  const handleDragStart = (e, topicId) => {
    if (!isServerTopic(topicId)) { e.preventDefault(); return; }
    setDraggedId(topicId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, topicId) => {
    if (!draggedId || topicId === draggedId || !isServerTopic(topicId)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(topicId);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    const sourceId = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId || !isServerTopic(sourceId) || !isServerTopic(targetId)) return;
    setMerging(true);
    try {
      await onMergeTopic?.(subject.id, Number(sourceId), Number(targetId));
    } finally {
      setMerging(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div
      className={`subject-card ${isExpanded ? 'subject-card--expanded' : ''}`}
      style={{ '--accent': accentColor }}
    >
      <AddFileModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        subjectId={subject.id}
        subjectName={subject.name}
      />
      {/* ── 카드 헤더 */}
      <div className="subject-card__header" onClick={onToggle}>
        <div className="subject-card__header-left">
          <div className="subject-card__icon">
            <Layers size={20} />
          </div>
          <div className="subject-card__title-block">
            {isEditingName ? (
              <div 
                className="subject-card__name-edit-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  className="subject-card__name-input"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editNameValue.trim()) onRename?.(editNameValue.trim());
                      setIsEditingName(false);
                    } else if (e.key === 'Escape') {
                      setEditNameValue(subject.name);
                      setIsEditingName(false);
                    }
                  }}
                  onBlur={() => {
                    if (editNameValue.trim() && editNameValue !== subject.name) onRename?.(editNameValue.trim());
                    else setEditNameValue(subject.name);
                    setIsEditingName(false);
                  }}
                />
              </div>
            ) : (
              <div className="subject-card__name-wrapper">
                <h3 className="subject-card__name">{subject.name}</h3>
                <button 
                  className="subject-card__edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  aria-label="이름 변경"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <div className="subject-card__meta">
              <Badge
                variant={subject.source === 'auto' ? 'primary' : 'default'}
                size="sm"
              >
                {subject.source === 'auto' ? '🤖 AI 자동 분류' : '✏️ 수동 생성'}
              </Badge>
              <Badge variant="default" size="sm">
                {subject.topics.length}개 주제
              </Badge>
              <Badge variant="default" size="sm">
                {subject.topics.reduce((acc, t) => acc + (t.quizCount || 0), 0)}문제
              </Badge>
            </div>
          </div>
        </div>

        <div className="subject-card__header-right">
          {subject.topics.length > 0 && (
            <button
              className="subject-card__all-quiz-btn"
              onClick={(e) => { e.stopPropagation(); onStartAll(); }}
              title="전체 주제 퀴즈 시작"
            >
              <Brain size={14} /> 전체 퀴즈
            </button>
          )}
          <button
            className="subject-card__delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="과목 삭제"
          >
            <Trash2 size={15} />
          </button>
          <ChevronRight
            size={18}
            className={`subject-card__chevron ${isExpanded ? 'subject-card__chevron--open' : ''}`}
          />
        </div>
      </div>

      {/* ── 확장 영역: 주제 목록 + 추가 폼 */}
      {isExpanded && (
        <div className="subject-card__body animate-fade-in">
          {subject.topics.length === 0 ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.md,.pptx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) navigate('/upload', { state: { subjectId: subject.id, subjectName: subject.name, preloadedFile: file } });
                }}
              />
              <div
                className={`subject-card__upload-zone ${uploadZoneDragOver ? 'subject-card__upload-zone--drag' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setUploadZoneDragOver(true); }}
                onDragLeave={() => setUploadZoneDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadZoneDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) navigate('/upload', { state: { subjectId: subject.id, subjectName: subject.name, preloadedFile: file } });
                }}
              >
                <Upload size={20} />
                <span>{uploadZoneDragOver ? '여기에 놓으세요!' : '파일을 드래그하거나 클릭하여 업로드'}</span>
              </div>
            </>
          ) : (
            <div className="subject-card__topics">
              <button
                className="subject-card__add-file-btn"
                onClick={() => setShowAddModal(true)}
              >
                <Upload size={14} />
                파일 추가
              </button>
              {merging && <p className="subject-card__merge-hint">병합 중…</p>}
              {subject.topics.map((topic) => {
                const canDrag = isServerTopic(topic.id);
                const isOver = dragOverId === topic.id && draggedId !== topic.id;
                return (
                  <div
                    key={topic.id}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, topic.id)}
                    onDragOver={(e) => handleDragOver(e, topic.id)}
                    onDrop={(e) => handleDrop(e, topic.id)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => setDragOverId(null)}
                    className={[
                      'topic-drag-wrapper',
                      isOver ? 'topic-drag-wrapper--over' : '',
                      draggedId === topic.id ? 'topic-drag-wrapper--dragging' : '',
                    ].join(' ')}
                    title={canDrag ? '드래그하여 다른 주제와 퀴즈를 병합하세요' : ''}
                  >
                    <TopicRow
                      topic={topic}
                      onStart={() => onStartQuiz(subject.id, topic.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SubjectCard;
