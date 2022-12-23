import { Drash, OAuth2Client } from "../../../../../common/deps.ts";
import { OAuth2ClientManager } from "../../../../../common/oauth/getOAuthClient.ts";
import {
  SessionedRequest,
  SessionService,
} from "../../../../../common/providers/services/session.service.ts";
import { googleClient } from "../../../../config.ts";

const client = OAuth2ClientManager.getClient('google', googleClient);

export class GoogleResource extends Drash.Resource {
  public override paths = [
    "/auth/flow/google",
  ];

  public override services: Record<string, Drash.Service[]> = {
    ALL: [
      new SessionService(true),
    ],
  };

  public async GET(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    // Parse State Information.
    const { uri, codeVerifier } = await client.code.getAuthorizationUri();

    
    // Update Session Data.
    request.session!["codeVerifier"] = codeVerifier;
    request.session!['returnTo'] = request.session!['returnTo'] ?? request.headers.get('Forward-Request-To') ?? null;
    await SessionService.persist(request.session);
    console.info(request.session, request.headers.values())

    // Redirect to Google Workflow.
    return this.redirect(uri.toString(), response);
  }
}
