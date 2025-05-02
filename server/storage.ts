import { db } from "@db";
import { 
  users, 
  databaseConnections, 
  extractionJobs, 
  scrapedItems,
  detectedElements
} from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";
import type { 
  DatabaseConnection, 
  ExtractedData, 
  ExtractionJob as SchemaExtractionJob,
  DetectedElement 
} from "@shared/schema";

// User related functions
export const storage = {
  async getUserById(id: number) {
    return await db.query.users.findFirst({
      where: eq(users.id, id)
    });
  },

  async getUserByUsername(username: string) {
    return await db.query.users.findFirst({
      where: eq(users.username, username)
    });
  },

  async createUser(username: string, password: string, isPremium: boolean = false) {
    const [user] = await db.insert(users)
      .values({ username, password, isPremium })
      .returning();
    return user;
  },

  async updateUserPremiumStatus(userId: number, isPremium: boolean) {
    const [updatedUser] = await db.update(users)
      .set({ isPremium })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  },

  // Database connection related functions
  async getConnectionsByUserId(userId: number) {
    return await db.query.databaseConnections.findMany({
      where: eq(databaseConnections.userId, userId),
      orderBy: asc(databaseConnections.name)
    });
  },

  async getConnectionById(id: number) {
    return await db.query.databaseConnections.findFirst({
      where: eq(databaseConnections.id, id)
    });
  },

  async createConnection(connection: Omit<DatabaseConnection, 'id'>) {
    const [newConnection] = await db.insert(databaseConnections)
      .values(connection)
      .returning();
    return newConnection;
  },

  async updateConnection(id: number, connection: Partial<Omit<DatabaseConnection, 'id'>>) {
    const [updatedConnection] = await db.update(databaseConnections)
      .set(connection)
      .where(eq(databaseConnections.id, id))
      .returning();
    return updatedConnection;
  },

  async deleteConnection(id: number) {
    await db.delete(databaseConnections)
      .where(eq(databaseConnections.id, id));
  },

  // Extraction job related functions
  async createExtractionJob(job: Omit<SchemaExtractionJob, 'id'>) {
    const [newJob] = await db.insert(extractionJobs)
      .values(job)
      .returning();
    return newJob;
  },

  async getExtractionJobById(id: number) {
    return await db.query.extractionJobs.findFirst({
      where: eq(extractionJobs.id, id),
      with: {
        elements: true
      }
    });
  },

  async getExtractionJobsByUserId(userId: number) {
    return await db.query.extractionJobs.findMany({
      where: eq(extractionJobs.userId, userId),
      orderBy: desc(extractionJobs.timestamp),
      with: {
        elements: true
      }
    });
  },

  async updateExtractionJobStatus(id: number, status: 'completed' | 'in-progress' | 'failed') {
    const [updatedJob] = await db.update(extractionJobs)
      .set({ status })
      .where(eq(extractionJobs.id, id))
      .returning();
    return updatedJob;
  },

  // Detected elements related functions
  async saveDetectedElements(elements: Omit<DetectedElement, 'id'>[], jobId: number) {
    if (elements.length === 0) return [];
    
    const elementsWithJobId = elements.map(element => ({
      ...element,
      jobId
    }));
    
    return await db.insert(detectedElements)
      .values(elementsWithJobId)
      .returning();
  },

  async getDetectedElementsByJobId(jobId: number) {
    return await db.query.detectedElements.findMany({
      where: eq(detectedElements.jobId, jobId)
    });
  },

  // Scraped items related functions
  async saveScrapedItems(items: Omit<ExtractedData, 'id'>[], jobId: number) {
    if (items.length === 0) return [];
    
    const itemsWithJobId = items.map(item => ({
      ...item,
      jobId
    }));
    
    return await db.insert(scrapedItems)
      .values(itemsWithJobId)
      .returning();
  },

  async getScrapedItemsByJobId(jobId: number) {
    return await db.query.scrapedItems.findMany({
      where: eq(scrapedItems.jobId, jobId)
    });
  }
};
