import { useState } from 'react'

export default function SearchPanel({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  onSelect, 
  onInfoClick
}) {
  return (
    <div className="search-panel">
      <button className="info-btn" onClick={onInfoClick} title="About Every Repo at Once" aria-label="About">
        <span className="info-icon">i</span>
      </button>
      <div className="search-input-wrapper">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => onSelect(result)}
            >
              <div className="search-result-name">
                {result.id.includes('/') ? result.id.split('/')[1] : result.id}
              </div>
              <div className="search-result-owner">
                {result.id.includes('/') ? result.id.split('/')[0] : 'unknown'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


