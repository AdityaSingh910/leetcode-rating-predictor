import React, { useState } from 'react';

export default function SearchBar({ onSearch, loading, placeholder }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !loading) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || 'Enter LeetCode username...'}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          <span>{loading ? 'Loading...' : 'Predict'}</span>
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
