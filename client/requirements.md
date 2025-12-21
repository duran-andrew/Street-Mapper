## Packages
leaflet | Core mapping library
react-leaflet | React components for Leaflet
@types/leaflet | Types for Leaflet
@turf/turf | Geospatial analysis (distance, checking if point is on line)
osmtogeojson | Convert OSM XML/JSON to GeoJSON for easy rendering

## Notes
The app relies on `navigator.geolocation` which requires HTTPS or localhost.
Map tiles will use OpenStreetMap standard tile layer.
The 'Fog of War' logic is client-side heavy:
1. Fetch OSM data for bounding box.
2. Convert to GeoJSON Lines.
3. On GPS update, check distance from user point to every unvisited line segment.
4. If < 20m, mark segment as visited.
