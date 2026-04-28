import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, BookOpen, Sparkles, MessageCircle, Globe, ArrowLeft, Search } from 'lucide-react';
import { authService, tokenStorage, AUTH_CONFIG } from '../../services/authService';
import { useApp } from '../../context/AppContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();

  // 'login' | 'signup' | 'findEmail' | 'findPassword'
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // 간단한 유효성 검사
    if (mode === 'findEmail') {
      if (!form.name.trim()) {
        setError('이름을 입력해주세요.');
        return;
      }
    } else if (mode === 'findPassword') {
      if (!form.email) {
        setError('이메일을 입력해주세요.');
        return;
      }
    } else {
      if (!form.email || !form.password) {
        setError('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      if (mode === 'signup' && !form.name.trim()) {
        setError('이름을 입력해주세요.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'findEmail') {
        const result = await authService.findEmail(form.name);
        setSuccessMsg(`등록된 이메일: ${result.email}`);
      } else if (mode === 'findPassword') {
        const result = await authService.resetPassword(form.email);
        setSuccessMsg(result.message);
      } else {
        let result;

        if (mode === 'login') {
          result = await authService.login(form.email, form.password);
        } else {
          result = await authService.signup(form.email, form.password, form.name);
        }

        tokenStorage.set(result.token);
        setUser(result.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider) => {
    setError('');

    if (AUTH_CONFIG.useMock) {
      // Mock 모드: Promise 반환 → 즉시 로그인 처리
      try {
        setLoading(true);
        const result = await authService.socialLogin(provider);
        tokenStorage.set(result.token);
        setUser(result.user);
        navigate('/');
      } catch (err) {
        setError(err.message || '소셜 계정 연동에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    } else {
      // Real 모드: 백엔드 OAuth 엔드포인트로 브라우저 리다이렉트 (반환값 없음)
      // Spring이 처리 후 /oauth/callback?token=<JWT> 로 돌아옴
      authService.socialLogin(provider);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setError('');
    setSuccessMsg('');
    setForm({ name: '', email: '', password: '' });
  };

  const goToFind = (findMode) => {
    setMode(findMode);
    setError('');
    setSuccessMsg('');
    setForm({ name: '', email: '', password: '' });
  };

  const backToLogin = () => {
    setMode('login');
    setError('');
    setSuccessMsg('');
    setForm({ name: '', email: '', password: '' });
  };

  return (
    <div className="login-page">
      {/* 배경 파티클 */}
      <div className="login-page__bg">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
        <div className="login-page__orb login-page__orb--3" />
      </div>

      <div className="login-page__card glass-card animate-fade-in">
        {/* 로고 */}
        <div className="login-page__logo">
          <div className="login-page__logo-icon">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="login-page__logo-title gradient-text">AIDucation</h1>
            <p className="login-page__logo-sub">AI 기반 맞춤 학습 플랫폼</p>
          </div>
        </div>

        {/* 탭 / 헤더 */}
        {(mode === 'login' || mode === 'signup') ? (
          <div className="login-page__tabs">
            <button
              id="tab-login"
              className={`login-page__tab ${mode === 'login' ? 'login-page__tab--active' : ''}`}
              onClick={() => switchMode()}
              disabled={mode === 'login'}
            >
              로그인
            </button>
            <button
              id="tab-signup"
              className={`login-page__tab ${mode === 'signup' ? 'login-page__tab--active' : ''}`}
              onClick={() => switchMode()}
              disabled={mode === 'signup'}
            >
              회원가입
            </button>
          </div>
        ) : (
          <div className="login-page__find-header animate-fade-in">
            <button
              type="button"
              className="login-page__back-btn"
              onClick={backToLogin}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="login-page__find-title">
              <Search size={18} />
              {mode === 'findEmail' ? '아이디(이메일) 찾기' : '비밀번호 찾기'}
            </h2>
          </div>
        )}

        {/* 폼 */}
        <form className="login-page__form" onSubmit={handleSubmit} noValidate>

          {/* 이름 (회원가입 / 이메일 찾기) */}
          {(mode === 'signup' || mode === 'findEmail') && (
            <div className="login-page__field animate-fade-in">
              <label htmlFor="input-name" className="login-page__label">이름</label>
              <div className="login-page__input-wrap">
                <User size={16} className="login-page__input-icon" />
                <input
                  id="input-name"
                  name="name"
                  type="text"
                  className="login-page__input"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {mode === 'findEmail' && (
                <p className="login-page__field-hint">가입 시 사용한 이름을 입력해주세요.</p>
              )}
            </div>
          )}

          {/* 이메일 (로그인 / 회원가입 / 비밀번호 찾기) */}
          {mode !== 'findEmail' && (
            <div className="login-page__field">
              <label htmlFor="input-email" className="login-page__label">이메일</label>
              <div className="login-page__input-wrap">
                <Mail size={16} className="login-page__input-icon" />
                <input
                  id="input-email"
                  name="email"
                  type="email"
                  className="login-page__input"
                  placeholder="test@test.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {mode === 'findPassword' && (
                <p className="login-page__field-hint">가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.</p>
              )}
            </div>
          )}

          {/* 비밀번호 (로그인 / 회원가입만) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="login-page__field">
              <label htmlFor="input-password" className="login-page__label">비밀번호</label>
              <div className="login-page__input-wrap">
                <Lock size={16} className="login-page__input-icon" />
                <input
                  id="input-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-page__input login-page__input--has-suffix"
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="login-page__pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="login-page__error animate-fade-in" role="alert">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {successMsg && (
            <div className="login-page__success animate-fade-in" role="status">
              {successMsg}
            </div>
          )}

          {/* Mock 힌트 (개발용) */}
          {mode === 'login' && (
            <div className="login-page__hint">
              <Sparkles size={12} />
              테스트 계정: test@test.com / 1234
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            id="btn-submit"
            type="submit"
            className="login-page__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-page__spinner" />
            ) : (
              { login: '로그인', signup: '회원가입', findEmail: '이메일 찾기', findPassword: '재설정 링크 발송' }[mode]
            )}
          </button>
        </form>

        {/* 아이디/비밀번호 찾기 링크 (로그인 모드에서만) */}
        {mode === 'login' && (
          <div className="login-page__find-links">
            <button type="button" className="login-page__find-btn" onClick={() => goToFind('findEmail')}>
              아이디 찾기
            </button>
            <span className="login-page__find-divider">|</span>
            <button type="button" className="login-page__find-btn" onClick={() => goToFind('findPassword')}>
              비밀번호 찾기
            </button>
          </div>
        )}

        {/* ── 소셜 로그인 구분선 (로그인/회원가입만) ── */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="login-page__divider">
              <span>또는 3초 만에 시작하기</span>
            </div>

            <div className="login-page__social">
              <button
                type="button"
                className="login-page__social-btn btn-kakao"
                onClick={() => handleSocialLogin('kakao')}
                disabled={loading}
              >
                <MessageCircle size={18} fill="currentColor" stroke="none" />
                카카오로 {mode === 'login' ? '시작하기' : '회원가입'}
              </button>

              <button
                type="button"
                className="login-page__social-btn btn-google"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              >
                <Globe size={18} strokeWidth={2.5} />
                구글로 {mode === 'login' ? '시작하기' : '회원가입'}
              </button>
            </div>
          </>
        )}

        {/* 모드 전환 */}
        {(mode === 'login' || mode === 'signup') ? (
          <p className="login-page__switch">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            {' '}
            <button
              id="btn-switch-mode"
              type="button"
              className="login-page__switch-btn"
              onClick={switchMode}
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        ) : (
          <p className="login-page__switch">
            <button
              type="button"
              className="login-page__switch-btn"
              onClick={backToLogin}
            >
              로그인으로 돌아가기
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
