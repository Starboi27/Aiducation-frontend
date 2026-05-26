/**
 * OAuth 콜백 페이지
 * Spring Boot가 카카오/구글 OAuth 처리 후 아래 URL로 리다이렉트:
 *   http://localhost:3000/oauth/callback?token=<JWT>
 *
 * 이 페이지가 토큰을 추출해 자동 로그인 처리.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, tokenStorage, AUTH_CONFIG } from '../../services/authService';
import { useApp } from '../../context/AppContext';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('accessToken') ?? params.get('token');
    const refreshToken = params.get('refreshToken');
    const code = params.get('code');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(`소셜 로그인 실패: ${errorParam}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // 카카오: 인가 코드(code)를 받은 경우 → 백엔드로 포워딩해서 JWT 교환
    if (code && !token) {
      window.location.href = `${AUTH_CONFIG.baseUrl}/oauth/kakao/callback?code=${code}`;
      return;
    }

    if (!token) {
      setError('토큰을 받지 못했습니다.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // 이전 유저 정보 초기화 후 새 토큰 저장
    localStorage.removeItem('user_info');
    tokenStorage.set(token);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    authService
      .getMe(token)
      .then((user) => {
        setUser(user);
        navigate('/');
      })
      .catch(() => {
        tokenStorage.remove();
        setError('사용자 정보 조회에 실패했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      });
  }, [navigate, setUser]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      gap: 16,
    }}>
      {error ? (
        <>
          <p style={{ color: 'var(--color-danger)', fontSize: 16 }}>{error}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>3초 후 로그인 페이지로 이동합니다.</p>
        </>
      ) : (
        <>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 15 }}>로그인 처리 중...</p>
        </>
      )}
    </div>
  );
};

export default OAuthCallbackPage;
