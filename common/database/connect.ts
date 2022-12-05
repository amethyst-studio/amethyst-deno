import { Collection, Database, Filter, MongoClient, ObjectId, UpdateFilter } from '../deps.ts';

export class ConnectClient {
  private connection = new MongoClient();

  public async initialize(connect: string): Promise<ConnectClient> {
    await this.connection.connect(connect);
    return this;
  }

  public getConnection(): MongoClient {
    return this.connection;
  }

  public getDatabase(id: AllowedDatabase): Database {
    return this.connection.database(id);
  }

  public getCollection<IModel extends Model>(
    database: AllowedDatabase,
    collection: AllowedCollection,
  ): Collection<IModel> {
    return this.getDatabase(database).collection<IModel>(collection);
  }
}

export class ConnectManager {
  private static connect: Map<string, ConnectClient> = new Map();
  private static schema: Map<
    typeof Schema<Model, ConnectOptions>,
    Schema<Model, ConnectOptions>
  > = new Map();

  public static async getConnectClient(
    id?: string | 'default',
    connectString?: string,
  ): Promise<ConnectClient> {
    // Set Default
    id = id ?? 'default';

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

  public static async getSchema<ISchema extends Schema<Model, ConnectOptions>>(
    schema: new (options: ConnectOptions, _ifx: string) => ISchema,
    options: ConnectOptions | null,
  ): Promise<ISchema> {
    const instance = schema as unknown as new (options: ConnectOptions, _?: string) => ISchema;
    if (!this.schema.has(instance)) {
      if (options === null) throw new Error('Failed to generate Schema. ConnectOptions must be specified during first use.')
      const inst = new instance(options, '_IFX_AUTO_INIT');
      await inst._initialize();
      this.schema.set(instance, inst);
    }

    return this.schema.get(instance)! as ISchema;
  }
}

export abstract class Schema<
  IModel extends Model,
  IOptions extends ConnectOptions,
> {
  public options: IOptions;
  public connect: ConnectClient | null = null;
  public collection: Collection<IModel> | null = null;
  public abstract collectionId: AllowedCollection;
  public abstract connectionId: AllowedConnection;

  public constructor(options: IOptions, _ifx: string) {
    if (_ifx !== '_IFX_AUTO_INIT') {
      throw new Error('This class should not be initialized manually.');
    }
    this.options = options;
  }

  public abstract initialize(): Promise<void>;
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

  protected async get(filter: Filter<IModel>): Promise<IModel | null> {
    return (await this.collection!.findOne(filter)) ?? null;
  }

  protected async add(model: IModel): Promise<ObjectId> {
    return (await this.collection!.insertOne(model))!;
  }

  protected async update(
    filter: Filter<IModel>,
    update: UpdateFilter<IModel>,
  ): Promise<void> {
    await this.collection!.updateOne(filter, update);
  }

  protected async delete(objectId: ObjectId): Promise<void> {
    await this.collection!.deleteOne({
      _id: objectId,
    });
  }
}

export interface Model {
  _id?: ObjectId;
  /** createdAt - Default - Required> */
  createdAt: Date;
  /** lastUpdatedAt - Default - Optional */
  lastUpdatedAt?: Date;
}

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
