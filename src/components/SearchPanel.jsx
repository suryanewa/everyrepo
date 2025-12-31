import { useState } from 'react'
import FilterPanel from './FilterPanel'

export default function SearchPanel({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  onSelect, 
  onInfoClick,
  filters,
  onFiltersChange,
  activeFilterCount
}) {
  const [filterOpen, setFilterOpen] = useState(false)

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
      <button 
        className={`filter-toggle-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
        onClick={() => setFilterOpen(!filterOpen)} 
        title="Filter repositories"
        aria-label="Filter"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
        </svg>
        {activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount}</span>
        )}
      </button>
      
      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
      
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


