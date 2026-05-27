import React, { useState, useEffect } from 'react';
import './AdminSettings.css';
import './admin-common.css';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';
import { adminService } from '../../services/adminService';

const AdminSettings = () => {
  const [levelSettings, setLevelSettings] = useState([]);
  const [difficultySettings, setDifficultySettings] = useState([]);
  const [noticeSettings, setNoticeSettings] = useState({ alarmInterval: 24, isAlarmEnabled: true });
  const [isLoading, setIsLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({ level: false, difficulty: false, notice: false });
  const [msgMap, setMsgMap] = useState({ level: '', difficulty: '', notice: '' });

  const setSaving = (key, val) => setSavingMap((p) => ({ ...p, [key]: val }));
  const showMsg = (key, text) => {
    setMsgMap((p) => ({ ...p, [key]: text }));
    setTimeout(() => setMsgMap((p) => ({ ...p, [key]: '' })), 3000);
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [levelData, diffData, noticeData] = await Promise.all([
        adminService.getLevelSettings(),
        adminService.getDifficultySettings(),
        adminService.getNoticeSettings().catch(() => null),
      ]);

      const savedLevel = localStorage.getItem('admin_level_settings');
      const savedDiff  = localStorage.getItem('admin_difficulty_settings');
      setLevelSettings(savedLevel ? JSON.parse(savedLevel) : (levelData ?? []));
      setDifficultySettings(savedDiff ? JSON.parse(savedDiff) : (diffData ?? []));
      const savedNotice = localStorage.getItem('admin_notice_settings');
      if (savedNotice) setNoticeSettings(JSON.parse(savedNotice));
      else if (noticeData) setNoticeSettings(noticeData);
    } catch (err) {
      console.error('설정 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelExpChange = (level, value) =>
    setLevelSettings((prev) =>
      prev.map((s) => (s.level === level ? { ...s, requiredExp: Math.max(1, Number(value) || 1) } : s))
    );

  const handleDiffExpChange = (difficulty, value) =>
    setDifficultySettings((prev) =>
      prev.map((s) => (s.difficulty === difficulty ? { ...s, expReward: Number(value) || 0 } : s))
    );

  const handleSaveLevel = async () => {
    setSaving('level', true);
    try {
      await Promise.all(levelSettings.map((s) => adminService.updateLevelExp(s.level, s.requiredExp)));
      localStorage.setItem('admin_level_settings', JSON.stringify(levelSettings));
      showMsg('level', '저장되었습니다.');
    } catch (err) {
      alert(`저장 실패: ${err.message}`);
    } finally {
      setSaving('level', false);
    }
  };

  const handleSaveDifficulty = async () => {
    setSaving('difficulty', true);
    try {
      await Promise.all(difficultySettings.map((s) => adminService.updateDifficultyExp(s.difficulty, s.expReward)));
      localStorage.setItem('admin_difficulty_settings', JSON.stringify(difficultySettings));
      showMsg('difficulty', '저장되었습니다.');
    } catch (err) {
      alert(`저장 실패: ${err.message}`);
    } finally {
      setSaving('difficulty', false);
    }
  };

  const handleSaveNotice = async () => {
    setSaving('notice', true);
    try {
      await adminService.updateNoticeSettings(noticeSettings);
      localStorage.setItem('admin_notice_settings', JSON.stringify(noticeSettings));
      showMsg('notice', '저장되었습니다.');
    } catch (err) {
      alert(`저장 실패: ${err.message}`);
    } finally {
      setSaving('notice', false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">시스템 설정</h1>
      </div>

      {isLoading ? (
        <p style={{ padding: '20px', color: 'var(--text-muted)' }}>설정을 불러오는 중...</p>
      ) : (
        <div className="settings-grid">
          {/* 레벨별 필요 경험치 */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3>레벨별 필요 경험치 <span className="settings-section__sub">Lv. 1 ~ {levelSettings.length}</span></h3>
              <div className="settings-section-actions">
                {msgMap.level && <span className="save-success-msg">{msgMap.level}</span>}
                <Button variant="primary" size="small" onClick={handleSaveLevel} disabled={savingMap.level}>
                  {savingMap.level ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
            <table className="settings-table">
              <thead>
                <tr><th>레벨</th><th>필요 경험치</th><th>단위</th></tr>
              </thead>
              <tbody>
                {levelSettings.map((s) => (
                  <tr key={s.level}>
                    <td><span className="st-badge st-badge--level">Lv. {s.level}</span></td>
                    <td>
                      <Input type="number" min="1" value={s.requiredExp}
                        onChange={(e) => handleLevelExpChange(s.level, e.target.value)} className="st-input" />
                    </td>
                    <td><span className="st-unit">XP</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 글로벌 알림 설정 */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3>글로벌 알림 설정</h3>
              <div className="settings-section-actions">
                {msgMap.notice && <span className="save-success-msg">{msgMap.notice}</span>}
                <Button variant="primary" size="small" onClick={handleSaveNotice} disabled={savingMap.notice}>
                  {savingMap.notice ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
            <table className="settings-table">
              <tbody>
                <tr>
                  <td><span className="st-badge st-badge--level">알림 활성</span></td>
                  <td colSpan="2">
                    <div
                      className={`toggle-switch ${noticeSettings.isAlarmEnabled ? 'on' : 'off'}`}
                      onClick={() => setNoticeSettings((p) => ({ ...p, isAlarmEnabled: !p.isAlarmEnabled }))}
                    >
                      <div className="toggle-handle"></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><span className="st-badge st-badge--level">알림 주기</span></td>
                  <td>
                    <Input type="number" min="1" value={noticeSettings.alarmInterval}
                      onChange={(e) => setNoticeSettings((p) => ({ ...p, alarmInterval: Math.max(1, Number(e.target.value) || 1) }))}
                      className="st-input" />
                  </td>
                  <td><span className="st-unit">시간</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 난이도별 경험치 보상 */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3>난이도별 경험치 보상</h3>
              <div className="settings-section-actions">
                {msgMap.difficulty && <span className="save-success-msg">{msgMap.difficulty}</span>}
                <Button variant="primary" size="small" onClick={handleSaveDifficulty} disabled={savingMap.difficulty}>
                  {savingMap.difficulty ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
            <table className="settings-table">
              <thead>
                <tr><th>난이도</th><th>경험치 보상</th><th>단위</th></tr>
              </thead>
              <tbody>
                {difficultySettings.map((s) => (
                  <tr key={s.difficulty}>
                    <td><span className={`st-badge st-badge--diff st-badge--${s.difficulty}`}>{s.label}</span></td>
                    <td>
                      <Input type="number" min="0" value={s.expReward}
                        onChange={(e) => handleDiffExpChange(s.difficulty, e.target.value)} className="st-input" />
                    </td>
                    <td><span className="st-unit">XP</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
