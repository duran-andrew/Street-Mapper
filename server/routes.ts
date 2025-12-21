import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import axios from "axios";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Sessions ===
  app.get(api.sessions.list.path, async (req, res) => {
    const sessions = await storage.getSessions();
    res.json(sessions);
  });

  app.post(api.sessions.create.path, async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.sessions.get.path, async (req, res) => {
    const session = await storage.getSession(Number(req.params.id));
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  });

  // === Breadcrumbs ===
  app.get(api.breadcrumbs.list.path, async (req, res) => {
    const breadcrumbs = await storage.getBreadcrumbs(Number(req.params.sessionId));
    res.json(breadcrumbs);
  });

  app.post(api.breadcrumbs.create.path, async (req, res) => {
    try {
      const input = api.breadcrumbs.create.input.parse(req.body);
      const breadcrumb = await storage.createBreadcrumb(input);
      res.status(201).json(breadcrumb);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === OSM Proxy ===
  // Fetches driveable ways from Overpass API
  app.post(api.osm.data.path, async (req, res) => {
    try {
      const { north, south, east, west } = api.osm.data.input.parse(req.body);
      
      // Overpass QL query
      // Fetch 'way' with 'highway' tag inside bounding box
      // Exclude footways, cycleways, etc. to focus on driving
      const query = `
        [out:json][timeout:25];
        (
          way["highway"]
             ["highway"!~"footway|cycleway|path|steps|pedestrian|track|service"]
             (${south},${west},${north},${east});
        );
        out body;
        >;
        out skel qt;
      `;

      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const response = await axios.post(overpassUrl, query, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      res.json(response.data);
    } catch (err) {
      console.error('Overpass API Error:', err);
      res.status(500).json({ message: 'Failed to fetch map data' });
    }
  });

  // === Directions via OSRM ===
  // Gets turn-by-turn directions between two points
  app.post(api.directions.get.path, async (req, res) => {
    try {
      const { startLat, startLng, endLat, endLng } = api.directions.get.input.parse(req.body);
      
      // OSRM API (free, open-source routing)
      const osrmUrl = `https://router.project-osrm.org/route/v1/car/${startLng},${startLat};${endLng},${endLat}?steps=true&geometries=geojson&overview=full`;
      
      const response = await axios.get(osrmUrl);
      
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const steps: any[] = [];
        
        // Extract step-by-step instructions
        if (route.legs) {
          for (const leg of route.legs) {
            for (const step of leg.steps) {
              steps.push({
                distance: step.distance,
                duration: step.duration,
                instruction: step.maneuver?.instruction || 'Continue',
                name: step.name || 'Unnamed road',
              });
            }
          }
        }
        
        res.json({
          distance: route.distance,
          duration: route.duration,
          steps,
        });
      } else {
        res.status(400).json({ message: 'No route found' });
      }
    } catch (err) {
      console.error('OSRM API Error:', err);
      res.status(500).json({ message: 'Failed to get directions' });
    }
  });

  return httpServer;
}

// Optional seed function if we wanted to pre-populate sessions
async function seedDatabase() {
  const sessions = await storage.getSessions();
  if (sessions.length === 0) {
    // No seed needed for this user-driven app really, but we could add a demo session
  }
}
