import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="search-filter-container">
      <span className="search-filter-icon">🔍</span>
      <input
        type="text"
        className="search-filter-input"
        placeholder="Search files and folders..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchTerm && (
        <button className="search-filter-clear" onClick={() => onSearchChange('')}>
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
