import { Drash } from "../../../common/deps.ts";
import { AuthenticationService } from "../../../common/providers/services/authentication.service.ts";
import {
  SessionedRequest,
  SessionService,
} from "../../../common/providers/services/session.service.ts";

export class TestResource extends Drash.Resource {
  public override paths = [
    "/test",
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
      id: "X-GET",
      sess: request.session,
    });
  }
}
