import { Drash } from '../../deps.ts';

export class AuthenticationService extends Drash.Service {
  private requireSession = false;

  public constructor(requireSession: boolean = false) {
    super();
    this.requireSession = requireSession;
  }

  public override runBeforeResource(
    request: Drash.Request,
    response: Drash.Response,
  ): void {
    console.info('x', this.requireSession);
  }
}
