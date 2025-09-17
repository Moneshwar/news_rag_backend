import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "16596"),
      },
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    this.client.on("connect", () => {
      console.log("Redis client connected");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      console.log("Redis client disconnected");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureConnection();
    await this.client.set(key, value);
    console.log(`Data saved to redis: ${key}`);
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnection();
    const data = await this.client.get(key);
    console.log(`Data retrieved from redis: ${data ? "found" : "not found"}`);
    return data;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}
