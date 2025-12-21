import { useMutation } from '@tanstack/react-query';
import { api } from '@shared/routes';

interface DirectionsResponse {
  distance: number;
  duration: number;
  steps: Array<{
    distance: number;
    duration: number;
    instruction: string;
    name?: string;
  }>;
}

export function useDirections() {
  return useMutation<DirectionsResponse, Error, {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  }>({
    mutationFn: async (params) => {
      const response = await fetch(api.directions.get.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to fetch directions');
      return response.json();
    },
  });
}
