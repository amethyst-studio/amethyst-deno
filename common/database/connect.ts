import {
  Collection,
  Database,
  Filter,
  MongoClient,
  ObjectId,
  UpdateFilter,
} from "../deps.ts";

/**
 * Mongo Database Connection Client Class.
 */
export class ConnectClient {
  private connection = new MongoClient();

  /** Initialize the ConnectClient. */
  public async initialize(connect: string): Promise<ConnectClient> {
    await this.connection.connect(connect);
    return this;
  }

  /** Return the MongoClient. */
  public getConnection(): MongoClient {
    return this.connection;
  }

  /**
   * Return the Mongo Database.
   *
   * @param id The Database Identifier.
   */
  public getDatabase(id: AllowedDatabase): Database {
    return this.connection.database(id);
  }

  /**
   * Return the Mongo Collection.
   *
   * @param database The Mongo Database.
   * @param collection The Collection Identifier.
   */
  public getCollection<IModel extends Model>(
    database: AllowedDatabase,
    collection: AllowedCollection,
  ): Collection<IModel> {
    return this.getDatabase(database).collection<IModel>(collection);
  }
}

/**
 * Mongo Connection and Schema Manager Class.
 */
export class ConnectManager {
  private static connect: Map<string, ConnectClient> = new Map();
  private static schema: Map<
    typeof Schema<Model, ConnectOptions>,
    Schema<Model, ConnectOptions>
  > = new Map();

  /**
   * Return the ConnectClient based on the unique identifier and connection parameters.
   *
   * Used by getSchema()
   *
   * @param id The unique identifier of the client connection.
   * @param connectString The connection string for the database.
   */
  public static async getConnectClient(
    id?: string | "default",
    connectString?: string,
  ): Promise<ConnectClient> {
    // Set Default
    id = id ?? "default";

    // Create and establish the ConnectClient for 'id' if 'this.connect' does not have an index.
    if (!this.connect.has(id)) {
      if (connectString === undefined) {
        throw new Error(
          'Attempted to access an unknown identifier without "connectString".',
        );
      }
      this.connect.set(id, await new ConnectClient().initialize(connectString));
    }

    // Established connection for 'id'.
    return this.connect.get(id)!;
  }

  /**
   * Return the Schema based on the class reference and the connection identifier.
   *
   * @param schema The schema class identifier. ISchema must extend a Base Schema.
   * @param options The ConnectOptions used to identify and create the Mongo Database Connection.
   */
  public static async getSchema<ISchema extends Schema<Model, ConnectOptions>>(
    schema: new (options: ConnectOptions, _ifx: string) => ISchema,
    options: ConnectOptions | null,
  ): Promise<ISchema> {
    const instance = schema as unknown as new (
      options: ConnectOptions,
      _?: string,
    ) => ISchema;
    if (!this.schema.has(instance)) {
      if (options === null) {
        throw new Error(
          "Failed to generate Schema. ConnectOptions must be specified during first use.",
        );
      }
      const inst = new instance(options, "_IFX_AUTO_INIT");
      await inst._initialize();
      this.schema.set(instance, inst);
    }

    return this.schema.get(instance)! as ISchema;
  }
}

/** Abstract Representation of the Database Schema for Object Models. */
export abstract class Schema<
  IModel extends Model,
  IOptions extends ConnectOptions,
> {
  public options: IOptions;
  public connect: ConnectClient | null = null;
  public collection: Collection<IModel> | null = null;
  public abstract collectionId: AllowedCollection;
  public abstract connectionId: AllowedConnection;

  /**
   * DO NOT USE DIRECTLY. PLEASE USE ConnectManager.getSchema()
   *
   * @param options DO NOT USE
   * @param _ifx DO NOT USE
   */
  public constructor(options: IOptions, _ifx: string) {
    if (_ifx !== "_IFX_AUTO_INIT") {
      throw new Error("This class should not be initialized manually.");
    }
    this.options = options;
  }

  /** Abstract Function for Arbitrary Intiailization Code. */
  public abstract initialize(): Promise<void>;

  /** Initialize the Underlying Connection. */
  public async _initialize(): Promise<void> {
    this.connect = await ConnectManager.getConnectClient(
      this.connectionId,
      this.options.connection,
    );
    this.collection = this.connect.getCollection<IModel>(
      this.options.database,
      this.collectionId,
    );

    // Chain Initialization
    await this.initialize();
  }

  /** Access:Get */
  public async get(filter: Filter<IModel>): Promise<IModel | null> {
    return (await this.collection!.findOne(filter)) ?? null;
  }

  /** Access:Exists */
  public async has(filter: Filter<IModel>): Promise<boolean> {
    return(await this.collection!.countDocuments(filter, {
      limit: 1,
    }) === 1);
  }

  /** Access:Insert */
  protected async add(model: IModel): Promise<ObjectId> {
    return (await this.collection!.insertOne(model))!;
  }

  /** Access:Update */
  protected async update(
    filter: Filter<IModel>,
    update: UpdateFilter<IModel>,
  ): Promise<void> {
    await this.collection!.updateOne(filter, update);
  }

  /** Access:Delete */
  protected async delete(objectId: ObjectId): Promise<void> {
    await this.collection!.deleteOne({
      _id: objectId,
    });
  }
}

/** BaseModel for Schema with Required Fields. */
export interface Model {
  _id?: ObjectId;
  /** createdAt - Default - Required> */
  createdAt: Date;
  /** lastUpdatedAt - Default - Optional */
  lastUpdatedAt?: Date;
}

/** ConnectOptions Identifying Information and Connection String. */
export interface ConnectOptions {
  server: string;
  connection: string;
  database: AllowedDatabase;
}

export type AllowedDatabase =
  | 'amethyst-dev'
  | 'amethyst';
export type AllowedConnection =
  | 'base'
  | 'command'
  | 'schema'
  | 'trace';
export type AllowedCollection =
  // Secure Tables
  | 'session'
  | 'trace'
  // Authentication Tables
  | 'user'
  | 'role'
  | 'attribute';
