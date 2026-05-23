import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  BookOpen,
  Settings,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Button, Input } from "../../components/atoms";
import { Card } from "../../components/molecules";
import { userService } from "../../services/userService";
import { reviewService } from "../../services/reviewService";
import "./SettingsPage.css";

const SettingsPage = () => {
  const { user, setUser } = useApp();
  
  // Loading & Messages
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // 1. Profile State
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });

  // 2. Password State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // 3. Study Settings State
  const [studySettings, setStudySettings] = useState({
    dailyGoal: 30,
    studyAlarmTime: "20:00",
    defaultDifficulty: 3,
  });

  // 4. Alarm Settings State
  const [alarmSettings, setAlarmSettings] = useState({
    pushAlarm: true,
    mailAlram: true,
    rankingAlarm: false
  });

  useEffect(() => {
    console.log("SettingsPage mounted");
    if (user) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const applySettings = (study, alarm) => {
    const t = study.studyAlarmTime;
    let timeStr = "20:00";
    if (typeof t === 'string' && t.length >= 5) {
      timeStr = t.substring(0, 5); // "HH:mm:ss" → "HH:mm"
    } else if (t && t.hour != null && t.minute != null) {
      timeStr = `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    }
    setStudySettings({ ...study, studyAlarmTime: timeStr });
    setAlarmSettings(alarm);
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [study, alarm, alarmTime] = await Promise.all([
        userService.getStudySettings(),
        userService.getAlarmSettings(),
        reviewService.getAlarmTime().catch(() => null),
      ]);
      // notifications/alarm-time이 있으면 해당 값을 studyAlarmTime 우선 적용
      if (alarmTime?.studyAlarmTime) {
        study.studyAlarmTime = alarmTime.studyAlarmTime;
      }
      applySettings(study, alarm);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      showMsg('error', '설정을 불러오지 못했습니다. 로그인 상태를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const refetchSettings = async () => {
    try {
      const [study, alarm, alarmTime] = await Promise.all([
        userService.getStudySettings(),
        userService.getAlarmSettings(),
        reviewService.getAlarmTime().catch(() => null),
      ]);
      if (alarmTime?.studyAlarmTime) {
        study.studyAlarmTime = alarmTime.studyAlarmTime;
      }
      applySettings(study, alarm);
    } catch (err) {
      console.error("Silent refetch failed:", err);
    }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  // Handlers
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userService.updateProfile(profile.name, profile.email);
      setUser((prev) => ({ ...prev, name: profile.name, email: profile.email }));
      showMsg('success', '프로필이 저장되었습니다.');
    } catch (err) {
      showMsg('error', '프로필 저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMsg('error', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsSaving(true);
    try {
      await userService.updatePassword(passwords.currentPassword, passwords.newPassword);
      showMsg('success', '비밀번호가 변경되었습니다.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMsg('error', '비밀번호 변경 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStudySettingsUpdate = async () => {
    const dailyGoal = Number(studySettings.dailyGoal);
    if (dailyGoal < 1 || dailyGoal > 100) {
      showMsg('error', '일일 학습 목표는 1~100분 사이로 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const [hour, minute] = studySettings.studyAlarmTime.split(':').map(Number);
      const alarmTime = { hour, minute, second: 0, nano: 0 };
      const payload = {
        dailyGoal,
        defaultDifficulty: Number(studySettings.defaultDifficulty),
        studyAlarmTime: alarmTime,
      };

      await Promise.all([
        userService.updateStudySettings(payload),
        reviewService.updateAlarmTime(alarmTime),
      ]);
      showMsg('success', '학습 설정이 저장되었습니다.');
    } catch (err) {
      showMsg('error', '학습 설정 저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlarmToggle = async (key) => {
    const newSettings = { ...alarmSettings, [key]: !alarmSettings[key] };
    setAlarmSettings(newSettings);
    try {
      await userService.updateAlarmSettings(newSettings);
    } catch (err) {
      showMsg('error', '알림 설정 업데이트 실패');
      setAlarmSettings(alarmSettings); // Rollback
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
      try {
        await userService.deleteAccount();
        window.location.href = '/login';
      } catch (err) {
        showMsg('error', '탈퇴 실패: ' + err.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="settings-page settings-page--loading">
        <div className="loader" />
        <p>설정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="settings-page animate-fade-in">
      <header className="settings-header">
        <div className="settings-header__title">
          <Settings size={28} className="settings-header__icon" />
          <h1>환경 설정</h1>
        </div>
        <p className="settings-header__desc">계정 및 학습 환경을 나에게 맞게 관리하세요.</p>
        
        {msg.text && (
          <div className={`settings-msg settings-msg--${msg.type}`}>
            {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {msg.text}
          </div>
        )}
      </header>

      <div className="settings-grid">
        {/* 프로필 설정 */}
        <Card title="프로필 설정" variant="glass" padding="lg">
          <form className="settings-form" onSubmit={handleProfileUpdate}>
            <div className="settings-field">
              <label><User size={14} /> 이름</label>
              <Input 
                value={profile.name} 
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                placeholder="이름 입력"
              />
            </div>
            <div className="settings-field">
              <label><Bell size={14} /> 이메일</label>
              <Input 
                type="email"
                value={profile.email} 
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>
            <div className="settings-action">
              <Button variant="primary" type="submit" disabled={isSaving}>
                <Save size={16} /> 프로필 저장
              </Button>
            </div>
          </form>
        </Card>

        {/* 비밀번호 변경 */}
        <Card title="보안 및 비밀번호" variant="glass" padding="lg">
          <form className="settings-form" onSubmit={handlePasswordUpdate}>
            <div className="settings-field">
              <label><Lock size={14} /> 현재 비밀번호</label>
              <Input 
                type="password"
                value={passwords.currentPassword} 
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                placeholder="현재 비밀번호"
              />
            </div>
            <div className="settings-field">
              <label><Lock size={14} /> 새 비밀번호</label>
              <Input 
                type="password"
                value={passwords.newPassword} 
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                placeholder="새 비밀번호"
              />
            </div>
            <div className="settings-field">
              <label><Lock size={14} /> 새 비밀번호 확인</label>
              <Input 
                type="password"
                value={passwords.confirmPassword} 
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                placeholder="새 비밀번호 다시 입력"
              />
            </div>
            <div className="settings-action">
              <Button variant="ghost" type="submit" disabled={isSaving}>
                비밀번호 변경
              </Button>
            </div>
          </form>
        </Card>

        {/* 학습 설정 */}
        <Card title="학습 설정" variant="glass" padding="lg">
          <div className="settings-form">
            <div className="settings-field">
              <label><BookOpen size={14} /> 일일 학습 목표 (분)</label>
              <div className="settings-input-row">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={studySettings.dailyGoal}
                  onChange={(e) => setStudySettings({...studySettings, dailyGoal: e.target.value})}
                />
                <span className="settings-unit">분</span>
              </div>
            </div>
            
            <div className="settings-field">
              <label><Clock size={14} /> 학습 리마인드 시간</label>
              <div className="settings-time-dial">
                <select
                  className="settings-time-dial__select"
                  value={studySettings.studyAlarmTime.split(':')[0] || '20'}
                  onChange={(e) => {
                    const min = studySettings.studyAlarmTime.split(':')[1] || '00';
                    setStudySettings({...studySettings, studyAlarmTime: `${e.target.value}:${min}`});
                  }}
                >
                  {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                    <option key={h} value={h}>{h}시</option>
                  ))}
                </select>
                <span className="settings-time-dial__sep">:</span>
                <select
                  className="settings-time-dial__select"
                  value={studySettings.studyAlarmTime.split(':')[1] || '00'}
                  onChange={(e) => {
                    const hour = studySettings.studyAlarmTime.split(':')[0] || '20';
                    setStudySettings({...studySettings, studyAlarmTime: `${hour}:${e.target.value}`});
                  }}
                >
                  {Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}분</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-field">
              <label><AlertTriangle size={14} /> 기본 문제 난이도</label>
              <select 
                className="settings-select"
                value={studySettings.defaultDifficulty}
                onChange={(e) => setStudySettings({...studySettings, defaultDifficulty: e.target.value})}
              >
                <option value="1">매우 쉬움</option>
                <option value="2">쉬움</option>
                <option value="3">보통</option>
                <option value="4">어려움</option>
                <option value="5">매우 어려움</option>
              </select>
            </div>

            <div className="settings-action">
              <Button variant="primary" onClick={handleStudySettingsUpdate} disabled={isSaving}>
                학습 설정 저장
              </Button>
            </div>
          </div>
        </Card>

        {/* 알림 설정 */}
        <Card title="알림 수신 설정" variant="glass" padding="lg">
          <div className="settings-list">
            <div className="settings-list-item">
              <div className="settings-list-info">
                <h4>푸시 알림</h4>
                <p>학습 리마인드 및 공지사항 푸시 알림</p>
              </div>
              <div 
                className={`settings-toggle ${alarmSettings.pushAlarm ? 'on' : ''}`}
                onClick={() => handleAlarmToggle('pushAlarm')}
              >
                <div className="settings-toggle-handle" />
              </div>
            </div>

            <div className="settings-list-item">
              <div className="settings-list-info">
                <h4>이메일 알림</h4>
                <p>주간 성적 리포트 및 주요 업데이트 이메일</p>
              </div>
              <div 
                className={`settings-toggle ${alarmSettings.mailAlram ? 'on' : ''}`}
                onClick={() => handleAlarmToggle('mailAlram')}
              >
                <div className="settings-toggle-handle" />
              </div>
            </div>

            <div className="settings-list-item">
              <div className="settings-list-info">
                <h4>순위 변동 알림</h4>
                <p>랭킹 순위 변동 시 알림 수신</p>
              </div>
              <div 
                className={`settings-toggle ${alarmSettings.rankingAlarm ? 'on' : ''}`}
                onClick={() => handleAlarmToggle('rankingAlarm')}
              >
                <div className="settings-toggle-handle" />
              </div>
            </div>
          </div>
        </Card>

        {/* 위험 구역 */}
        <Card title="위험 구역" variant="glass" padding="lg" className="settings-danger-card">
          <div className="settings-danger-zone">
            <div className="settings-danger-info">
              <h4>계정 삭제</h4>
              <p>탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
              <Trash2 size={16} /> 회원 탈퇴
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
