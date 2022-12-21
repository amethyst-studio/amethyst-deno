import { AuthContext } from "https://deno.land/x/mongo@v0.31.1/src/auth/base.ts";
import { ConnectManager } from "../../../../../common/database/connect.ts";
import { UserSchema } from "../../../../../common/database/model/user.model.ts";
import { cryptoRandomString, Drash } from "../../../../../common/deps.ts";
import { OAuth2ClientManager, OAuth2GoogleProfile } from "../../../../../common/oauth/getOAuthClient.ts";
import { AuthenticationService } from "../../../../../common/providers/services/authentication.service.ts";
import {
  SessionedRequest,
  SessionService,
} from "../../../../../common/providers/services/session.service.ts";
import { StatusCode, StatusCodeNumeric, StatusMessage } from "../../../../../common/util/statusCode.ts";
import { googleClient } from "../../../../config.ts";

// Shared State
const client = OAuth2ClientManager.getClient('google', googleClient);

export class GoogleConnectResource extends Drash.Resource {
  public override paths = [
    "/auth/flow/google-connect",
  ];

  public override services: Record<string, Drash.Service[]> = {
    ALL: [
      new SessionService(),
    ],
  };
  
  // Schema
  private user: UserSchema | null = null;

  public async GET(
    request: Drash.Request & SessionedRequest,
    response: Drash.Response,
  ): Promise<void> {
    // Check for the CodeVerifier Data.
    const codeVerifier = request.session?.['codeVerifier'];
    if (typeof codeVerifier !== 'string') {
      return response.json({
        status: StatusCodeNumeric[StatusCode.BadRequest],
        description: StatusMessage[StatusCode.BadRequest],
        message: 'Unable to reference codeVerifier. Cookies are required for OAuth2, or you attempted to access this resource directly.',
        error: true,
      }, StatusCodeNumeric[StatusCode.BadRequest]);
    }

    // Exchange the Authorization Code for Access Token.
    const tokens = await client.code.getToken(request.url, {
      codeVerifier,
    });
    request.session!['codeVerifier'] = null;
    await SessionService.persist(request.session);

    // Request the User Data for Authentication. Access account or create user.
    const fetchProfile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo?alt=json', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      }
    });
    const profile = await fetchProfile.json() as OAuth2GoogleProfile;

    // Verify Email
    if (profile.verified_email === false) {
      return response.json({
        status: StatusCodeNumeric[StatusCode.BadRequest],
        description: StatusMessage[StatusCode.BadRequest],
        message: 'Unable to utilize identity. Please verify your email with this provider.',
        error: true,
      }, StatusCodeNumeric[StatusCode.BadRequest]);
    }

    // Set Schema for Utilization.
    this.user = this.user ?? await ConnectManager.getSchema(UserSchema, null);

    // Pull User from Database.
    let user = await this.user.getUserByIdentifier(profile.email);
    
    // Create User if Not Found.
    if (user === null) {
      user = {
        uid: '',
        authorization: '',
        email: profile.email,
        emailVerified: profile.verified_email,
        emailDeliverable: true,
        firstName: profile.given_name,
        lastName: profile.family_name,
        dateOfBirth: '00-00-0000',
        createdAt: new Date(),
      }
      
      // Ensure Unique User Identifier.
      while (user.uid === '' || await this.user.has({
        uid: user.uid,
      })) {
        user.uid = crypto.randomUUID();
      }

      // Ensure Unique Authorization Token.
      while (user.authorization === '' || await this.user.has({
        authorization: user.authorization,
      })) {
        user.authorization = cryptoRandomString({
          length: 255,
          type: 'url-safe',
        });
      }

      // Create the User Record.
      const oid = await this.user.createUser(user).catch((e) => {
        // TODO: Trace to Handle Error
        return null;
      });
      if (oid === null) {
        return response.json({
          status: StatusCodeNumeric[StatusCode.InternalServerError],
          description: StatusMessage[StatusCode.InternalServerError],
          message: 'Unable to register profile. Please try again and contact support if this issue persists.',
          error: true,
        }, StatusCodeNumeric[StatusCode.InternalServerError]);
      }
    }

    // Add/Update Google User Identifier to New or Existing User Record.
    if (user.googleUserId === undefined) {
      await this.user.updateUser(user.uid, {
        $set: {
          googleUserId: profile.id,
        }
      })
    }

    // Set the UID to Server Session for Authenticated Session.
    request.session!['uid'] = user.uid;
    await SessionService.persist(request.session);

    // Resolve User Data.
    return response.json({
      status: StatusCodeNumeric[StatusCode.OK],
      description: StatusMessage[StatusCode.OK],
      message: 'Authentication Successful.',
      error: false,
      user,
    }, StatusCodeNumeric[StatusCode.OK]);
  }
}
