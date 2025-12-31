import { useState, useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import SearchPanel from './components/SearchPanel'
import InfoPanel from './components/InfoPanel'
import InfoModal from './components/InfoModal'

// Data server URL (hosts vector tiles and graph data)
const DATA_SERVER = 'https://anvaka.github.io/map-of-github-data/'
const VERSION = 'v2'

// Galaxy spiral transformation - converts coordinates into a spiral pattern
function transformToGalaxy(lng, lat) {
  const centerX = 0
  const centerY = 0
  const x = lng - centerX
  const y = lat - centerY
  
  // Calculate polar coordinates
  const distance = Math.sqrt(x * x + y * y)
  const angle = Math.atan2(y, x)
  
  // Normalize distance (data extends roughly -60 to 60)
  const maxDist = 70
  const normalizedDist = Math.min(distance / maxDist, 1)
  
  // Create logarithmic spiral: tighter in center, looser at edges
  // Golden angle approximation for natural spiral
  const spiralTightness = 2.5
  const newAngle = angle + Math.pow(normalizedDist, 0.7) * spiralTightness * Math.PI
  
  // Compress outer regions slightly for more galaxy-like shape
  const compressionFactor = 1 - normalizedDist * 0.2
  const newDistance = normalizedDist * maxDist * compressionFactor
  
  // Convert back to cartesian
  const newX = centerX + newDistance * Math.cos(newAngle)
  const newY = centerY + newDistance * Math.sin(newAngle)
  
  return [newX, newY]
}

// Inverse transformation for click handling - approximate
function inverseGalaxyTransform(lng, lat) {
  const centerX = 0
  const centerY = 0
  const x = lng - centerX
  const y = lat - centerY
  
  const distance = Math.sqrt(x * x + y * y)
  const angle = Math.atan2(y, x)
  
  const maxDist = 70
  // Approximate inverse of the compression
  const normalizedDist = distance / (maxDist * 0.9)
  
  // Approximate inverse of spiral rotation
  const spiralTightness = 2.5
  const origAngle = angle - Math.pow(Math.min(normalizedDist, 1), 0.7) * spiralTightness * Math.PI
  
  const origDistance = normalizedDist * maxDist
  
  const origX = centerX + origDistance * Math.cos(origAngle)
  const origY = centerY + origDistance * Math.sin(origAngle)
  
  return [origX, origY]
}

// Transform GeoJSON coordinates
function transformGeoJSON(geojson) {
  if (!geojson || !geojson.features) return geojson
  
  const transformed = JSON.parse(JSON.stringify(geojson))
  
  transformed.features.forEach(feature => {
    if (feature.geometry && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates
      
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = coords
        feature.geometry.coordinates = transformToGalaxy(lng, lat)
      } else if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates = coords.map(ring =>
          ring.map(([lng, lat]) => transformToGalaxy(lng, lat))
        )
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates = coords.map(polygon =>
          polygon.map(ring =>
            ring.map(([lng, lat]) => transformToGalaxy(lng, lat))
          )
        )
      }
    }
  })
  
  return transformed
}

// Store original positions and properties for accurate lookups
const originalPositions = new Map()
const transformedPositions = new Map()
const pointProperties = new Map()

// Galaxy color scheme - nebula-like purples, pinks, and deep blues
const FILL_COLORS = [
  { input: 0, output: '#1a1a3e' },  // Deep space purple
  { input: 1, output: '#2d1b4e' },  // Dark violet
  { input: 2, output: '#3d2a5c' },  // Nebula purple
  { input: 3, output: '#1e3a5f' },  // Deep blue
  { input: 4, output: '#2a4a6a' },  // Ocean blue
  { input: 5, output: '#4a2a6a' },  // Violet
  { input: 6, output: '#3a3a7a' },  // Royal purple
  { input: 7, output: '#2a5a7a' },  // Teal blue
  { input: 8, output: '#5a3a8a' },  // Bright purple
]

// Cache for graph data
const graphCache = new Map()

async function loadGroupGraph(groupId) {
  if (graphCache.has(groupId)) {
    return graphCache.get(groupId)
  }
  
  try {
    const url = `${DATA_SERVER}${VERSION}/graphs/${groupId}.graph.dot`
    const response = await fetch(url)
    if (!response.ok) return null
    
    const text = await response.text()
    const graph = parseDotGraph(text)
    graphCache.set(groupId, graph)
    return graph
  } catch {
    return null
  }
}

function parseDotGraph(dotString) {
  const nodes = new Set()
  const links = []
  
  const lines = dotString.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (!trimmed || trimmed.startsWith('digraph') || trimmed.startsWith('strict') || trimmed === '}' || trimmed === '{') {
      continue
    }

    // Edge: "source" -> "target" [optional attributes]
    if (trimmed.includes('->')) {
      const edgeMatch = trimmed.match(/"([^"]+)"\s*->\s*"([^"]+)"/)
      if (edgeMatch) {
        const source = edgeMatch[1]
        const target = edgeMatch[2]
        nodes.add(source)
        nodes.add(target)
        links.push({ source, target })
      }
    }
  }
  
  console.log('Parsed graph:', nodes.size, 'nodes,', links.length, 'links')
  return { nodes, links }
}

export default function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [neighbors, setNeighbors] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    language: '',
    minStars: '',
    maxStars: '',
    minForks: '',
    maxForks: '',
    minConnections: '',
    maxConnections: '',
  })

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  // Initialize map
  useEffect(() => {
    if (map.current) return

    const colorStyle = ['case']
    FILL_COLORS.forEach(({ input, output }) => {
      colorStyle.push(['==', ['get', 'fill'], input], output)
    })
    colorStyle.push('#4d6a9c')

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      center: [0, 0],
      zoom: 4,
      minZoom: 4,
      maxZoom: 15,
      style: {
        version: 8,
        glyphs: `${DATA_SERVER}/fonts/{fontstack}/{range}.pbf`,
        sources: {
          'borders-source': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          },
          // Hidden source for extracting original positions
          'points-source': {
            type: 'vector',
            tiles: [`${DATA_SERVER}${VERSION}/points/{z}/{x}/{y}.pbf`],
            minzoom: 4,
            maxzoom: 7,
          },
          // Transformed points rendered as GeoJSON
          'transformed-points': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          },
          'place': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          },
          'connections': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          },
          'highlighted-nodes': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#03030a' } // Deep space black
          },
          {
            id: 'polygon-layer',
            type: 'fill',
            source: 'borders-source',
            filter: ['==', '$type', 'Polygon'],
            layout: {
              'visibility': 'none' // Hidden but kept in code
            },
            paint: { 
              'fill-color': colorStyle,
              'fill-opacity': 0.85
            }
          },
          // Outer glow layer for stars
          {
            id: 'circle-glow-layer',
            type: 'circle',
            source: 'points-source',
            'source-layer': 'points',
            filter: ['==', '$type', 'Point'],
            paint: {
              'circle-color': '#a855f7', // Purple glow
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.1, 10, 0.3],
              'circle-blur': 1,
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, ['*', ['get', 'size'], 0.4],
                12, ['*', ['get', 'size'], 3],
              ]
            }
          },
          // Main star points
          {
            id: 'circle-layer',
            type: 'circle',
            source: 'points-source',
            'source-layer': 'points',
            filter: ['==', '$type', 'Point'],
            paint: {
              // Vary color based on size - smaller = cooler colors, larger = warmer
              'circle-color': [
                'interpolate', ['linear'], ['get', 'size'],
                1, '#60a5fa',   // Blue (small repos)
                3, '#a78bfa',   // Purple
                5, '#f472b6',   // Pink
                8, '#fbbf24',   // Gold (large repos)
                12, '#ffffff'   // White (very large)
              ],
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1],
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, ['*', ['get', 'size'], 0.15],
                12, ['*', ['get', 'size'], 1.5],
              ]
            }
          },
          {
            id: 'connections-layer',
            type: 'line',
            source: 'connections',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': ['get', 'width'],
              'line-opacity': 0.7
            }
          },
          {
            id: 'highlighted-nodes-layer',
            type: 'circle',
            source: 'highlighted-nodes',
            paint: {
              'circle-color': ['get', 'color'],
              'circle-radius': ['get', 'radius'],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2
            }
          },
          {
            id: 'label-layer',
            type: 'symbol',
            source: 'points-source',
            'source-layer': 'points',
            filter: ['>=', ['zoom'], 9],
            layout: {
              'text-font': ['Roboto Condensed Regular'],
              'text-field': ['slice', ['get', 'label'], ['+', ['index-of', '/', ['get', 'label']], 1]],
              'text-anchor': 'top',
              'text-max-width': 10,
              'symbol-sort-key': ['-', 0, ['get', 'size']],
              'text-offset': [0, 0.5],
              'text-size': ['interpolate', ['linear'], ['zoom'], 6, ['/', ['get', 'size'], 5], 10, ['+', ['get', 'size'], 6]],
            },
            paint: {
              'text-color': '#e0e7ff',  // Soft blue-white
              'text-halo-color': '#03030a',
              'text-halo-width': 2,
            },
          },
          {
            id: 'place-labels',
            type: 'symbol',
            source: 'place',
            maxzoom: 10,
            layout: {
              'visibility': 'none', // Hidden but kept in code
              'text-font': ['Roboto Condensed Bold'],
              'text-size': [
                'interpolate', ['cubic-bezier', 0.2, 0, 0.7, 1], ['zoom'],
                1, ['step', ['get', 'symbolzoom'], 15, 4, 13, 5, 12],
                9, ['step', ['get', 'symbolzoom'], 22, 4, 19, 5, 17]
              ],
              'symbol-sort-key': ['get', 'symbolzoom'],
              'text-field': '{name}',
              'text-max-width': 6,
              'text-line-height': 1.1,
            },
            paint: {
              'text-color': 'rgba(224, 231, 255, 0.95)',  // Soft blue-white
              'text-halo-color': 'rgba(3, 3, 10, 0.9)',
              'text-halo-width': 2,
            },
            filter: ['<=', ['get', 'symbolzoom'], ['+', ['zoom'], 4]],
          },
        ],
      },
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    map.current.on('click', 'circle-layer', async (e) => {
      if (e.features?.length > 0) {
        const feature = e.features[0]
        const repoName = feature.properties.label
        const coords = feature.geometry.coordinates
        
        // Get groupId - try multiple sources
        let groupId = feature.properties.parent
        
        console.log('Clicked:', { repoName, groupId, coords })
        
        if (repoName) {
          setSelectedRepo({
            id: repoName,
            coordinates: coords,
            groupId
          })
          
          await showConnections(repoName, groupId, coords)
        }
      }
    })

    map.current.on('mouseenter', 'circle-layer', () => {
      map.current.getCanvas().style.cursor = 'pointer'
    })

    map.current.on('mouseleave', 'circle-layer', () => {
      map.current.getCanvas().style.cursor = ''
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Clear connections
  const clearConnections = useCallback(() => {
    if (map.current) {
      map.current.getSource('connections')?.setData({
        type: 'FeatureCollection',
        features: []
      })
      map.current.getSource('highlighted-nodes')?.setData({
        type: 'FeatureCollection',
        features: []
      })
    }
    setNeighbors([])
  }, [])

  // Helper to draw connections on map
  const drawConnections = useCallback((repoName, graph, coords) => {
    const { links } = graph
    
    // Build position lookup from rendered features on the map
    const positionMap = new Map()
    const renderedFeatures = map.current.querySourceFeatures('points-source', {
      sourceLayer: 'points'
    })
    renderedFeatures.forEach(f => {
      if (f.properties?.label && f.geometry?.coordinates) {
        positionMap.set(f.properties.label, f.geometry.coordinates)
      }
    })
    
    const repoCoords = positionMap.get(repoName) || coords
    
    const connectedRepos = []
    const connectionLines = []
    
    // Find all neighbors from the graph
    links.forEach(link => {
      let neighborName = null
      if (link.source === repoName) {
        neighborName = link.target
      } else if (link.target === repoName) {
        neighborName = link.source
      }
      
      if (neighborName) {
        const neighborCoords = positionMap.get(neighborName)
        if (neighborCoords) {
          connectedRepos.push({
            name: neighborName,
            lng: neighborCoords[0],
            lat: neighborCoords[1]
          })
          
          connectionLines.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [repoCoords, neighborCoords]
            },
            properties: { color: '#c084fc', width: 1.5 } // Purple glow lines
          })
        }
      }
    })

    console.log('Found', connectedRepos.length, 'visible neighbors out of graph')

    map.current.getSource('connections').setData({
      type: 'FeatureCollection',
      features: connectionLines
    })

    const highlightedFeatures = [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: repoCoords },
        properties: { color: '#f472b6', radius: 10 } // Pink for selected
      },
      ...connectedRepos.map(repo => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [repo.lng, repo.lat] },
        properties: { color: '#a78bfa', radius: 6 } // Purple for connections
      }))
    ]

    map.current.getSource('highlighted-nodes').setData({
      type: 'FeatureCollection',
      features: highlightedFeatures
    })

    setNeighbors(connectedRepos.slice(0, 15))
  }, [])

  // Show connection lines for a repository
  const showConnections = useCallback(async (repoName, groupId, coords) => {
    if (!map.current) {
      clearConnections()
      return
    }
    
    // If no groupId, try to find the repo in cached graphs
    if (groupId === undefined || groupId === null) {
      console.log('No groupId, searching for repo:', repoName)
      // Try first 30 groups (most repos are in lower-numbered groups)
      for (let gid = 0; gid < 30; gid++) {
        const graph = await loadGroupGraph(gid)
        if (graph && graph.nodes.has(repoName)) {
          console.log('Found repo in group:', gid)
          drawConnections(repoName, graph, coords)
          return
        }
      }
      console.log('Repo not found in searched groups')
      clearConnections()
      return
    }

    console.log('Loading graph for group:', groupId)
    const graph = await loadGroupGraph(groupId)
    if (!graph) {
      console.log('Failed to load graph for group:', groupId)
      clearConnections()
      return
    }

    drawConnections(repoName, graph, coords)
  }, [drawConnections, clearConnections])

  // Search functionality
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || !mapLoaded) {
      setSearchResults([])
      return
    }

    const features = map.current?.querySourceFeatures('points-source', {
      sourceLayer: 'points',
    }) || []

    const query = searchQuery.toLowerCase()
    const matches = features
      .filter(f => f.properties?.label?.toLowerCase().includes(query))
      .slice(0, 20)
      .map(f => ({
        id: f.properties.label,
        coordinates: f.geometry.coordinates,
        groupId: f.properties.parent
      }))

    setSearchResults(matches)
  }, [searchQuery, mapLoaded])

  const handleSearchSelect = useCallback(async (result) => {
    if (map.current && result.coordinates) {
      map.current.flyTo({
        center: result.coordinates,
        zoom: 10,
      })
      setSelectedRepo(result)
      setSearchQuery('')
      setSearchResults([])
      
      await showConnections(result.id, result.groupId, result.coordinates)
    }
  }, [showConnections])

  const handleNeighborClick = useCallback(async (neighbor) => {
    if (map.current) {
      const coords = [neighbor.lng, neighbor.lat]
      
      // Clear old connections first
      clearConnections()
      
      // Find the repository feature to get its groupId
      const features = map.current.querySourceFeatures('points-source', {
        sourceLayer: 'points',
        filter: ['==', ['get', 'label'], neighbor.name]
      })
      
      let groupId = features[0]?.properties?.parent
      
      map.current.flyTo({
        center: coords,
        zoom: map.current.getZoom(),
      })
      
      setSelectedRepo({
        id: neighbor.name,
        coordinates: coords,
        groupId
      })
      
      await showConnections(neighbor.name, groupId, coords)
    }
  }, [showConnections, clearConnections])

  const handleCloseInfo = useCallback(() => {
    setSelectedRepo(null)
    clearConnections()
  }, [clearConnections])

  const handleZoomIn = () => map.current?.zoomIn()
  const handleZoomOut = () => map.current?.zoomOut()
  const handleReset = () => {
    map.current?.flyTo({ center: [0, 0], zoom: 4 })
    handleCloseInfo()
  }

  return (
    <div className="app">
      <div ref={mapContainer} className="map-container" />
      
      <SearchPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelect={handleSearchSelect}
        onInfoClick={() => setInfoModalOpen(true)}
        filters={filters}
        onFiltersChange={setFilters}
        activeFilterCount={activeFilterCount}
      />

      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {selectedRepo && (
        <InfoPanel
          node={selectedRepo}
          neighbors={neighbors}
          onClose={handleCloseInfo}
          onNeighborClick={handleNeighborClick}
        />
      )}

      <div className="controls">
        <button className="control-btn" onClick={handleZoomIn} title="Zoom In">+</button>
        <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
        <button className="control-btn" onClick={handleReset} title="Reset View">⌂</button>
      </div>

      <div className="app-title">
        <h1>Every Repo at Once ✦ <a href="https://github.com/suryanewa" target="_blank" rel="noopener">@suryanewa</a></h1>
      </div>
    </div>
  )
}
