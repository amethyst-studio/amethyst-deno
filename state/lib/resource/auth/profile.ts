import { Drash } from "../../../../common/deps.ts";
import { AuthenticationService } from "../../../../common/providers/services/authentication.service.ts";
import {
  SessionedRequest,
  SessionService,
} from "../../../../common/providers/services/session.service.ts";

export class ProfileResource extends Drash.Resource {
  public override paths = [
    "/auth/profile",
  ];

  public override services: Record<string, Drash.Service[]> = {
    ALL: [
      new SessionService(),
      new AuthenticationService(),
    ],
  };

  public async GET(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    return response.json({
      session: request.session,
    });
  }

  public PATCH(request: Drash.Request, response: Drash.Response): void {
    return response.json({
      id: "X-PATCH",
    });
  }
}
