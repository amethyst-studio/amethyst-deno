import { Drash } from "../../../common/deps.ts";
import { AuthenticationService } from "../../../common/providers/server/services/authentication.service.ts";
import { SessionedRequest, SessionService } from "../../../common/providers/server/services/session.service.ts";

export class ProfileResource extends Drash.Resource {
  public override paths = [
    "/profile",
  ];

  public override services: Record<string, Drash.Service[]> = {
    ALL: [
      new SessionService(),
      new AuthenticationService()
    ],
  };

  public async GET(request: Drash.Request & SessionedRequest, response: Drash.Response): Promise<void> {
    console.info('session', request.session)
    request.session!['user'] = '0';
    await request.writeSession(request);
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
