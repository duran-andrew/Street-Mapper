import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  center: [number, number];
  zoom?: number;
  followUser?: boolean;
}

export function MapController({ center, zoom, followUser }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (followUser) {
      map.flyTo(center, zoom || map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [center, zoom, followUser, map]);

  return null;
}
