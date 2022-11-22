import { Collection, Database, MongoClient, ObjectId } from '../deps.ts';

export class Connect {
  private connection = new MongoClient();

  public async initialize(connect: string): Promise<void> {
    await this.connection.connect(connect);
  }

  public getConnection(): MongoClient {
    return this.connection;
  }

  public getDatabase<T extends string>(id: T): Database {
    return this.connection.database(id);
  }

  public getCollection<T extends string, V extends string, Z extends Schema>(database: T, collection: V): Collection<Z> {
    return this.getDatabase<T>(database).collection(collection);
  }
}

export class SimpleConnect {
  private static connect: Map<string, Connect> = new Map();

  public static async get(id?: string | 'default', connectString?: string): Promise<Connect> {
    id = id ?? 'default';
    if (!this.connect.has(id!)) {
      if (connectString === undefined) throw new Error('Attempted to access an unknown identifier without a ConnectString.');
      const connect = new Connect();
      await connect.initialize(connectString);
      this.connect.set(id!, connect);
    }
    return this.connect.get(id)!;
  }
}

export interface Schema {
  _id?: ObjectId;
  /** createdAt - Default - Required */
  createdAt: Date;
  /** lastUpdatedAt - Default - Optional */
  lastUpdatedAt?: Date;
}

export interface ConnectOptions {
  server: string;
  connection: string;
  database: AllowedDatabase;
}

export type AllowedDatabase = 'amethyst-dev' | 'amethyst';
export type AllowedTable =
  // Secure Tables
  | 'session'
  | 'trace'
  // Authentication Tables
  | 'user'
  | 'role'
  | 'attribute';
