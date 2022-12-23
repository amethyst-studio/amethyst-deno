import { ConnectManager, ConnectOptions } from "../database/connect.ts";
import { SessionSchema } from "../database/model/session.model.ts";
// import { Session } from '../database/model/session.model.ts';
import { TraceSchema } from "../database/model/trace.model.ts";
import { UserSchema } from "../database/model/user.model.ts";
// import { User } from '../database/model/user.model.ts';
import { Drash, ResourceLoaderService } from "../deps.ts";
import { SessionService } from "./services/session.service.ts";

export class HTTPServer {
  private options: HTTPServerOptions;
  private server: Drash.Server;

  public constructor(options: HTTPServerOptions) {
    this.options = options;
    this.options.server.services = this.options.server.services ?? [];
    this.options.server.services.push(this.options.resourceLoader);
    this.server = new Drash.Server(this.options.server);
  }

  private async initialize(): Promise<void> {
    // Initialize Schema Clients.
    await ConnectManager.getSchema(TraceSchema, this.options.service.connect);
    await ConnectManager.getSchema(SessionSchema, this.options.service.connect);
    await ConnectManager.getSchema(UserSchema, this.options.service.connect);

    // Initialize Trace Client.
    const trace = await ConnectManager.getSchema(
      TraceSchema,
      this.options.service.connect,
    );

    // Notification
    await trace.send({
      service: this.options.id,
      status: "100 Continue",
      action: "MESSAGE",
      context: {
        message: "Initializing HTTP Service",
      },
    });

    // Initialize Services
    await SessionService.initialize(this.options.service.connect);
  }

  public async start(): Promise<void> {
    await this.initialize();
    this.server.run();
  }
}

/** HTTPServerOptions */
export interface HTTPServerOptions {
  id: string;
  server: Drash.Interfaces.IServerOptions;
  resourceLoader: ResourceLoaderService;
  service: {
    connect: ConnectOptions;
  };
}

export { ResourceLoaderService };
