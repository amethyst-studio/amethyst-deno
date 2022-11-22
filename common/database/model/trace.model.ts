import { Collection } from "../../deps.ts";
import { AllowedDatabase, AllowedTable, ConnectOptions, Schema, SimpleConnect } from '../connect.ts';

export class Trace extends SimpleConnect {
  private static options: TraceOptions;
  private static collection: Collection<TraceModel>;

  private static constant = {
    retentionPeriod: 14400,
  };

  public static async sendStatus(event: TraceEvent): Promise<void> {
    event.context = event.context ?? {};
    event.context['_EVENT_TYPE'] = 'STATUS_EVENT';
    const createdAt = new Date();
    await this.collection!.insertOne({ ...event, server: this.options.server, createdAt });
    console.info(`[${this.options.server}] (${event.service}) <${createdAt}> - ${event.action} - ${event.status}\n${JSON.stringify(event.context, null)}`);
  }

  public static async sendError(event: TraceEvent): Promise<void> {
    event.context = event.context ?? {};
    event.context['_EVENT_TYPE'] = 'ERROR_STATUS';
    const createdAt = new Date();
    await this.collection!.insertOne({ ...event, server: this.options.server, createdAt });
    console.info(`[${this.options.server}] (${event.service}) <${createdAt}> - ${event.action} - ${event.status}\n${JSON.stringify(event.context, null)}`);
  }

  public static async initialize(options: TraceOptions): Promise<void> {
    this.options = options;
    this.collection = (await this.get('model_reuse', this.options.connection)).getCollection<AllowedDatabase, AllowedTable, TraceModel>(this.options.database, 'trace');

    // Setup Data Retention Indices
    await this.collection!.createIndexes({
      indexes: [
        {
          key: {
            'createdAt': 1,
          },
          name: 'expire_record',
          expireAfterSeconds: this.constant.retentionPeriod,
        },
      ],
    }).catch((e: Error) => {
      console.warn('Warning! Failed to set the retention period index! Was our period updated? Did it update successfully?');
      console.warn(e);
    });
    await (await this.get('model_reuse')).getConnection().runCommand(this.options!.database, {
      'collMod': 'trace' as AllowedTable,
      'index': {
        'keyPattern': {
          'createdAt': 1,
        },
        expireAfterSeconds: this.constant.retentionPeriod,
      },
    }).catch((e: Error) => {
      console.warn('Warning! Failed to set the retention period index update! Please investigate.');
      console.warn(e);
    });
  }
}

export interface TraceModel extends Schema {
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
  | '100 Continue'
  | '102 Processing'
  | '200 OK'
  | '201 Created'
  | '202 Accepted'
  | '204 No Content'
  | '206 Partial Content'
  | '208 Already Reported'
  | '302 Found'
  | '303 See Other'
  | '304 Not Modified'
  | '400 Bad Request'
  | '401 Unauthorized'
  | '403 Forbidden'
  | '404 Not Found'
  | '405 Method Not Allowed'
  | '406 Not Acceptable'
  | '408 Request Timeout'
  | '409 Conflict'
  | '410 Gone'
  | '422 Unprocessable Content'
  | '423 Locked'
  | '425 Too Early'
  | '429 Too Many Requests'
  | '451 Unavailable For Legal Reasons'
  | '500 Internal Server Error'
  | '501 Not Implemented'
  | '502 Bad Gateway'
  | '503 Service Unavailable'
  | '504 Gateway Timeout'
  | '507 Insufficient Storage'
  | '511 Network Authentication Required';

export type TraceAction =
  | 'INITIALIZATION'
  | 'MESSAGE'
  | 'WARNING'
  | 'ERROR'
  | 'CRITICAL';
