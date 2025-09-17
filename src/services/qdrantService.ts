import { QdrantClient } from "@qdrant/js-client-rest";

export class QdrantService {
  private client: QdrantClient;
  private collection?: string;

  constructor(url: string, apiKey?: string) {
    this.client = new QdrantClient({ url, apiKey });
  }

  async initCollection(collectionName: string, vectorSize: number = 768) {
    this.collection = collectionName;

    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === collectionName
    );

    if (!exists) {
      await this.client.createCollection(collectionName, {
        vectors: { size: vectorSize, distance: "Cosine" },
      });
      console.log(`Created collection: ${collectionName}`);
    } else {
      console.log(`Collection already exists: ${collectionName}`);
    }
  }

  async addDocuments(docs: { id: number; vector: number[]; payload: any }[]) {
    if (!this.collection) throw new Error("Collection not initialized");

    await this.client.upsert(this.collection, {
      wait: true,
      points: docs.map((d) => ({
        id: d.id,
        vector: d.vector,
        payload: d.payload,
      })),
    });
    console.log(`Inserted ${docs.length} documents into ${this.collection}`);
  }

  async searchDocuments(queryVector: number[], topK: number = 5) {
    if (!this.collection) throw new Error("Collection not initialized");

    const result = await this.client.search(this.collection, {
      vector: queryVector,
      limit: topK,
    });
    return result;
  }
}
