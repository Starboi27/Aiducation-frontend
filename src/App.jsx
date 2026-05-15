import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import MainLayout from './components/templates/MainLayout/MainLayout';
import AdminLayout from './components/templates/AdminLayout/AdminLayout';
import { Dashboard, UploadPage, QuizPage, ReviewPage, ReportPage, RankingPage, SubjectPage, LoginPage, MyPage, SettingPage } from './pages';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserManagement from './pages/Admin/AdminUserManagement';
import AdminContentManagement from './pages/Admin/AdminContentManagement';
import AdminAIMonitor from './pages/Admin/AdminAIMonitor';
import AdminSettings from './pages/Admin/AdminSettings';
import OAuthCallbackPage from './pages/OAuthCallbackPage/OAuthCallbackPage';

// ── 관리자 전용 라우트 보호 컴포넌트 ──
const AdminRoute = ({ children }) => {
  const { user } = useApp();
  
  if (!user || user.role !== 'admin') {
    // 관리자가 아니면 메인으로 리다이렉트
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// ── 인증 상태에 따라 라우트를 분기하는 컴포넌트 ──
const AppRoutes = () => {
  const { user, isInitializing } = useApp();

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* OAuth 콜백: 로그인 전 접근 가능 (카카오/구글 소셜 로그인 완료 처리) */}
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
      
      {/* 사용자 전용 라우트 */}
      <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="subjects" element={<SubjectPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="quiz/:subjectId/:topicId" element={<QuizPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="mypage" element={<MyPage />} />
        {/* Fallback routes */}
        <Route path="notifications" element={<Dashboard />} />
        <Route path="settings" element={<SettingPage />} />
      </Route>

      {/* 관리자 전용 라우트 */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="contents" element={<AdminContentManagement />} />
        <Route path="ai-monitor" element={<AdminAIMonitor />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      </Routes>
      );
      };

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
