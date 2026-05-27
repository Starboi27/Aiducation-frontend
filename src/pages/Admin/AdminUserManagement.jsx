import React, { useState, useEffect } from 'react';
import './AdminUserManagement.css';
import './admin-common.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import AdminBadge from '../../components/atoms/AdminBadge/AdminBadge';
import UserDetailPanel from '../../components/organisms/UserDetailPanel/UserDetailPanel';
import { adminService } from '../../services/adminService';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editExpId, setEditExpId] = useState(null);
  const [expDelta, setExpDelta] = useState('');
  const [expReason, setExpReason] = useState('');
  const [expResult, setExpResult] = useState(null);

  // 회원 상세 패널
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

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

  // ── 회원 상세 ──────────────────────────────────────────────
  const handleRowClick = async (user) => {
    setSelectedUser(user);
    setUserDetail(null);
    setIsDetailLoading(true);
    try {
      const res = await adminService.getUser(user.ourId);
      setUserDetail(res?.user ?? res);
    } catch (err) {
      console.error('회원 상세 로드 실패:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleClosePanel = () => {
    setSelectedUser(null);
    setUserDetail(null);
  };

  // ── 상태 변경 (패널 / 테이블 동기화) ─────────────────────
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = nextStatus === 'suspended' ? '관리자 정지' : '정지 해제';
    try {
      await adminService.updateUserStatus(user.ourId, nextStatus, reason);
      setUsers((prev) =>
        prev.map((u) => u.ourId === user.ourId ? { ...u, status: nextStatus } : u)
      );
      if (userDetail?.ourId === user.ourId) {
        setUserDetail((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      alert(`상태 변경 실패: ${err.message}`);
    }
  };

  // ── 강제 탈퇴 ───────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`"${user.name}" 사용자를 강제 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    if (!window.confirm('정말로 강제 탈퇴 처리하시겠습니까?')) return;
    try {
      await adminService.deleteUser(user.ourId, '관리자 강제 탈퇴');
      setUsers((prev) => prev.filter((u) => u.ourId !== user.ourId));
      if (selectedUser?.ourId === user.ourId) handleClosePanel();
    } catch (err) {
      alert(`탈퇴 처리 실패: ${err.message}`);
    }
  };

  // ── 경험치 조정 ─────────────────────────────────────────
  const handleEditExpStart = (user) => {
    setEditExpId(user.ourId);
    setExpDelta('');
    setExpReason('');
    setExpResult(null);
  };

  const handleUpdateExp = async (user) => {
    const delta = Number(expDelta);
    if (expDelta === '' || isNaN(delta)) { alert('조정값을 입력해주세요.'); return; }
    if (!expReason.trim()) { alert('조정 사유를 입력해주세요.'); return; }
    try {
      const res = await adminService.updateUserExp(user.ourId, delta, expReason.trim());
      const newTotalExp = res?.newTotalExp ?? Math.max(0, (user.totalExp ?? 0) + delta);
      const newLevel    = res?.newLevel    ?? user.level;
      setUsers((prev) =>
        prev.map((u) => u.ourId === user.ourId ? { ...u, totalExp: newTotalExp, level: newLevel } : u)
      );
      setExpResult({ ourId: user.ourId, newTotalExp, newLevel });
      setExpDelta('');
      setExpReason('');
    } catch (err) {
      alert(`경험치 조정 실패: ${err.message}`);
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
          <div className="exp-adjust-form" onClick={(e) => e.stopPropagation()}>
            <div className="exp-adjust-form__row">
              <Input
                type="number"
                placeholder="조정값 (예: +500, -200)"
                value={expDelta}
                onChange={(e) => setExpDelta(e.target.value)}
                className="exp-adjust-form__delta"
              />
              <Input
                type="text"
                placeholder="사유 입력"
                value={expReason}
                onChange={(e) => setExpReason(e.target.value)}
                className="exp-adjust-form__reason"
              />
            </div>
            {expResult?.ourId === user.ourId && (
              <div className="exp-adjust-form__result">
                ✅ Lv.{expResult.newLevel} · {expResult.newTotalExp.toLocaleString()} XP
              </div>
            )}
            <div className="exp-adjust-form__actions">
              <Button variant="outline" size="small" onClick={() => handleUpdateExp(user)}>적용</Button>
              <Button variant="ghost"   size="small" onClick={() => { setEditExpId(null); setExpResult(null); }}>취소</Button>
            </div>
          </div>
        ) : (
          <span
            className="exp-adjust-trigger"
            onClick={(e) => { e.stopPropagation(); handleEditExpStart(user); }}
            title="클릭하여 경험치 조정"
          >
            {user.totalExp?.toLocaleString() ?? '-'} XP
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
        <div className="table-actions" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="small" onClick={() => handleToggleStatus(user)}>
            {user.status === 'active' ? '정지' : '활성화'}
          </Button>
          <Button variant="danger" size="small" onClick={() => handleDelete(user)}>삭제</Button>
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

      <AdminTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        highlightRowId={selectedUser?.ourId}
        rowIdKey="ourId"
      />

      {selectedUser && (
        <UserDetailPanel
          detail={userDetail}
          isLoading={isDetailLoading}
          onClose={handleClosePanel}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default AdminUserManagement;
