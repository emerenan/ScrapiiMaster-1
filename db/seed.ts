import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create a demo user
    const existingUser = await db.query.users.findFirst({
      where: (users) => ({ username: users.username, value: "demo" })
    });

    if (!existingUser) {
      console.log("Creating demo user...");
      const [user] = await db.insert(schema.users).values({
        username: "demo",
        password: "demo", // In a real app, this would be hashed
        isPremium: true,
      }).returning();
      
      console.log(`Created user: ${user.username} (ID: ${user.id})`);

      // Create a demo database connection
      const [connection] = await db.insert(schema.databaseConnections).values({
        userId: user.id,
        name: "My Postgres DB",
        host: "localhost",
        port: 5432,
        database: "scrapii",
        username: "postgres",
        password: "", // Password stored securely or empty for environment vars
      }).returning();
      
      console.log(`Created database connection: ${connection.name} (ID: ${connection.id})`);
    } else {
      console.log(`Demo user already exists with ID: ${existingUser.id}`);
      
      // Check if database connection exists
      const existingConnection = await db.query.databaseConnections.findFirst({
        where: (connections) => ({ field: connections.userId, value: existingUser.id })
      });
      
      if (!existingConnection) {
        const [connection] = await db.insert(schema.databaseConnections).values({
          userId: existingUser.id,
          name: "My Postgres DB",
          host: "localhost",
          port: 5432,
          database: "scrapii",
          username: "postgres",
          password: "", // Password stored securely or empty for environment vars
        }).returning();
        
        console.log(`Created database connection: ${connection.name} (ID: ${connection.id})`);
      } else {
        console.log(`Database connection already exists with ID: ${existingConnection.id}`);
      }
    }

    console.log("Database seed completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
