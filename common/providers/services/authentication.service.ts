import { ConnectManager } from "../../database/connect.ts";
import { UserModel, UserSchema } from "../../database/model/user.model.ts";
import { Drash } from "../../deps.ts";
import { SessionedRequest, SessionService } from "./session.service.ts";

export class AuthenticationService extends Drash.Service {
  private allowSession = true;
  private allowToken = true;
  private require = true;

  // Schema
  private user: UserSchema | null = null;

  public constructor(
    allowSession: boolean = true,
    allowToken: boolean = true,
    require: boolean = true,
  ) {
    super();
    this.allowSession = allowSession;
    this.allowToken = allowToken;
    this.require = require;
  }

  public override async runBeforeResource(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    request.user = null;

    if (this.allowSession) {
      if (request.session === null || request.session!['uid'] === undefined) {
        // Build the Redirect.
        // TODO: REDIRECT_LOGIN_PROMPT
        response.headers.set("Location", "/auth/flow/google");
        response.headers.set("Forward-Request-To", request.url);
        response.status = 302;
        return request.end();        
      }

      // Set User Schema and Search.
      this.user = this.user ?? await ConnectManager.getSchema(UserSchema, null);
      request.user = await this.user.getUserByIdentifier(
        request.session!["uid"] as string,
      );
    }
    
    if (this.allowToken && request.user === null) {
      // Build the UID and Token.
      const authorization = request.headers.get("Authorization") ?? "0:0";
      const [uid, token] = authorization.split(":");

      if (uid !== undefined && token !== undefined) {
        this.user = this.user ?? await ConnectManager.getSchema(UserSchema, null);
        const search = await this.user.getUserByIdentifier(
          uid,
        );
        if (search?.token === token) request.user = search;
      }
    }

    if (this.require && request.user === null) {
      response.json({
        b: 'ERR_NO_USR_FOUND_SESS_TKN'
        // TODO: ERR_AUTH_FAILED
      });
      return request.end();
    }
  }
}
