import React, { useState, useEffect } from 'react';
import './AdminContentManagement.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import { aiService } from '../../services/aiService';
import Button from '../../components/atoms/Button/Button';

const AdminContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setIsLoading(true);
    try {
      const data = await aiService.getAllContents();
      setContents(data);
    } catch (error) {
      console.error('콘텐츠 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: '파일명', accessor: 'name' },
    { header: '업로드 유저', accessor: 'uploader' },
    { header: '크기', accessor: 'size' },
    { header: '토픽 수', accessor: 'topicCount' },
    { header: '퀴즈 수', accessor: 'quizCount' },
    { header: '업로드 일시', render: (content) => new Date(content.createdAt).toLocaleString() },
    { 
      header: '관리', 
      render: (content) => (
        <div className="table-actions">
          <Button variant="outline" size="small">조회</Button>
          <Button variant="danger" size="small">삭제</Button>
        </div>
      ) 
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">콘텐츠 관리</h1>
        <div className="admin-page-actions">
          <Button variant="primary">일괄 삭제</Button>
        </div>
      </div>

      <AdminTable columns={columns} data={contents} isLoading={isLoading} />
    </div>
  );
};

export default AdminContentManagement;
