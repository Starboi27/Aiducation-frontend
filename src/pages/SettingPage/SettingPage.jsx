import React, { useState, useEffect, useCallback } from 'react';
import './SettingPage.css';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';
import { useApp } from '../../context/AppContext';

// ── 토글 컴포넌트 ──────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <div
    className={`sp-toggle ${checked ? 'sp-toggle--on' : ''}`}
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
  >
    <div className="sp-toggle__handle" />
  </div>
);

// ── 설정 행(row) 컴포넌트 ──────────────────────────────────────
const SettingRow = ({ label, description, children }) => (
  <div className="sp-setting-row">
    <div className="sp-setting-info">
      <span className="sp-setting-label">{label}</span>
      {description && <span className="sp-setting-desc">{description}</span>}
    </div>
    <div className="sp-setting-control">{children}</div>
  </div>
);

// ── 기본 설정값 ────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  learning: {
    dailyGoal: 20,
    reminderTime: '09:00',
    defaultDifficulty: '보통',
    reviewInterval: '3일',
  },
  notification: {
    pushEnabled: true,
    reportEmail: true,
    rankingEmail: false,
  },
};

const STORAGE_KEY = 'user_settings';

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved);
    return {
      learning: { ...DEFAULT_SETTINGS.learning, ...parsed.learning },
      notification: { ...DEFAULT_SETTINGS.notification, ...parsed.notification },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// ── SettingPage ────────────────────────────────────────────────
const SettingPage = () => {
  const { user } = useApp();
  const [settings, setSettings] = useState(loadSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // 비밀번호 변경 폼
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', isError: false });
  const [isSavingPw, setIsSavingPw] = useState(false);

  // 소셜 전용 계정 여부 (비밀번호 변경 비활성 조건)
  const isSocialOnly = !!(user?.provider && user.provider !== 'local');

  // 페이지 이탈 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const updateSetting = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setIsDirty(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsDirty(false);
    setSavedMsg('설정이 저장되었습니다.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handlePasswordChange = async () => {
    const { current, next, confirm } = pwForm;
    if (!current || !next || !confirm) {
      setPwMsg({ text: '모든 항목을 입력해주세요.', isError: true });
      return;
    }
    if (next !== confirm) {
      setPwMsg({ text: '새 비밀번호가 일치하지 않습니다.', isError: true });
      return;
    }
    if (next.length < 8) {
      setPwMsg({ text: '비밀번호는 8자 이상이어야 합니다.', isError: true });
      return;
    }

    setIsSavingPw(true);
    setPwMsg({ text: '', isError: false });
    try {
      // Mock: 실제 API 연결 시 authService.changePassword() 호출
      await new Promise((r) => setTimeout(r, 800));
      setPwForm({ current: '', next: '', confirm: '' });
      setPwMsg({ text: '비밀번호가 변경되었습니다.', isError: false });
    } catch {
      setPwMsg({ text: '비밀번호 변경에 실패했습니다.', isError: true });
    } finally {
      setIsSavingPw(false);
      setTimeout(() => setPwMsg({ text: '', isError: false }), 4000);
    }
  };

  return (
    <div className="sp">
      {/* ── 헤더 ── */}
      <div className="sp__header">
        <div>
          <h1 className="sp__title">설정</h1>
          <p className="sp__subtitle">앱 동작 방식을 원하는 대로 조정하세요.</p>
        </div>
        <div className="sp__header-actions">
          {savedMsg && <span className="sp__save-msg">{savedMsg}</span>}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty}
          >
            저장
          </Button>
        </div>
      </div>

      <div className="sp__body">
        {/* ── 학습 설정 ── */}
        <section className="sp__section">
          <h2 className="sp__section-title">학습 설정</h2>

          <SettingRow label="하루 목표 문제 수" description="대시보드 목표 달성률에 반영됩니다.">
            <div className="sp-number-input">
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.learning.dailyGoal}
                onChange={(e) =>
                  updateSetting('learning', 'dailyGoal', Math.max(1, Math.min(100, Number(e.target.value))))
                }
              />
              <span className="sp-unit">문제</span>
            </div>
          </SettingRow>

          <SettingRow label="학습 알림 시간" description="매일 이 시각에 학습 리마인더가 발송됩니다.">
            <input
              type="time"
              className="sp-time-input"
              value={settings.learning.reminderTime}
              onChange={(e) => updateSetting('learning', 'reminderTime', e.target.value)}
            />
          </SettingRow>

          <SettingRow label="퀴즈 난이도 기본값" description="퀴즈 생성 시 초기 난이도로 사용됩니다.">
            <select
              className="sp-select"
              value={settings.learning.defaultDifficulty}
              onChange={(e) => updateSetting('learning', 'defaultDifficulty', e.target.value)}
            >
              <option>쉬움</option>
              <option>보통</option>
              <option>어려움</option>
            </select>
          </SettingRow>

          <SettingRow label="오답 복습 주기" description="오답 노트의 재출제 간격을 설정합니다.">
            <select
              className="sp-select"
              value={settings.learning.reviewInterval}
              onChange={(e) => updateSetting('learning', 'reviewInterval', e.target.value)}
            >
              <option>1일</option>
              <option>3일</option>
              <option>7일</option>
              <option>끄기</option>
            </select>
          </SettingRow>
        </section>

        {/* ── 알림 설정 ── */}
        <section className="sp__section">
          <h2 className="sp__section-title">알림 설정</h2>

          <SettingRow label="푸시 알림" description="학습 리마인더 등 앱 알림을 받습니다.">
            <Toggle
              checked={settings.notification.pushEnabled}
              onChange={(v) => updateSetting('notification', 'pushEnabled', v)}
            />
          </SettingRow>

          <SettingRow label="학습 리포트 이메일" description="주간 학습 리포트를 이메일로 받습니다.">
            <Toggle
              checked={settings.notification.reportEmail}
              onChange={(v) => updateSetting('notification', 'reportEmail', v)}
            />
          </SettingRow>

          <SettingRow label="랭킹 변동 이메일" description="랭킹 순위 변동 시 이메일 알림을 받습니다.">
            <Toggle
              checked={settings.notification.rankingEmail}
              onChange={(v) => updateSetting('notification', 'rankingEmail', v)}
            />
          </SettingRow>
        </section>

        {/* ── 보안 ── */}
        <section className="sp__section">
          <h2 className="sp__section-title">보안</h2>

          {/* 비밀번호 변경 */}
          <div className="sp__subsection">
            <h3 className="sp__subsection-title">비밀번호 변경</h3>
            {isSocialOnly ? (
              <p className="sp__social-notice">
                소셜 로그인 계정은 비밀번호 변경을 지원하지 않습니다.
              </p>
            ) : (
              <div className="sp__pw-form">
                <Input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="새 비밀번호 (8자 이상)"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                />
                {pwMsg.text && (
                  <p className={`sp__pw-msg ${pwMsg.isError ? 'sp__pw-msg--error' : 'sp__pw-msg--success'}`}>
                    {pwMsg.text}
                  </p>
                )}
                <Button
                  variant="secondary"
                  onClick={handlePasswordChange}
                  loading={isSavingPw}
                >
                  비밀번호 변경
                </Button>
              </div>
            )}
          </div>

          {/* 소셜 연동 */}
          <div className="sp__subsection">
            <h3 className="sp__subsection-title">소셜 연동</h3>
            <div className="sp__social-list">
              <div className="sp__social-item">
                <div className="sp__social-info">
                  <span className="sp__social-icon sp__social-icon--google">G</span>
                  <div>
                    <span className="sp__social-name">Google</span>
                    <span className="sp__social-status">
                      {user?.provider === 'google' ? '연동됨' : '미연동'}
                    </span>
                  </div>
                </div>
                <Button
                  variant={user?.provider === 'google' ? 'danger' : 'secondary'}
                  size="sm"
                >
                  {user?.provider === 'google' ? '연동 해제' : '연동하기'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingPage;
