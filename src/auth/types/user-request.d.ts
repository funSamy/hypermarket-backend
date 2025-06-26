import { User as UserModel } from '@prisma/client';

type OmitType<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

declare global {
  namespace Express {
    export interface Request {
      user?: OmitType<UserModel, 'passwordHash'>;
    }
  }
}
