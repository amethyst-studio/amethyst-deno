import {
  AllowedCollection,
  AllowedConnection,
  ConnectOptions,
  Model,
  Schema,
} from "../connect.ts";

export class TraceSchema extends Schema<TraceModel, TraceOptions> {
  public collectionId: AllowedCollection = "trace";
  public connectionId: AllowedConnection = "schema";

  private constants = {
    retentionPeriod: 14400,
  };

  public async initialize(): Promise<void> {
    await this.collection!.createIndexes({
      indexes: [
        {
          key: {
            createdAt: 1,
          },
          name: `expire_${this.collectionId}`,
          expireAfterSeconds: this.constants.retentionPeriod,
        },
      ],
    }).catch((e: Error) => {
      console.error(
        `Failed to set the "${this.collectionId}" indices.`,
        e.message,
      );
    });
    await this.connect?.getConnection().runCommand(this.options.database, {
      "collMod": this.collectionId,
      "index": {
        keyPattern: {
          createdAt: 1,
        },
        expireAfterSeconds: this.constants.retentionPeriod,
      },
    }).catch((e: Error) => {
      console.error(
        `Failed to update the "${this.collectionId}" indices.`,
        e.message,
      );
    });
  }

  public async send(event: TraceEvent): Promise<void> {
    event.context = event.context ?? {};
    const createdAt = new Date();
    await this.add({ ...event, server: this.options.server, createdAt });
    console.info(
      `[${this.options.server}] (${event.service}) <${createdAt}> - ${event.action} - ${event.status}\n${
        JSON.stringify(event.context, null)
      }`,
    );
  }
}

/** TraceModel */
export interface TraceModel extends Model {
  server: string;
  service: string;
  status: TraceStatus;
  action: TraceAction;
  context?: Record<string, unknown>;
}

/** TraceOptions */
export interface TraceOptions extends ConnectOptions {
  server: string;
}

/** TraceEvent */
export interface TraceEvent {
  service: string;
  status: TraceStatus;
  action: TraceAction;
  context?: Record<string, unknown>;
}

/** TraceStatus */
export type TraceStatus =
  | "100 Continue"
  | "102 Processing"
  | "200 OK"
  | "201 Created"
  | "202 Accepted"
  | "204 No Content"
  | "206 Partial Content"
  | "208 Already Reported"
  | "302 Found"
  | "303 See Other"
  | "304 Not Modified"
  | "400 Bad Request"
  | "401 Unauthorized"
  | "403 Forbidden"
  | "404 Not Found"
  | "405 Method Not Allowed"
  | "406 Not Acceptable"
  | "408 Request Timeout"
  | "409 Conflict"
  | "410 Gone"
  | "422 Unprocessable Content"
  | "423 Locked"
  | "425 Too Early"
  | "429 Too Many Requests"
  | "451 Unavailable For Legal Reasons"
  | "500 Internal Server Error"
  | "501 Not Implemented"
  | "502 Bad Gateway"
  | "503 Service Unavailable"
  | "504 Gateway Timeout"
  | "507 Insufficient Storage"
  | "511 Network Authentication Required";

/** TraceAction */
export type TraceAction =
  | "INITIALIZATION"
  | "MESSAGE"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";
