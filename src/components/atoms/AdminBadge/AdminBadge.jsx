import React from 'react';
import './AdminBadge.css';

const AdminBadge = ({ role }) => {
  const isAdmin = role === 'admin';
  
  return (
    <span className={`admin-badge ${isAdmin ? 'admin' : 'user'}`}>
      {isAdmin ? 'ADMIN' : 'USER'}
    </span>
  );
};

export default AdminBadge;
