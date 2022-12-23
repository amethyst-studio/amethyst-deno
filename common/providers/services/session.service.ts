import { ConnectManager, ConnectOptions } from "../../database/connect.ts";
import {
  SessionModel,
  SessionSchema,
} from "../../database/model/session.model.ts";
import { UserModel } from "../../database/model/user.model.ts";
import { Drash } from "../../deps.ts";

let staticOptions: ConnectOptions | null = null;

export class SessionService extends Drash.Service {
  private static session: SessionSchema | null = null;
  private create = true;

  public constructor(create: boolean = true) {
    super();
    this.create = create;
  }

  public static initialize(options: ConnectOptions): void {
    staticOptions = options;
  }

  public override async runBeforeResource(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    const sid = request.getCookie("sid");
    const vid = request.getCookie("vid");

    if (sid === undefined || vid === undefined) {
      if (this.create) {
        await this.build(request, response);
      } else {
        request.session = null;
        return;
      }
    }

    await SessionService.ensureServiceAccess();
    const session = await SessionService.session!.getSession(sid, vid);
    if (session !== null) {
      request.session = session;
    } else {
      if (this.create) {
        await this.build(request, response);
      } else {
        request.session = null;
        return;
      }
    }
  }

  private async build(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    await SessionService.ensureServiceAccess();
    request.session = await SessionService.session!.createSession();
    response.setCookie({
      name: "sid",
      value: request.session["sid"] as string,
      secure: request.url.includes("https") ? true : false,
      path: "/",
    });
    response.setCookie({
      name: "vid",
      value: request.session["vid"] as string,
      secure: request.url.includes("https") ? true : false,
      path: "/",
    });
  }

  public static async persist(
    session: SessionModel | null,
  ): Promise<void> {
    await SessionService.ensureServiceAccess();
    if (session !== null) {
      await SessionService.session!.updateSession(session!.sid, {
        $set: session,
      });
    }
  }

  private static async ensureServiceAccess(): Promise<void> {
    if (SessionService.session === null) {
      SessionService.session = await ConnectManager.getSchema(
        SessionSchema,
        staticOptions!,
      );
    }
  }
}

export interface SessionedRequest {
  session: SessionModel | null;
  user: UserModel | null;
}
