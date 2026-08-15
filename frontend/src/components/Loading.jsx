import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: '16px',
      color: 'var(--bw-text-dim)'
    }}>
      <div className="bw-spinner"></div>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{message}</p>
    </div>
  );
};

export default Loading;
