import { z } from 'zod';
import { insertSessionSchema, insertBreadcrumbSchema, sessions, breadcrumbs } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  sessions: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions',
      responses: {
        200: z.array(z.custom<typeof sessions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sessions',
      input: z.object({ name: z.string() }),
      responses: {
        201: z.custom<typeof sessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/sessions/:id',
      responses: {
        200: z.custom<typeof sessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  breadcrumbs: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions/:sessionId/breadcrumbs',
      responses: {
        200: z.array(z.custom<typeof breadcrumbs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/breadcrumbs',
      input: z.object({
        sessionId: z.number(),
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof breadcrumbs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  // Proxy endpoint to fetch OSM data to avoid CORS issues on client if needed
  // or simply to abstract the data fetching
  osm: {
    data: {
      method: 'POST' as const,
      path: '/api/osm/data',
      input: z.object({
        north: z.number(),
        south: z.number(),
        east: z.number(),
        west: z.number(),
      }),
      responses: {
        200: z.any(), // Returns GeoJSON or OSM JSON
      },
    },
  },
  // Get turn-by-turn directions from current location to target
  directions: {
    get: {
      method: 'POST' as const,
      path: '/api/directions',
      input: z.object({
        startLat: z.number(),
        startLng: z.number(),
        endLat: z.number(),
        endLng: z.number(),
      }),
      responses: {
        200: z.object({
          distance: z.number(),
          duration: z.number(),
          steps: z.array(z.object({
            distance: z.number(),
            duration: z.number(),
            instruction: z.string(),
            name: z.string().optional(),
          })),
        }),
        400: errorSchemas.validation,
      },
    },
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type SessionInput = z.infer<typeof api.sessions.create.input>;
export type BreadcrumbInput = z.infer<typeof api.breadcrumbs.create.input>;
export type OSMDataInput = z.infer<typeof api.osm.data.input>;
