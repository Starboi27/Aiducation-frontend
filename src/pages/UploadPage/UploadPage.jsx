import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '../../components/organisms';
import { Card } from '../../components/molecules';
import './UploadPage.css';

const UploadPage = () => {
  const navigate = useNavigate();

  const handleAnalysisComplete = (results) => {
    // Store results in context or state and pass to QuizPage
    navigate('/quiz', { state: { questionsList: results } });
  };

  return (
    <div className="upload-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">파일 업로드 및 분석</h1>
        <p className="page-desc">학습하고 싶은 강의 자료, PDF, 교안을 업로드하면 AI가 핵심 개념을 분석하여 퀴즈를 생성합니다.</p>
      </header>

      <div className="upload-page__content">
        <Card>
          <FileUploader onAnalysisComplete={handleAnalysisComplete} />
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
