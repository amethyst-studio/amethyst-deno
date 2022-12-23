import { cryptoRandomString, UpdateFilter } from "../../deps.ts";
import {
  AllowedCollection,
  AllowedConnection,
  ConnectManager,
  ConnectOptions,
  Model,
  Schema,
} from "../connect.ts";
import { TraceSchema } from "./trace.model.ts";

export class SessionSchema extends Schema<SessionModel, ConnectOptions> {
  public collectionId: AllowedCollection = "session";
  public connectionId: AllowedConnection = "schema";

  private trace: TraceSchema | null = null;

  private constants = {
    retentionPeriod: 86400,
  };

  public async initialize(): Promise<void> {
    this.trace = await ConnectManager.getSchema(TraceSchema, null);

    await this.collection!.createIndexes({
      indexes: [
        {
          key: {
            sid: 1,
          },
          name: `data_sid_${this.collectionId}`,
          unique: true,
        },
        {
          key: {
            lastAccessedAt: 1,
          },
          name: `expire_${this.collectionId}`,
          expireAfterSeconds: this.constants.retentionPeriod,
        },
      ],
    }).catch((e: Error) => {
      this.trace!.send({
        service: "session-model",
        status: "500 Internal Server Error",
        action: "MESSAGE",
        context: {
          message: `Failed to set the "${this.collectionId}" indices.`,
          error: e.message,
        },
      });
    });

    await this.connect?.getConnection().runCommand(this.options.database, {
      "collMod": this.collectionId,
      index: {
        keyPattern: {
          lastAccessedAt: 1,
        },
        expireAfterSeconds: this.constants.retentionPeriod,
      },
    }).catch((e: Error) => {
      this.trace!.send({
        service: "session-model",
        status: "500 Internal Server Error",
        action: "MESSAGE",
        context: {
          message: `Failed to update the "${this.collectionId}" indices.`,
          error: e.message,
        },
      });
    });
  }

  public async createSession(): Promise<SessionModel> {
    const session: SessionModel = {
      sid: crypto.randomUUID(),
      vid: cryptoRandomString({
        length: 256,
        type: "url-safe",
      }),
      createdAt: new Date(),
    };
    await this.add(session);
    return session;
  }

  public async getSession(
    sid: string,
    vid: string,
  ): Promise<SessionModel | null> {
    const session = await this.get({
      sid: {
        $eq: sid,
      },
      vid: {
        $eq: vid,
      },
    });

    if (session !== null) {
      this.update({
        sid: {
          $eq: sid,
        },
      }, {
        $set: {
          lastAccessedAt: new Date(),
        },
      }).catch((e: Error) => {
        this.trace!.send({
          service: "session-model",
          status: "500 Internal Server Error",
          action: "MESSAGE",
          context: {
            message: `Unable to update "lastAccessedAt" for session "${sid}".`,
            error: e.message,
          },
        });
      });
    }

    return session;
  }

  public async updateSession(
    sid: string,
    update: UpdateFilter<SessionModel>,
  ): Promise<void> {
    update.$set = update.$set ?? {};
    update.$set.lastUpdatedAt = new Date();
    await this.update({
      sid: {
        $eq: sid,
      },
    }, update);
  }
}

export interface SessionModel extends Model {
  sid: string;
  vid: string;
  lastAccessedAt?: Date;
  [key: string]: string | unknown;
}
