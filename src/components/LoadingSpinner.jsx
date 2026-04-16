import React from 'react';

export default function LoadingSpinner({ text }) {
  return (
    <div className="loading-state">
      <div className="loader">
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
      </div>
      <p className="loading-text">{text || 'Analyzing contest history...'}</p>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="error-state fade-in-up">
      <div className="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <p className="error-text">{message}</p>
    </div>
  );
}
