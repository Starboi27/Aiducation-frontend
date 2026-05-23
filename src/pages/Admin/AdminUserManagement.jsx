import React, { useState, useEffect } from 'react';
import './AdminUserManagement.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import AdminBadge from '../../components/atoms/AdminBadge/AdminBadge';
import { adminService } from '../../services/adminService';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editExpId, setEditExpId] = useState(null);
  const [expInput, setExpInput] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter((u) =>
        (u.name ?? '').toLowerCase().includes(term) ||
        (u.userId ?? '').toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term)
      )
    );
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      const list = data?.users ?? [];
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      console.error('사용자 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = nextStatus === 'suspended' ? '관리자 정지' : '정지 해제';
    try {
      await adminService.updateUserStatus(user.ourId, nextStatus, reason);
      setUsers((prev) =>
        prev.map((u) => (u.ourId === user.ourId ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      alert(`상태 변경 실패: ${err.message}`);
    }
  };

  const handleEditExpStart = (user) => {
    setEditExpId(user.ourId);
    setExpInput(String(user.totalExp ?? 0));
  };

  const handleUpdateExp = async (user) => {
    const exp = Number(expInput);
    if (isNaN(exp) || exp < 0) {
      alert('경험치는 0 이상의 숫자여야 합니다.');
      return;
    }
    try {
      await adminService.updateUserExp(user.ourId, exp);
      setUsers((prev) =>
        prev.map((u) => (u.ourId === user.ourId ? { ...u, totalExp: exp } : u))
      );
      setEditExpId(null);
    } catch (err) {
      alert(`경험치 수정 실패: ${err.message}`);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`"${user.name}" 사용자를 삭제하시겠습니까?`)) return;
    const reason = '관리자 삭제';
    try {
      await adminService.deleteUser(user.ourId, reason);
      setUsers((prev) => prev.filter((u) => u.ourId !== user.ourId));
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const columns = [
    { header: '이름',   accessor: 'name'   },
    { header: '아이디', accessor: 'userId' },
    { header: '이메일', accessor: 'email'  },
    { header: '역할',   render: (user) => <AdminBadge role={user.role} /> },
    { header: '레벨',   accessor: 'level'  },
    {
      header: '경험치',
      render: (user) =>
        editExpId === user.ourId ? (
          <div className="table-actions">
            <Input
              type="number"
              value={expInput}
              onChange={(e) => setExpInput(e.target.value)}
              style={{ width: '80px' }}
            />
            <Button variant="outline" size="small" onClick={() => handleUpdateExp(user)}>확인</Button>
            <Button variant="ghost"   size="small" onClick={() => setEditExpId(null)}>취소</Button>
          </div>
        ) : (
          <span
            style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
            onClick={() => handleEditExpStart(user)}
            title="클릭하여 수정"
          >
            {user.totalExp?.toLocaleString() ?? '-'}
          </span>
        ),
    },
    {
      header: '상태',
      render: (user) => (
        <span className={`status-dot ${user.status}`}>
          {user.status === 'active' ? '활성' : user.status === 'suspended' ? '정지' : '탈퇴'}
        </span>
      ),
    },
    { header: '가입일', render: (user) => new Date(user.joinDate).toLocaleDateString('ko-KR') },
    {
      header: '관리',
      render: (user) => (
        <div className="table-actions">
          <Button
            variant="outline"
            size="small"
            onClick={() => handleToggleStatus(user)}
          >
            {user.status === 'active' ? '정지' : '활성화'}
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => handleDelete(user)}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">사용자 관리</h1>
        <div className="admin-page-actions">
          <Input
            placeholder="이름, 아이디 또는 이메일 검색"
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
