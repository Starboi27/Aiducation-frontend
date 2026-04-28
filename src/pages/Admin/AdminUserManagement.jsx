import React, { useState, useEffect } from 'react';
import './AdminUserManagement.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import AdminBadge from '../../components/atoms/AdminBadge/AdminBadge';
import { authService } from '../../services/authService';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: '이름', accessor: 'name' },
    { header: '이메일', accessor: 'email' },
    { 
      header: '역할', 
      render: (user) => <AdminBadge role={user.role} /> 
    },
    { header: '레벨', accessor: 'level' },
    { 
      header: '상태', 
      render: (user) => (
        <span className={`status-dot ${user.status}`}>
          {user.status === 'active' ? '활성' : '비활성'}
        </span>
      ) 
    },
    { header: '가입일', render: (user) => new Date(user.createdAt).toLocaleDateString() },
    { 
      header: '관리', 
      render: (user) => (
        <div className="table-actions">
          <Button variant="outline" size="small">수정</Button>
          <Button variant="danger" size="small">정지</Button>
        </div>
      ) 
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">사용자 관리</h1>
        <div className="admin-page-actions">
          <Input 
            placeholder="이름 또는 이메일 검색" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <AdminTable columns={columns} data={filteredUsers} isLoading={isLoading} />
    </div>
  );
};

export default AdminUserManagement;
