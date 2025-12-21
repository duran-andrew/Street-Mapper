import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SessionInput, type BreadcrumbInput, type OSMDataInput } from "@shared/routes";
import { z } from "zod";

// === SESSIONS ===

export function useSessions() {
  return useQuery({
    queryKey: [api.sessions.list.path],
    queryFn: async () => {
      const res = await fetch(api.sessions.list.path);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return api.sessions.list.responses[200].parse(await res.json());
    },
  });
}

export function useSession(id: number | null) {
  return useQuery({
    queryKey: [api.sessions.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.sessions.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch session");
      return api.sessions.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SessionInput) => {
      const res = await fetch(api.sessions.create.path, {
        method: api.sessions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return api.sessions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.sessions.list.path] }),
  });
}

// === BREADCRUMBS ===

export function useSessionBreadcrumbs(sessionId: number | null) {
  return useQuery({
    queryKey: [api.breadcrumbs.list.path, sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return [];
      const url = buildUrl(api.breadcrumbs.list.path, { sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch breadcrumbs");
      return api.breadcrumbs.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddBreadcrumb() {
  return useMutation({
    mutationFn: async (data: BreadcrumbInput) => {
      const res = await fetch(api.breadcrumbs.create.path, {
        method: api.breadcrumbs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add breadcrumb");
      return api.breadcrumbs.create.responses[201].parse(await res.json());
    },
  });
}

// === OSM DATA ===

export function useOSMData() {
  return useMutation({
    mutationFn: async (data: OSMDataInput) => {
      const res = await fetch(api.osm.data.path, {
        method: api.osm.data.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to fetch OSM data");
      return await res.json(); // Returns GeoJSON/JSON directly
    },
  });
}
