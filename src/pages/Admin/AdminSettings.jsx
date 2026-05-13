import React, { useState, useEffect } from 'react';
import './AdminSettings.css';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';
import { adminService } from '../../services/adminService';

const AdminSettings = () => {
  const [levelSettings, setLevelSettings] = useState([]);
  const [difficultySettings, setDifficultySettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [levelData, diffData] = await Promise.all([
        adminService.getLevelSettings(),
        adminService.getDifficultySettings(),
      ]);
      setLevelSettings(levelData ?? []);
      setDifficultySettings(diffData ?? []);
    } catch (err) {
      console.error('설정 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelExpChange = (level, value) => {
    setLevelSettings((prev) =>
      prev.map((s) => (s.level === level ? { ...s, requiredExp: Number(value) || 0 } : s))
    );
  };

  const handleDiffExpChange = (difficulty, value) => {
    setDifficultySettings((prev) =>
      prev.map((s) => (s.difficulty === difficulty ? { ...s, expReward: Number(value) || 0 } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedMsg('');
    try {
      await Promise.all([
        ...levelSettings.map((s) => adminService.updateLevelExp(s.level, s.requiredExp)),
        ...difficultySettings.map((s) => adminService.updateDifficultyExp(s.difficulty, s.expReward)),
      ]);
      setSavedMsg('설정이 저장되었습니다.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      alert(`저장 실패: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">시스템 설정</h1>
        <div className="admin-page-actions">
          {savedMsg && <span className="save-success-msg">{savedMsg}</span>}
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ padding: '20px', color: 'var(--text-muted)' }}>설정을 불러오는 중...</p>
      ) : (
        <div className="settings-grid">
          {/* 일반 설정 */}
          <div className="settings-section">
            <h3>일반 설정</h3>
            <div className="setting-control">
              <div className="setting-info">
                <span className="setting-label">유지보수 모드</span>
                <span className="setting-desc">활성화 시 사용자 접근이 제한됩니다.</span>
              </div>
              <div
                className={`toggle-switch ${maintenanceMode ? 'on' : 'off'}`}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                <div className="toggle-handle"></div>
              </div>
            </div>
          </div>

          {/* 레벨별 필요 경험치 */}
          <div className="settings-section">
            <h3>레벨별 필요 경험치 (Lv. 1~{levelSettings.length})</h3>
            <div className="settings-table">
              {levelSettings.map((s) => (
                <div key={s.level} className="setting-field setting-field--inline">
                  <label>Lv. {s.level}</label>
                  <Input
                    type="number"
                    min="1"
                    value={s.requiredExp}
                    onChange={(e) => handleLevelExpChange(s.level, e.target.value)}
                    style={{ width: '100px' }}
                  />
                  <span className="setting-unit">XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* 난이도별 경험치 보상 */}
          <div className="settings-section">
            <h3>난이도별 경험치 보상</h3>
            <div className="settings-table">
              {difficultySettings.map((s) => (
                <div key={s.difficulty} className="setting-field setting-field--inline">
                  <label>{s.label}</label>
                  <Input
                    type="number"
                    min="0"
                    value={s.expReward}
                    onChange={(e) => handleDiffExpChange(s.difficulty, e.target.value)}
                    style={{ width: '100px' }}
                  />
                  <span className="setting-unit">XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
