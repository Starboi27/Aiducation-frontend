import React from 'react';
import './AdminTable.css';

const AdminTable = ({ columns, data, isLoading, emptyMessage = '데이터가 없습니다.' }) => {
  if (isLoading) {
    return (
      <div className="admin-table-loading">
        <div className="spinner"></div>
        <span>데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="admin-table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ width: col.width }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
