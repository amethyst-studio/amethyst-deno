import { Session, SessionModel } from "../../../database/model/session.model.ts";
import { Drash } from "../../../deps.ts";

export class SessionService extends Drash.Service {
  public override async runBeforeResource(request: Drash.Request & SessionedRequest, response: Drash.Response): Promise<void> {
    const sid = request.getCookie('sid');
    const vid = request.getCookie('vid')

    if (sid && vid && await Session.getSession(sid, vid) !== null) {
      request.session = await Session.getSession(sid, vid);
    } else {
      request.session = await Session.createSession();
      response.setCookie({
        name: 'sid',
        value: request.session['sid'] as string,
        secure: request.url.includes('https') ? true : false,
        path: '/',
      });
      response.setCookie({
        name: 'vid',
        value: request.session['vid'] as string,
        secure: request.url.includes('https') ? true : false,
        path: '/',
      });
    }

    request.writeSession = async (request: Drash.Request & Partial<SessionedRequest>) => {
      if (request.session !== null) {
        await Session.updateSession(request.session!.sid, {
          $set: {
            ...request.session,
          }
        });
      }
    }
  }
}

export interface SessionedRequest {
  session: SessionModel | null;
  writeSession: (request: Drash.Request & SessionedRequest) => Promise<void>;
}