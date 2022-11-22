import { Collection, cryptoRandomString, UpdateFilter } from "../../deps.ts";
import { AllowedDatabase, AllowedTable, ConnectOptions, Schema, SimpleConnect } from '../connect.ts';

export class Session extends SimpleConnect {
  private static options: SessionOptions;
  private static collection: Collection<SessionModel>;

  public static async createSession(): Promise<SessionModel> {
    const session: SessionModel = {
      sid: crypto.randomUUID(),
      vid: cryptoRandomString({
        length: 128,
        type: 'url-safe',
      }),
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    }

    // Store the Session.
    await this.collection!.insertOne(session);

    // Return the Session.
    return session;
  }

  public static async getSession(identifier: string, vref: string): Promise<SessionModel | null> {
    // Attempt to Update Last Accessed Date for SessionModel.
    await this.updateSession(identifier, {
      $set: {
        'lastAccessedAt': new Date(),
      }
    }).catch(() => {});

    // Get and Validate the SessionModel.
    const session = await this.collection!.findOne({
      sid: {
        $eq: identifier,
      },
      vid: {
        $eq: vref,
      }
    }) ?? null;

    // Return the SessionModel.
    return session;
  }

  public static async updateSession(identifier: string, session: UpdateFilter<SessionModel>): Promise<void> {
    await this.collection.updateOne({
      sid: {
        $eq: identifier,
      },
    }, session);
  }

  public static async initialize(options: SessionOptions): Promise<void> {
    this.options = options
    this.collection = (await this.get('model_reuse', this.options.connection)).getCollection<AllowedDatabase, AllowedTable, SessionModel>(this.options.database, 'session');

    // Setup Data Indices
    await this.collection!.createIndexes({
      indexes: [
        {
          key: {
            'sid': 1,
          },
          name: 'session_data',
          unique: true,
        },
      ],
    });
  }
}

export interface SessionOptions extends ConnectOptions {
}

export interface SessionModel extends Schema {
  sid: string;
  vid: string;
  lastAccessedAt: Date;
  _flash?: Record<string, unknown>;
  [key: string]: unknown;
}
