export default function InfoModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className="info-modal-content">
          <h2>Every Repo at Once</h2>
          <p className="info-modal-subtitle">An Interactive Visualization of GitHub Repositories</p>
          
          <div className="info-modal-section">
            <h3>About</h3>
            <p>
              Every Repo at Once is an interactive visualization of a curated subset of public GitHub repositories, 
              arranged in a beautiful galaxy pattern. Each star represents a repository, and their colors indicate 
              size and popularity. This visualization showcases approximately 690,000 repositories organized into 
              clusters based on their relationships and shared stargazers.
            </p>
          </div>

          <div className="info-modal-section">
            <h3>Features</h3>
            <ul>
              <li>Explore hundreds of thousands of repositories in a galaxy view</li>
              <li>Search for specific repositories</li>
              <li>View repository details, stars, forks, and connections</li>
              <li>Navigate through related repositories</li>
              <li>Filter by language, stars, forks, and connections</li>
              <li>Discover the interconnected nature of open source</li>
            </ul>
          </div>

          <div className="info-modal-section">
            <h3>How to Use</h3>
            <ul>
              <li><strong>Click</strong> on any repository dot to see its details</li>
              <li><strong>Search</strong> for repositories using the search bar</li>
              <li><strong>Filter</strong> repositories by language, stars, forks, or connections</li>
              <li><strong>Zoom</strong> in/out to explore different regions</li>
              <li><strong>Click</strong> connected repositories to navigate</li>
            </ul>
          </div>

          <div className="info-modal-section">
            <h3>Data Source</h3>
            <p>
              The underlying dataset was created through a multi-phase process: First, star relationships were 
              extracted from GitHub activity events on Google BigQuery, covering events from February 2011 to 
              May 2025, resulting in approximately 500 million stars. Next, Jaccard Similarity was computed 
              between repositories to measure how many users starred both repositories. This similarity metric 
              was then used with Leiden clustering to organize repositories into over 1,500 clusters containing 
              around 690,000 projects. Finally, force-directed layouts were computed for nodes within clusters 
              and for the global arrangement of clusters themselves.
            </p>
            <p>
              The visualization uses MapLibre GL to render vector tiles generated from this data, with repository 
              details fetched in real-time from the GitHub API. Connection data is stored in DOT graph format 
              and loaded on-demand to show relationships between repositories.
            </p>
          </div>

          <div className="info-modal-footer">
            <p>
              Created by <a href="https://github.com/suryanewa" target="_blank" rel="noopener noreferrer">@suryanewa</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

