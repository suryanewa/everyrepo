# Every Repo at Once

An interactive visualization of approximately 690,000 GitHub repositories arranged in a galaxy-like pattern. Each dot represents a repository, and their colors indicate size and popularity. Repositories are clustered based on their relationships and shared stargazers.

![Every Repo at Once](public/Every%20Repo%20Logo.svg)

## Features

- **Galaxy Visualization**: Explore hundreds of thousands of repositories in an interactive galaxy view
- **Search**: Find specific repositories using fuzzy search
- **Repository Details**: View real-time repository information including stars, forks, language, topics, and description
- **Connections**: See relationships between repositories based on shared stargazers
- **Filtering**: Filter repositories by language, stars, forks, and connections
- **Navigation**: Click on connected repositories to explore related projects
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 19** - UI framework
- **MapLibre GL** - Map rendering and visualization
- **Vite** - Build tool and development server
- **GitHub API** - Real-time repository data
- **Vector Tiles** - Efficient rendering of large-scale geospatial data
- **DOT Graph Format** - Repository connection data

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd map-of-github
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run start` - Start development server with host access
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Building for Production

Build the application for production:
```bash
npm run build
```

The output will be in the `dist` directory, ready to be deployed to any static hosting service.

## Project Structure

```
map-of-github/
├── public/              # Static assets
│   ├── public/         # Favicon files
│   └── fonts/           # Custom fonts
├── src/
│   ├── components/     # React components
│   │   ├── FilterPanel.jsx
│   │   ├── InfoModal.jsx
│   │   ├── InfoPanel.jsx
│   │   └── SearchPanel.jsx
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```

## How It Works

### Data Source

The visualization is built upon a dataset derived from GitHub activity events between February 2011 and May 2025, capturing approximately 500 million star events. The process involved:

1. **Star Relationships**: Extracted from GitHub activity events on Google BigQuery
2. **Jaccard Similarity**: Computed between repositories based on shared stargazers
3. **Clustering**: Applied Leiden clustering to group similar repositories, resulting in over 1,500 clusters with ~690,000 projects
4. **Layout**: Used force-directed layouts to compute positions of nodes within clusters and global cluster arrangement
5. **Rendering**: MapLibre GL renders vector tiles generated from this data

### Visualization

- Repository positions are loaded from vector tiles for efficient rendering
- Real-time repository statistics are fetched from the GitHub API
- Connection data is stored in DOT graph format and loaded on-demand
- The galaxy aesthetic is achieved through color schemes, glow effects, and visual styling

## Usage

1. **Explore**: Click on any repository dot to see its details and connections
2. **Search**: Use the search bar to find specific repositories
3. **Filter**: Click the filter button to filter repositories by various criteria
4. **Navigate**: Click linked repositories in the info panel to explore related projects
5. **Zoom**: Use mouse wheel or touch gestures to zoom in/out

## Browser Support

Modern browsers that support:
- ES6+ JavaScript
- WebGL (for MapLibre GL)
- CSS Grid and Flexbox

## License

MIT License - see LICENSE file for details

## Author

Created by [@suryanewa](https://github.com/suryanewa)

## Acknowledgments

Built using data processed from GitHub activity events. The visualization leverages MapLibre GL for efficient rendering of large-scale geospatial data.

