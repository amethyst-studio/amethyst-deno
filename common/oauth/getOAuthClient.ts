import { OAuth2Client, OAuth2ClientConfig } from "../deps.ts";

export class OAuth2ClientManager {
  private static readonly clients = new Map<string, OAuth2Client>();

  public static getClient(id: string, options: OAuth2ClientConfig): OAuth2Client {
    if (!this.clients.has(id)) {
      this.clients.set(id, new OAuth2Client(options));
    }
    return this.clients.get(id)!;
  }
}

export interface OAuth2GoogleProfile {
  id: string;
  email: string;
  verified_email: boolean;
  given_name: string;
  family_name: string;
}