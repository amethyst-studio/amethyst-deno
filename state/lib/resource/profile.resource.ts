import { Drash } from "../../../common/deps.ts";
import { AuthenticationService } from "../../../common/providers/services/authentication.service.ts";
import {
  SessionedRequest,
  SessionService,
} from "../../../common/providers/services/session.service.ts";

export class ProfileResource extends Drash.Resource {
  public override paths = [
    "/profile",
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
    request.session!["user"] = "0";
    await SessionService.persist(request.session);
    return response.json({
      id: "X-GET",
    });
  }

  public PATCH(request: Drash.Request, response: Drash.Response): void {
    return response.json({
      id: "X-PATCH",
    });
  }
}
