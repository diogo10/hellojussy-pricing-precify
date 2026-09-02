import { MongoClient } from 'mongodb';

class MongoDBConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  static getInstance() {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  getConnectionOptions() {
    return {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000', 10),
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10),
      retryWrites: true,
      retryReads: true,
    };
  }

  getMongoURI() {
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const host = process.env.MONGODB_HOST || 'localhost';
    const port = process.env.MONGODB_PORT || '27017';
    const database = process.env.MONGODB_DATABASE || 'pricing_precify';
    const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';

    if (process.env.MONGODB_URI) {
      return process.env.MONGODB_URI;
    }

    if (username && password) {
      return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
    }

    return `mongodb://${host}:${port}/${database}`;
  }

  getDatabaseName() {
    return process.env.MONGODB_DATABASE || 'pricing_precify';
  }

  async connect() {
    if (this.isConnected && this.db) {
      return this.db;
    }

    try {
      const uri = this.getMongoURI();
      const options = this.getConnectionOptions();

      this.client = new MongoClient(uri, options);

      await this.client.connect();

      this.db = this.client.db(this.getDatabaseName());

      await this.db.command({ ping: 1 });

      this.isConnected = true;

      console.log('MongoDB connected successfully');

      this.client.on('error', (error) => {
        console.error('MongoDB client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('MongoDB connection closed');
        this.isConnected = false;
      });

      return this.db;
    } catch (error) {
      this.isConnected = false;
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  getDb() {
    return this.db;
  }

  getClient() {
    return this.client;
  }

  isConnectedStatus() {
    return this.isConnected;
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.db = null;
        console.log('MongoDB disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        throw error;
      }
    }
  }

  reset() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }
}

MongoDBConnection.instance = null;

export const mongodbConnection = MongoDBConnection.getInstance();

export async function getMongoDb() {
  return mongodbConnection.connect();
}

export function getMongoClient() {
  return mongodbConnection.getClient();
}

export default mongodbConnection;