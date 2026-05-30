import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileUploader } from '../../components/organisms';
import { Card } from '../../components/molecules';
import './UploadPage.css';

const UploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const presetSubjectId = location.state?.subjectId ?? null;
  const presetSubjectName = location.state?.subjectName ?? null;
  const preloadedFile = location.state?.preloadedFile ?? null;

  const handleAnalysisComplete = (results) => {
    navigate('/quiz', { state: { questionsList: results } });
  };

  return (
    <div className="upload-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">파일 업로드 및 분석</h1>
        <p className="page-desc">
          {presetSubjectName
            ? `"${presetSubjectName}" 과목에 업로드할 파일을 선택하세요.`
            : '학습하고 싶은 강의 자료, PDF, 교안을 업로드하면 AI가 핵심 개념을 분석하여 퀴즈를 생성합니다.'}
        </p>
      </header>

      <div className="upload-page__content">
        <Card>
          <FileUploader
            onAnalysisComplete={handleAnalysisComplete}
            presetSubjectId={presetSubjectId}
            presetSubjectName={presetSubjectName}
            preloadedFile={preloadedFile}
          />
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
