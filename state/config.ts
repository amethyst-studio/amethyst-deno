import { ConnectOptions } from "../common/database/connect.ts";

export const connect: ConnectOptions = {
  server: "dev-1.srv.amethyst.live",
  database: "amethyst-dev",
  connection:
    "mongodb://root:xxx@xxx:27017/?authSource=admin&readPreference=primary&ssl=false&directConnection=true",
};
