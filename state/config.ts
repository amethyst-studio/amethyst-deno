import { ConnectOptions } from "../common/database/connect.ts";
import { OAuth2ClientConfig } from "../common/deps.ts";

export const connect: ConnectOptions = {
  server: "dev-1.srv.amethyst.live",
  database: "amethyst-dev",
  connection:
    "mongodb://root:@datasrv.amethyst.live:27017/?authSource=admin&readPreference=primary&ssl=false&directConnection=true",
};

export const googleClient: OAuth2ClientConfig = {
  clientId:
    "316595577511-64tns80n2kc1qt1qmumme7vlenak5vgp.apps.googleusercontent.com",
  clientSecret: "",
  authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUri: "https://www.googleapis.com/oauth2/v4/token",
  redirectUri: "http://localhost:14242/auth/flow/google-connect",
  defaults: {
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
  },
};
