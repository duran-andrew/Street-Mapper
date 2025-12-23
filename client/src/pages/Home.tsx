import { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  useCreateSession,
  useAddBreadcrumb,
  useOSMData,
} from "@/hooks/use-map-data";
import { MapController } from "@/components/MapController";
import { StatsPanel } from "@/components/StatsPanel";
import { StartButton } from "@/components/StartButton";
import {
  parseOSMData,
  isPointNearLine,
  findNearestUnvisited,
  type StreetSegment,
} from "@/lib/geo-utils";
import { Loader2, Locate, Map as MapIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as turf from "@turf/turf";

// Default to a central location if GPS fails (e.g., Times Square)
const DEFAULT_CENTER: [number, number] = [40.758, -73.9855];

export default function Home() {
  const { coords, error: geoError } = useGeolocation();
  const { toast } = useToast();

  // State
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [segments, setSegments] = useState<StreetSegment[]>([]);
  const [targetSegment, setTargetSegment] = useState<StreetSegment | null>(
    null,
  );
  const [distanceDriven, setDistanceDriven] = useState(0);
  const [loadingOSM, setLoadingOSM] = useState(false);
  const [followUser, setFollowUser] = useState(true);

  // Mutations
  const createSession = useCreateSession();
  const addBreadcrumb = useAddBreadcrumb();
  const fetchOSM = useOSMData();

  // Refs for accumulation without re-renders
  const lastPositionRef = useRef<[number, number] | null>(null);

  // Derived center
  const center: [number, number] = coords
    ? [coords.lat, coords.lng]
    : DEFAULT_CENTER;

  // 1. Initial Load: Fetch OSM data for the current area when user location is found
  useEffect(() => {
    if (coords && segments.length === 0 && !loadingOSM) {
      loadArea(coords.lat, coords.lng);
    }
  }, [coords, segments.length, loadingOSM]);

  const loadArea = async (lat: number, lng: number) => {
    setLoadingOSM(true);
    // Fetch a roughly 16km x 16km box or 10 miles x 10 miles
    const offset = 0.04;
    try {
      const data = await fetchOSM.mutateAsync({
        north: lat + offset,
        south: lat - offset,
        east: lng + offset,
        west: lng - offset,
      });
      const parsed = parseOSMData(data);
      setSegments(parsed);
      toast({
        title: "Map Data Loaded",
        description: `Found ${parsed.length} driveable streets in your area.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error loading map",
        description:
          "Could not fetch street data. Try checking your connection.",
      });
    } finally {
      setLoadingOSM(false);
    }
  };

  // 2. Tracking Logic: Runs every time coords update
  useEffect(() => {
    if (!isActive || !coords || !sessionId) return;

    const currentPos: [number, number] = [coords.lat, coords.lng];

    // A. Add breadcrumb
    addBreadcrumb.mutate({
      sessionId,
      lat: coords.lat,
      lng: coords.lng,
      accuracy: coords.accuracy,
    });

    // B. Calculate distance driven
    if (lastPositionRef.current) {
      const from = turf.point([
        lastPositionRef.current[1],
        lastPositionRef.current[0],
      ]);
      const to = turf.point([coords.lng, coords.lat]);
      const dist = turf.distance(from, to, { units: "kilometers" });
      setDistanceDriven((d) => d + dist);
    }
    lastPositionRef.current = [coords.lat, coords.lng];

    // C. Check for street visits
    let visitedCount = 0;
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.visited) return seg; // Already visited
        // Note: GeoJSON is [lng, lat], our coords are {lat, lng}
        // isPointNearLine expects [lng, lat]
        const near = isPointNearLine([coords.lng, coords.lat], seg.geometry);
        if (near) visitedCount++;
        return near ? { ...seg, visited: true } : seg;
      }),
    );

    if (visitedCount > 0) {
      // Optional haptic feedback or sound could go here
    }

    // D. Update navigation target
    const nearest = findNearestUnvisited([coords.lng, coords.lat], segments);
    setTargetSegment(nearest);
  }, [coords, isActive, sessionId]); // Depend on coords updating

  // Handlers
  const handleToggleSession = async () => {
    if (isActive) {
      // Stop
      setIsActive(false);
      setSessionId(null);
      lastPositionRef.current = null;
      setTargetSegment(null);
      toast({
        title: "Session Ended",
        description: `You drove ${distanceDriven.toFixed(2)}km. Good job!`,
      });
    } else {
      // Start
      try {
        const session = await createSession.mutateAsync({
          name: `Drive - ${new Date().toLocaleString()}`,
        });
        setSessionId(session.id);
        setIsActive(true);
        setDistanceDriven(0);
        setFollowUser(true);

        // If no segments loaded yet (e.g. GPS just arrived), load now
        if (segments.length === 0 && coords) {
          loadArea(coords.lat, coords.lng);
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to start",
          description: "Could not create session. Please try again.",
        });
      }
    }
  };

  // Visualizing Segments
  const visitedSegments = useMemo(
    () => segments.filter((s) => s.visited),
    [segments],
  );
  const unvisitedSegments = useMemo(
    () => segments.filter((s) => !s.visited),
    [segments],
  );

  return (
    <div className="relative h-screen w-screen bg-slate-100 overflow-hidden">
      {/* Map Layer */}
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapController center={center} followUser={followUser} />

        {/* Unvisited Streets - Red/Gray */}
        {unvisitedSegments.map((seg) => (
          <Polyline
            key={seg.id}
            positions={seg.geometry.coordinates.map((c: any) => [c[1], c[0]])} // GeoJSON [lng, lat] -> Leaflet [lat, lng]
            pathOptions={{
              color: "#ef4444",
              weight: 4,
              opacity: 0.4,
              lineCap: "round",
            }}
          />
        ))}

        {/* Visited Streets - Green/Blue */}
        {visitedSegments.map((seg) => (
          <Polyline
            key={seg.id}
            positions={seg.geometry.coordinates.map((c: any) => [c[1], c[0]])}
            pathOptions={{
              color: "#22c55e",
              weight: 6,
              opacity: 0.8,
              lineCap: "round",
            }}
          />
        ))}

        {/* Navigation Hint Line */}
        {isActive && targetSegment && coords && (
          <Polyline
            positions={[
              [coords.lat, coords.lng],
              [
                targetSegment.geometry.coordinates[0][1],
                targetSegment.geometry.coordinates[0][0],
              ],
            ]}
            pathOptions={{
              color: "#3b82f6",
              weight: 2,
              dashArray: "10, 10",
              opacity: 0.6,
            }}
          />
        )}

        {/* User Location */}
        {coords && (
          <CircleMarker
            center={[coords.lat, coords.lng]}
            radius={8}
            pathOptions={{
              color: "white",
              fillColor: "#3b82f6",
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-[500] pointer-events-none p-4 md:p-6 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="glass-panel p-2 rounded-full shadow-lg">
            <div className="flex items-center gap-2 px-2">
              <MapIcon className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm tracking-tight text-foreground">
                StreetConqueror
              </span>
            </div>
          </div>

          <button
            onClick={() => setFollowUser(!followUser)}
            className={`p-3 rounded-full shadow-lg transition-all ${followUser ? "bg-primary text-white" : "bg-white text-gray-700"}`}
          >
            <Locate className="w-5 h-5" />
          </button>
        </div>

        {/* Center Loading Indicator */}
        {(loadingOSM || (!coords && !geoError)) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel px-6 py-4 rounded-2xl flex flex-col items-center gap-3 shadow-2xl pointer-events-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="font-medium text-sm text-muted-foreground">
              {loadingOSM ? "Loading map data..." : "Acquiring GPS..."}
            </span>
          </div>
        )}

        {/* Error State */}
        {geoError && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-2xl pointer-events-auto text-center max-w-xs">
            <span className="font-bold">GPS Error</span>
            <span className="text-xs">
              Please enable location services to use this app. (
              {geoError.message})
            </span>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          {/* Stats Panel - positioned top right */}
          <div
            className={`absolute top-20 right-4 transition-all duration-500 ease-out transform ${isActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0 pointer-events-none"}`}
          >
            <StatsPanel
              distanceDriven={distanceDriven}
              streetsVisited={visitedSegments.length}
              totalStreets={segments.length}
              isTracking={isActive}
            />
          </div>

          {/* Start/Stop Button */}
          <div className="pb-4">
            <StartButton
              active={isActive}
              onClick={handleToggleSession}
              disabled={!coords || loadingOSM}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
