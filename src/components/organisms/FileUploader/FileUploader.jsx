import React, { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { Button, Badge } from '../../atoms';
import { useApp } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../../services/aiService';
import { subjectService } from '../../../services/subjectService';
import './FileUploader.css';

const SUPPORTED_TYPES = ['.pdf', '.txt', '.docx', '.md', '.pptx'];
const MAX_SIZE_MB = 20;
const TOPIC_COLORS = [
  '#6C5CE7', '#00cec9', '#fd79a8', '#fdcb6e',
  '#00b894', '#e17055', '#0984e3', '#a29bfe',
];

const FileUploader = ({ onAnalysisComplete }) => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [progressInfo, setProgressInfo] = useState({ step: '', progress: 0 });
  const [customSubjectName, setCustomSubjectName] = useState('');
  const { addNotification } = useApp();
  const navigate = useNavigate();

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_TYPES.includes(ext)) return `지원하지 않는 형식: ${ext}`;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `파일이 너무 큼 (최대 ${MAX_SIZE_MB}MB)`;
    return null;
  };

  const processFiles = (rawFiles) => {
    setError(null);
    const valid = [];
    const errors = [];
    Array.from(rawFiles).forEach(f => {
      const err = validateFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
      else valid.push({ file: f, id: Math.random().toString(36).slice(2), status: 'ready' });
    });
    if (errors.length) setError(errors.join(' | '));
    if (valid.length) setFiles(prev => [...prev, ...valid]);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const onFileInput = (e) => processFiles(e.target.files);

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const analyzeFiles = async () => {
    if (!files.length) return;
    setAnalyzing(true);
    setError(null);
    setFiles(prev => prev.map(f => ({ ...f, status: 'analyzing' })));

    try {
      const firstFile = files[0];

      // Step 1: 과목 먼저 생성하여 subjectId 확보
      const subjectName = customSubjectName.trim() || firstFile.file.name.replace(/\.[^.]+$/, '');
      const createdSubject = await subjectService.createSubject(subjectName);
      // 백엔드 Create 응답이 subjectId를 포함하지 않는 경우를 방어 (id 필드도 시도)
      const subjectId = createdSubject.subjectId ?? createdSubject.id;

      // Step 2: 파일 업로드 + 폴링으로 AI 분석 완료 대기
      const newSubject = await aiService.analyzeDocument(
        firstFile.file,
        (progress) => setProgressInfo(progress),
        { subjectId }
      );

      // 사용자가 직접 입력한 과목명이 있다면 덮어쓰기
      if (customSubjectName.trim()) {
        newSubject.subjectName = customSubjectName.trim();
      }

      setFiles(prev => prev.map(f => ({ ...f, status: 'done' })));
      
      addNotification({
        type: 'info',
        title: '파일 분석 완료',
        message: `"${newSubject.subjectName}"에서 ${newSubject.topics.length}개 주제를 발견했습니다.`,
      });

      // SubjectPage로 이동하며 pending subject 전달
      navigate('/subjects', { state: { newSubject } });
    } catch (err) {
      console.error(err);
      setError('분석 중 오류가 발생했습니다: ' + err.message);
      setFiles(prev => prev.map(f => ({ ...f, status: 'ready' })));
    } finally {
      setAnalyzing(false);
      setProgressInfo({ step: '', progress: 0 });
    }
  };

  return (
    <div className="file-uploader">
      {/* Drop zone */}
      <div
        className={`file-uploader__zone ${dragOver ? 'file-uploader__zone--drag' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={SUPPORTED_TYPES.join(',')}
          onChange={onFileInput}
          style={{ display: 'none' }}
        />
        <div className="file-uploader__zone-content">
          <div className={`file-uploader__upload-icon ${dragOver ? 'file-uploader__upload-icon--active' : ''}`}>
            <Upload size={36} />
          </div>
          <p className="file-uploader__title">
            {dragOver ? '여기에 놓으세요!' : '파일을 드래그하거나 클릭하여 업로드'}
          </p>
          <p className="file-uploader__subtitle">
            지원 형식: {SUPPORTED_TYPES.join(', ')} · 최대 {MAX_SIZE_MB}MB
          </p>
          <div className="file-uploader__types">
            {SUPPORTED_TYPES.map(t => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="file-uploader__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="file-uploader__details">
          <div className="file-uploader__name-input-wrapper" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              과목 이름 지정 (선택사항)
            </label>
            <input 
              type="text" 
              className="file-uploader__name-input" 
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              placeholder={`${files[0].file.name.replace(/\.[^.]+$/, '')}`}
              value={customSubjectName}
              onChange={(e) => setCustomSubjectName(e.target.value)}
              disabled={analyzing}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div className="file-uploader__list">
            <p className="file-uploader__list-title">업로드된 파일 ({files.length})</p>
            {files.map(({ id, file, status }) => (
            <div key={id} className={`file-uploader__item file-uploader__item--${status}`}>
              <div className="file-uploader__item-icon">
                {status === 'done' ? <CheckCircle size={18} /> : status === 'analyzing' ? <Brain size={18} className="animate-pulse" /> : <File size={18} />}
              </div>
              <div className="file-uploader__item-info">
                <p className="file-uploader__item-name">{file.name}</p>
                <p className="file-uploader__item-size">
                  {(file.size / 1024).toFixed(0)} KB
                  {status === 'analyzing' && ' · AI 분석 중...'}
                  {status === 'done' && ' · 분석 완료'}
                </p>
                {status === 'analyzing' && (
                  <div className="file-uploader__item-progress">
                    <div className="file-uploader__item-progress-text">
                      {progressInfo.step === 'reading' && '문서 읽는 중...'}
                      {progressInfo.step === 'analyzing' && '핵심 내용 파악 중...'}
                      {progressInfo.step === 'categorizing' && '주제 분류 중...'}
                      ({progressInfo.progress}%)
                    </div>
                    <div className="file-uploader__item-progress-bar-container">
                      <div 
                        className="file-uploader__item-progress-bar" 
                        style={{ width: `${progressInfo.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {status === 'ready' && (
                <button className="file-uploader__item-remove" onClick={() => removeFile(id)}>
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Analyze button */}
      {files.length > 0 && (
        <Button
          variant="primary"
          size="lg"
          icon={Brain}
          fullWidth
          loading={analyzing}
          onClick={analyzeFiles}
          disabled={analyzing || files.every(f => f.status === 'done')}
        >
          {analyzing ? 'AI 분석 중...' : files.every(f => f.status === 'done') ? '분석 완료 ✓' : `${files.length}개 파일 AI 분석 시작`}
        </Button>
      )}
    </div>
  );
};



export default FileUploader;
