import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { analyzeHtml, extractDataFromHtml } from "./openai";
import fetch from "node-fetch";
import { stringify } from "csv-stringify/sync";
import { nanoid } from "nanoid";
import { 
  extractionJobInsertSchema, 
  detectedElementInsertSchema,
  scrapedItemInsertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Define api prefix
  const apiPrefix = "/api";

  // Mock user for demo
  const DEMO_USER = {
    id: 1,
    username: "demo",
    isPremium: true
  };

  // Create a test database connection for premium users
  const TEST_DB_CONNECTION = {
    id: "1",
    name: "My Postgres DB",
    host: "localhost",
    port: 5432,
    database: "scrapii",
    username: "postgres",
    userId: 1
  };

  // Page analysis endpoint
  app.post(`${apiPrefix}/analyze/rescan`, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // We'll just return success as the client will fetch updated data with other endpoints
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error rescanning page:", error);
      return res.status(500).json({ error: "Failed to rescan page" });
    }
  });

  // Get page info
  app.get(`${apiPrefix}/analyze/page`, async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract page title from HTML
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : "Unknown Page";
        
        // Extract favicon
        const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
        let favicon = faviconMatch ? faviconMatch[1] : null;
        
        // If favicon is a relative path, make it absolute
        if (favicon && !favicon.startsWith('http')) {
          const urlObj = new URL(url);
          favicon = `${urlObj.origin}${favicon.startsWith('/') ? '' : '/'}${favicon}`;
        }
        
        return res.status(200).json({
          url,
          title,
          favicon
        });
      } catch (error) {
        console.error("Error fetching page:", error);
        return res.status(400).json({ error: "Failed to fetch page" });
      }
    } catch (error) {
      console.error("Error analyzing page:", error);
      return res.status(500).json({ error: "Failed to analyze page" });
    }
  });

  // Get detected elements
  app.get(`${apiPrefix}/analyze/elements`, async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      try {
        const response = await fetch(url);
        const html = await response.text();
        
        const analysis = await analyzeHtml(html, url);
        
        return res.status(200).json(analysis.elements || []);
      } catch (error) {
        console.error("Error detecting elements:", error);
        return res.status(400).json({ error: "Failed to detect elements" });
      }
    } catch (error) {
      console.error("Error analyzing elements:", error);
      return res.status(500).json({ error: "Failed to analyze elements" });
    }
  });

  // Get pagination info
  app.get(`${apiPrefix}/analyze/pagination`, async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      try {
        const response = await fetch(url);
        const html = await response.text();
        
        const analysis = await analyzeHtml(html, url);
        
        return res.status(200).json(analysis.pagination || {
          pattern: null,
          currentPage: 1,
          totalPages: null,
          detected: false
        });
      } catch (error) {
        console.error("Error detecting pagination:", error);
        return res.status(400).json({ error: "Failed to detect pagination" });
      }
    } catch (error) {
      console.error("Error analyzing pagination:", error);
      return res.status(500).json({ error: "Failed to analyze pagination" });
    }
  });

  // Update element
  app.put(`${apiPrefix}/elements/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const element = req.body;
      
      // Validate element schema
      try {
        const validatedElement = detectedElementInsertSchema.parse({
          ...element,
          type: element.type || "text",
          selected: element.selected !== undefined ? element.selected : true
        });
        
        return res.status(200).json({ ...validatedElement, id });
      } catch (error) {
        return res.status(400).json({ error: "Invalid element data" });
      }
    } catch (error) {
      console.error("Error updating element:", error);
      return res.status(500).json({ error: "Failed to update element" });
    }
  });

  // Add new element
  app.post(`${apiPrefix}/elements`, async (req, res) => {
    try {
      const element = req.body;
      
      // Validate element schema
      try {
        const validatedElement = detectedElementInsertSchema.parse({
          ...element,
          type: element.type || "text",
          selected: element.selected !== undefined ? element.selected : true
        });
        
        return res.status(201).json({ ...validatedElement, id: nanoid() });
      } catch (error) {
        return res.status(400).json({ error: "Invalid element data" });
      }
    } catch (error) {
      console.error("Error adding element:", error);
      return res.status(500).json({ error: "Failed to add element" });
    }
  });

  // Preview data
  app.get(`${apiPrefix}/preview`, async (req, res) => {
    try {
      const url = req.query.url as string;
      const elementIds = (req.query.elements as string || "").split(',').filter(Boolean);
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      if (elementIds.length === 0) {
        return res.status(200).json([]);
      }

      try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Get all elements
        const analysisResponse = await analyzeHtml(html, url);
        const elements = analysisResponse.elements || [];
        
        // Filter elements by selected IDs
        const selectedElements = elements.filter(el => elementIds.includes(el.id));
        
        if (selectedElements.length === 0) {
          return res.status(200).json([]);
        }
        
        // Extract data based on selected elements
        const extractedData = await extractDataFromHtml(html, selectedElements);
        
        return res.status(200).json(extractedData);
      } catch (error) {
        console.error("Error generating preview:", error);
        return res.status(400).json({ error: "Failed to generate preview" });
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      return res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  // Extract data
  app.post(`${apiPrefix}/extract`, async (req, res) => {
    try {
      const { url, elements, pagination } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      if (!elements || elements.length === 0) {
        return res.status(400).json({ error: "At least one element must be selected" });
      }

      try {
        // For now, we'll just extract from the current page
        // In a real extension, we would handle pagination here
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract data based on selected elements
        const extractedData = await extractDataFromHtml(html, elements);
        
        // Create an extraction job
        const jobData = {
          userId: DEMO_USER.id,
          url,
          timestamp: Date.now(),
          status: 'completed' as const,
          paginationUsed: pagination ? true : false,
          totalPages: pagination?.option === 'all' ? 
            (pagination.totalPages || 1) : 
            pagination?.option === 'custom' ? 
              (pagination.customRange.to - pagination.customRange.from + 1) : 
              1
        };
        
        try {
          extractionJobInsertSchema.parse(jobData);
        } catch (error) {
          return res.status(400).json({ error: "Invalid job data" });
        }
        
        // Return the extracted data
        return res.status(200).json({
          success: true,
          data: extractedData
        });
      } catch (error) {
        console.error("Error extracting data:", error);
        return res.status(400).json({ error: "Failed to extract data" });
      }
    } catch (error) {
      console.error("Error extracting data:", error);
      return res.status(500).json({ error: "Failed to extract data" });
    }
  });

  // Export to CSV
  app.post(`${apiPrefix}/export/csv`, async (req, res) => {
    try {
      const { url, elements, pagination } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      if (!elements || elements.length === 0) {
        return res.status(400).json({ error: "At least one element must be selected" });
      }

      try {
        // Extract data using the same logic as the extract endpoint
        const response = await fetch(url);
        const html = await response.text();
        
        const extractedData = await extractDataFromHtml(html, elements);
        
        // Convert to CSV
        const headers = elements.map(el => el.name);
        const rows = extractedData.map(item => {
          return headers.map(header => item[header] || '');
        });
        
        const csv = stringify([headers, ...rows]);
        
        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=scrapii-export-${new Date().toISOString().slice(0, 10)}.csv`);
        
        return res.status(200).send(csv);
      } catch (error) {
        console.error("Error exporting to CSV:", error);
        return res.status(400).json({ error: "Failed to export to CSV" });
      }
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      return res.status(500).json({ error: "Failed to export to CSV" });
    }
  });

  // Export to Excel (for the demo, we'll just return the same CSV)
  app.post(`${apiPrefix}/export/excel`, async (req, res) => {
    try {
      const { url, elements, pagination } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      if (!elements || elements.length === 0) {
        return res.status(400).json({ error: "At least one element must be selected" });
      }

      try {
        // Extract data using the same logic as the extract endpoint
        const response = await fetch(url);
        const html = await response.text();
        
        const extractedData = await extractDataFromHtml(html, elements);
        
        // Convert to CSV (for demo purposes)
        const headers = elements.map(el => el.name);
        const rows = extractedData.map(item => {
          return headers.map(header => item[header] || '');
        });
        
        const csv = stringify([headers, ...rows]);
        
        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=scrapii-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
        
        return res.status(200).send(csv);
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        return res.status(400).json({ error: "Failed to export to Excel" });
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      return res.status(500).json({ error: "Failed to export to Excel" });
    }
  });

  // Export to database (premium feature)
  app.post(`${apiPrefix}/export/database`, async (req, res) => {
    try {
      const { url, elements, pagination, connectionId, tableName } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      if (!elements || elements.length === 0) {
        return res.status(400).json({ error: "At least one element must be selected" });
      }
      
      if (!connectionId) {
        return res.status(400).json({ error: "Database connection is required" });
      }
      
      if (!tableName) {
        return res.status(400).json({ error: "Table name is required" });
      }

      // Check if user is premium
      if (!DEMO_USER.isPremium) {
        return res.status(403).json({ error: "This feature is only available for premium users" });
      }

      try {
        // Extract data using the same logic as the extract endpoint
        const response = await fetch(url);
        const html = await response.text();
        
        const extractedData = await extractDataFromHtml(html, elements);
        
        // Simulate database export
        // In a real implementation, we would connect to the specified database and insert the data
        
        return res.status(200).json({
          success: true,
          message: `Data exported to database ${TEST_DB_CONNECTION.name}, table ${tableName}`,
          rowsInserted: extractedData.length
        });
      } catch (error) {
        console.error("Error exporting to database:", error);
        return res.status(400).json({ error: "Failed to export to database" });
      }
    } catch (error) {
      console.error("Error exporting to database:", error);
      return res.status(500).json({ error: "Failed to export to database" });
    }
  });

  // Premium status endpoint
  app.get(`${apiPrefix}/user/premium`, async (req, res) => {
    return res.status(200).json(DEMO_USER.isPremium);
  });

  // Database connections endpoint (premium only)
  app.get(`${apiPrefix}/database/connections`, async (req, res) => {
    // Check if user is premium
    if (!DEMO_USER.isPremium) {
      return res.status(403).json({ error: "This feature is only available for premium users" });
    }
    
    // Return mock database connections
    return res.status(200).json([TEST_DB_CONNECTION]);
  });

  const httpServer = createServer(app);
  return httpServer;
}
