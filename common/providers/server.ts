import { ConnectOptions } from '../database/connect.ts';
import { Session } from '../database/model/session.model.ts';
import { Trace } from '../database/model/trace.model.ts';
import { User } from '../database/model/user.model.ts';
import { Drash, ResourceLoaderService } from '../deps.ts';

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
    // Initalize Trace Clients
    await Trace.initialize(this.options.service.connect);

    // Initialize Model Clients
    await Session.initialize(this.options.service.connect);
    await User.initialize(this.options.service.connect);

    // ---
    const uid = await User.createUser({
      email: `${crypto.randomUUID()}@example.com`,
      emailDeliverable: false,
      emailVerified: false,
      firstName: 'Example',
      lastName: 'User',
      dateOfBirth: '02/29/2000',
      role: [],
      attribute: [],
    });
    const userCreated = await User.getUser(uid);
    console.info('created', userCreated);

    await Trace.sendStatus({
      service: this.options.id,
      status: '100 Continue',
      action: 'MESSAGE',
      context: {
        message: 'Initializing HTTP Service',
      },
    });
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
  jwk: JsonWebKey;
}

export { ResourceLoaderService };
