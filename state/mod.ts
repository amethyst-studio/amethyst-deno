import { ConnectManager } from "../common/database/connect.ts";
import { TraceSchema } from "../common/database/model/trace.model.ts";
import {
  HTTPServer,
  ResourceLoaderService,
} from "../common/providers/server.ts";
import { connect } from "./config.ts";

async function init(): Promise<void> {
  // Get TraceSchema.
  const trace = await ConnectManager.getSchema(TraceSchema, connect);

  // Initialize the HTTP Server.
  const server = new HTTPServer({
    id: connect.server,
    server: {
      hostname: "localhost",
      port: 14242,
      protocol: "http",
    },
    resourceLoader: new ResourceLoaderService({
      paths_to_resources: [
        "./lib/resource",
      ],
    }),
    service: {
      connect,
    },
  });
  await server.start();

  // Notify Initialization
  await trace.send({
    service: connect.server,
    status: "100 Continue",
    action: "INITIALIZATION",
    context: {
      message: "Server is Online",
    },
  });
}

await init()
  .catch((e: Error) => {
    console.error(e);
  });
