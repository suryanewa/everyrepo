import { useState, useEffect } from 'react'

export default function InfoPanel({ node, neighbors = [], onClose, onNeighborClick }) {
  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [owner, repoName] = node.id.includes('/') 
    ? node.id.split('/') 
    : ['', node.id]

  useEffect(() => {
    let cancelled = false
    
    async function fetchRepoData() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`https://api.github.com/repos/${node.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Repository not found')
          } else if (response.status === 403) {
            setError('Rate limit exceeded')
          } else {
            setError('Failed to load')
          }
          setLoading(false)
          return
        }
        
        const data = await response.json()
        
        if (!cancelled) {
          setRepoData({
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.subscribers_count,
            language: data.language,
            topics: data.topics || [],
            updated: new Date(data.updated_at).toLocaleDateString(),
          })
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Network error')
          setLoading(false)
        }
      }
    }
    
    fetchRepoData()
    
    return () => {
      cancelled = true
    }
  }, [node.id])

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '—'
  }

  return (
    <div className="info-panel">
      <div className="info-panel-header">
        <div className="info-panel-title">{repoName || node.id}</div>
        <button className="info-panel-close" onClick={onClose}>×</button>
      </div>

      {owner && (
        <div className="info-panel-description" style={{ marginBottom: '8px' }}>
          by <strong>{owner}</strong>
        </div>
      )}

      {loading && (
        <div className="info-panel-description">Loading repository info...</div>
      )}

      {error && (
        <div className="info-panel-description" style={{ color: '#f85149' }}>{error}</div>
      )}

      {repoData && (
        <>
          {repoData.description && (
            <div className="info-panel-description">{repoData.description}</div>
          )}

          <div className="info-panel-stats">
            <div className="stat-item">
              <div className="stat-icon stat-icon-star">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(repoData.stars)}</div>
                <div className="stat-label">Stars</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon stat-icon-fork">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(repoData.forks)}</div>
                <div className="stat-label">Forks</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon stat-icon-connection">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 11-2.83-2.83l2.5-2.5z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{neighbors.length}</div>
                <div className="stat-label">Links</div>
              </div>
            </div>
          </div>

          {repoData.language && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--accent)',
                marginRight: '6px'
              }}></span>
              {repoData.language}
            </div>
          )}

          {repoData.topics?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
              {repoData.topics.slice(0, 5).map(topic => (
                <span key={topic} style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                  borderRadius: '12px',
                }}>
                  {topic}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <a
        href={`https://github.com/${node.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="info-panel-link"
      >
        View on GitHub →
      </a>

      {neighbors.length > 0 && (
        <div className="neighbors-section">
          <div className="neighbors-title">Linked Repositories ({neighbors.length})</div>
          <div className="neighbors-list">
            {neighbors.map((neighbor) => (
              <div
                key={neighbor.name}
                className="neighbor-item"
                onClick={() => onNeighborClick(neighbor)}
              >
                <div className="neighbor-dot"></div>
                <div className="neighbor-name">
                  {neighbor.name.includes('/') ? neighbor.name.split('/')[1] : neighbor.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
