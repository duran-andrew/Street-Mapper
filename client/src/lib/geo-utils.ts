import * as turf from "@turf/turf";
import osmtogeojson from "osmtogeojson";

export interface StreetSegment {
  id: string;
  geometry: GeoJSON.LineString;
  properties: any;
  visited: boolean;
}

// Convert raw OSM JSON to a list of Street Segments
export function parseOSMData(osmData: any): StreetSegment[] {
  const geojson = osmtogeojson(osmData);
  const segments: StreetSegment[] = [];

  // Filter for driveable roads
  // Common OSM highway tags for roads
  const driveableTags = [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'unclassified', 'residential', 'living_street'
  ];

  geojson.features.forEach((feature: any) => {
    if (
      feature.geometry.type === "LineString" &&
      feature.properties?.highway &&
      driveableTags.includes(feature.properties.highway)
    ) {
      segments.push({
        id: feature.id,
        geometry: feature.geometry,
        properties: feature.properties,
        visited: false
      });
    }
  });

  return segments;
}

// Check if a point is near a line segment (e.g. within 20 meters)
export function isPointNearLine(
  point: [number, number], // [lng, lat]
  line: GeoJSON.LineString,
  thresholdMeters: number = 20
): boolean {
  const pt = turf.point(point);
  const ln = turf.lineString(line.coordinates);
  
  // pointToLineDistance returns distance in km by default unless units specified
  const distance = turf.pointToLineDistance(pt, ln, { units: 'meters' });
  return distance <= thresholdMeters;
}

// Find nearest unvisited segment to a point
export function findNearestUnvisited(
  point: [number, number],
  segments: StreetSegment[]
): StreetSegment | null {
  let nearest: StreetSegment | null = null;
  let minDistance = Infinity;
  const pt = turf.point(point);

  segments.forEach(seg => {
    if (seg.visited) return;
    const ln = turf.lineString(seg.geometry.coordinates);
    const dist = turf.pointToLineDistance(pt, ln, { units: 'meters' });
    if (dist < minDistance) {
      minDistance = dist;
      nearest = seg;
    }
  });

  return nearest;
}
