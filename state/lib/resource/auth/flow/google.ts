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
      new SessionService(),
    ],
  };

  public async GET(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    // Parse State Information.
    const { uri, codeVerifier } = await client.code.getAuthorizationUri();
    const returnTo = await request.headers.get('ReturnTo');

    // Update Session Data.
    request.session!["codeVerifier"] = codeVerifier;
    request.session!['returnTo'] = returnTo;
    await SessionService.persist(request.session);

    // Redirect to Google Workflow.
    return this.redirect(uri.toString(), response);
  }
}
