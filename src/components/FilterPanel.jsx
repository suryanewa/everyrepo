import { useState } from 'react'

const POPULAR_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++',
  'C',
  'C#',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Scala',
  'Shell',
  'HTML',
  'CSS',
  'Vue',
  'React',
]

export default function FilterPanel({ isOpen, onClose, filters, onFiltersChange }) {
  const [localFilters, setLocalFilters] = useState(filters)

  if (!isOpen) return null

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = {
      language: '',
      minStars: '',
      maxStars: '',
      minForks: '',
      maxForks: '',
      minConnections: '',
      maxConnections: '',
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="filter-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="filter-content">
        <div className="filter-group">
          <label className="filter-label">Language</label>
          <select
            className="filter-select"
            value={localFilters.language}
            onChange={(e) => handleChange('language', e.target.value)}
          >
            <option value="">Any language</option>
            {POPULAR_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Stars</label>
          <div className="filter-range">
            <input
              type="number"
              className="filter-input"
              placeholder="Min"
              value={localFilters.minStars}
              onChange={(e) => handleChange('minStars', e.target.value)}
              min="0"
            />
            <span className="filter-range-separator">to</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Max"
              value={localFilters.maxStars}
              onChange={(e) => handleChange('maxStars', e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Forks</label>
          <div className="filter-range">
            <input
              type="number"
              className="filter-input"
              placeholder="Min"
              value={localFilters.minForks}
              onChange={(e) => handleChange('minForks', e.target.value)}
              min="0"
            />
            <span className="filter-range-separator">to</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Max"
              value={localFilters.maxForks}
              onChange={(e) => handleChange('maxForks', e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Connections</label>
          <div className="filter-range">
            <input
              type="number"
              className="filter-input"
              placeholder="Min"
              value={localFilters.minConnections}
              onChange={(e) => handleChange('minConnections', e.target.value)}
              min="0"
            />
            <span className="filter-range-separator">to</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Max"
              value={localFilters.maxConnections}
              onChange={(e) => handleChange('maxConnections', e.target.value)}
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <button className="filter-btn-reset" onClick={handleReset} disabled={!hasActiveFilters}>
          Reset
        </button>
        <button className="filter-btn-apply" onClick={handleApply}>
          Apply Filters
        </button>
      </div>
    </div>
  )
}




