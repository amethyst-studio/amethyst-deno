import { Trace } from "../common/database/model/trace.model.ts";
import {
  HTTPServer,
  ResourceLoaderService,
} from "../common/providers/server.ts";
import { connect } from "./config.ts";

async function init(): Promise<void> {
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
  await Trace.sendStatus({
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
