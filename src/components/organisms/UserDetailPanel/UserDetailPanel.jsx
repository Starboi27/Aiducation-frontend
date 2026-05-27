import React, { useEffect, useRef } from 'react';
import { X, User, Mail, Calendar, Shield, Activity, BookOpen, Target, Clock } from 'lucide-react';
import Button from '../../atoms/Button/Button';
import './UserDetailPanel.css';

const STAT_ITEMS = (detail) => [
  { icon: Target,   label: '총 푼 문제',  value: detail.totalSolvedCount != null ? `${detail.totalSolvedCount.toLocaleString()}문제` : '-' },
  { icon: Activity, label: '전체 정답률',  value: detail.correctRate != null ? `${Math.round(detail.correctRate)}%` : '-' },
  { icon: BookOpen, label: '등록 과목',    value: detail.registeredSubjectCount != null ? `${detail.registeredSubjectCount}개` : '-' },
  { icon: Clock,    label: '마지막 활동',  value: detail.lastActivityAt ? formatRelative(detail.lastActivityAt) : '-' },
];

function formatRelative(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return '방금 전';
  if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const STATUS_LABEL = { active: '활성', suspended: '정지', banned: '탈퇴' };
const STATUS_COLOR = { active: 'success', suspended: 'warning', banned: 'danger' };

const UserDetailPanel = ({ detail, isLoading, onClose, onToggleStatus, onDelete }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="udp-overlay" onClick={handleOverlayClick}>
      <aside className="udp" ref={panelRef}>
        <button className="udp__close" onClick={onClose}><X size={18} /></button>

        {isLoading ? (
          <div className="udp__loading">불러오는 중...</div>
        ) : !detail ? null : (
          <>
            {/* 헤더 */}
            <div className="udp__header">
              <div className="udp__avatar">
                {detail.name?.[0] ?? '?'}
              </div>
              <div>
                <p className="udp__name">{detail.name}</p>
                <p className="udp__userid">@{detail.userId}</p>
              </div>
              <span className={`udp__status udp__status--${STATUS_COLOR[detail.status] ?? 'info'}`}>
                {STATUS_LABEL[detail.status] ?? detail.status}
              </span>
            </div>

            {/* 기본 정보 */}
            <section className="udp__section">
              <p className="udp__section-title">기본 정보</p>
              <ul className="udp__info-list">
                <li><Mail size={14} />{detail.email}</li>
                <li><Shield size={14} />{detail.role} · Lv.{detail.level} ({detail.totalExp?.toLocaleString()} XP)</li>
                <li><Calendar size={14} />가입일 {new Date(detail.joinDate).toLocaleDateString('ko-KR')}</li>
                <li><User size={14} />{detail.provider ?? 'EMAIL'} 계정 {detail.mailAlram ? '· 이메일 알림 ON' : ''}</li>
              </ul>
            </section>

            {/* 학습 통계 */}
            <section className="udp__section">
              <p className="udp__section-title">학습 통계</p>
              <div className="udp__stats">
                {STAT_ITEMS(detail).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="udp__stat">
                    <Icon size={16} className="udp__stat-icon" />
                    <span className="udp__stat-label">{label}</span>
                    <span className="udp__stat-value">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 액션 */}
            <section className="udp__actions">
              <Button
                variant="outline"
                size="small"
                onClick={() => onToggleStatus(detail)}
              >
                {detail.status === 'active' ? '계정 정지' : '정지 해제'}
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => onDelete(detail)}
              >
                강제 탈퇴
              </Button>
            </section>
          </>
        )}
      </aside>
    </div>
  );
};

export default UserDetailPanel;
