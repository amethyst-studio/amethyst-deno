import { ObjectId, UpdateFilter } from "../../deps.ts";
import {
  AllowedCollection,
  AllowedConnection,
  ConnectOptions,
  Model,
  Schema,
} from "../connect.ts";

export class UserSchema extends Schema<UserModel, ConnectOptions> {
  public collectionId: AllowedCollection = "user";
  public connectionId: AllowedConnection = "schema";

  private constants = {};

  public async initialize(): Promise<void> {
    await this.collection!.createIndexes({
      indexes: [
        {
          key: {
            uid: 1,
          },
          name: `data_uid_${this.collectionId}`,
          unique: true,
        },
        {
          key: {
            email: 1,
          },
          name: `data_email_${this.collectionId}`,
          unique: true,
        },
        {
          key: {
            googleUserId: 1,
          },
          name: `data_googleUserId_${this.collectionId}`,
          unique: true,
        },
        {
          key: {
            githubUserId: 1,
          },
          name: `data_githubUserId_${this.collectionId}`,
          unique: true,
        },
        {
          key: {
            gitlabUserId: 1,
          },
          name: `data_gitlabUserId_${this.collectionId}`,
          unique: true,
        },
        {
          key: {
            discordUserId: 1,
          },
          name: `data_discordUserId_${this.collectionId}`,
          unique: true,
        },
      ],
    }).catch((e: Error) => {
      console.error("Failed to set user indexes.", e.message);
    });
  }

  public async getUserByIdentifier(
    identifier: string,
  ): Promise<UserModel | null> {
    return await this.get({
      $or: [
        {
          uid: identifier,
        },
        {
          email: identifier,
        },
        {
          googleUserId: identifier,
        },
        {
          githubUserId: identifier,
        },
        {
          gitlabUserId: identifier,
        },
        {
          discordUserId: identifier,
        },
      ],
    });
  }

  public async createUser(user: UserModel): Promise<ObjectId> {
    return await this.add(user);
  }

  public async updateUser(
    identifier: string,
    update: UpdateFilter<UserModel>,
  ): Promise<void> {
    const uid = await this.getUserByIdentifier(identifier);

    // Verify UID
    if (uid === null) {
      throw new Error("Unable to locate user for update operation.");
    }

    return await this.update({
      uid: uid.uid,
    }, update);
  }
}

// import { Collection, UpdateFilter } from '../../deps.ts';
// import { AllowedCollection, AllowedDatabase, ConnectOptions, Schema, SimpleConnect } from '../connect.ts';
// import { AttributeModel } from './attribute.model.ts';
// import { RoleModel } from './role.model.ts';
// import { Trace } from './trace.model.ts';

// export class User extends SimpleConnect {
//   private static options: UserOptions;
//   private static collection: Collection<UserModel>;

//   public static async getUID(): Promise<string> {
//     let uid = crypto.randomUUID();
//     let user: Partial<UserModel> | null = await this.getUser(uid);

//     // Ensure the user uid is not in use. Force a unique record.
//     if (user !== null) {
//       while (user !== null) {
//         uid = crypto.randomUUID();
//         // deno-lint-ignore no-await-in-loop
//         user = await this.getUser(uid);
//       }
//     }

//     // Return a
//     return uid;
//   }

//   public static async createUser(user: Partial<UserModel>): Promise<string> {
//     if (user.email === undefined) {
//       throw new Deno.errors.InvalidData(
//         'Unable to create user. Field "email" is required.',
//       );
//     }
//     if (user.firstName === undefined || user.lastName === undefined) {
//       throw new Deno.errors.InvalidData(
//         'Unable to create user. Field "firstName" and/or "lastName" is required.',
//       );
//     }
//     if (user.dateOfBirth === undefined) {
//       throw new Deno.errors.InvalidData(
//         'Unable to create user. Field "dateOfBirth" is required.',
//       );
//     }
//     user.uid = user.uid ?? await this.getUID();
//     await this.collection!.insertOne({
//       uid: user.uid,
//       email: user.email,
//       emailDeliverable: user.emailDeliverable ?? false,
//       emailVerified: user.emailVerified ?? false,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       dateOfBirth: user.dateOfBirth,
//       role: user.role ?? [],
//       attribute: user.attribute ?? [],
//       createdAt: user.createdAt ?? new Date(),
//     }).catch((e) => {
//       throw new Deno.errors.InvalidData(
//         'Failed to create user. Failed to write to database.',
//         {
//           cause: e.message,
//         },
//       );
//     });
//     return user.uid;
//   }

//   public static async getUser(identifier: string): Promise<UserModel | null> {
//     return await this.collection!.findOne({
//       $or: [
//         { uid: { $eq: identifier } },
//         { email: { $eq: identifier } },
//         { googleUserId: { $eq: identifier } },
//         { githubUserId: { $eq: identifier } },
//         { gitlabUserId: { $eq: identifier } },
//         { discordUserId: { $eq: identifier } },
//       ],
//     }) ?? null;
//   }

//   public static async updateUser(
//     identifier: string,
//     user: UpdateFilter<UserModel>,
//   ): Promise<void> {
//     user.$set!.lastUpdatedAt = new Date();
//     await this.collection!.updateOne({
//       $or: [
//         { uid: { $eq: identifier } },
//         { email: { $eq: identifier } },
//         { googleUserId: { $eq: identifier } },
//         { githubUserId: { $eq: identifier } },
//         { gitlabUserId: { $eq: identifier } },
//         { discordUserId: { $eq: identifier } },
//       ],
//     }, user);
//   }

//   public static async initialize(options: UserOptions): Promise<void> {
//     this.options = options;
//     this.collection = (await this.get('model_reuse', this.options.connection))
//       .getCollection<AllowedDatabase, AllowedCollection, UserModel>(
//         this.options.database,
//         'user',
//       );

//     // Setup Data Indices
//     await this.collection!.createIndexes({
//       indexes: [
//         {
//           key: {
//             'uid': 1,
//             'email': 1,
//             'googleUserId': 1,
//             'githubUserId': 1,
//             'gitlabUserId': 1,
//             'discordUserId': 1,
//           },
//           name: 'user_data',
//           unique: true,
//         },
//       ],
//     }).catch((e: Error) => {
//       Trace.sendError({
//         service: 'user_model',
//         status: '409 Conflict',
//         action: 'WARNING',
//         context: {
//           message: 'Failed to set indices for user collection. Please investigate.',
//           error: e,
//         },
//       });
//     });
//   }
// }

// export interface UserOptions extends ConnectOptions {
// }

export interface UserModel extends Model {
  uid: string;
  token: string;
  email: string;
  emailVerified: boolean;
  emailDeliverable: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  // Permissions
  //   role: RoleModel[];
  //   attribute: AttributeModel[];
  // SSO Credentials
  googleUserId?: string;
  githubUserId?: string;
  gitlabUserId?: string;
  discordUserId?: string;
}
