import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string;
  username: string;
  email: string;
  role?: UserRole;
  phoneNumber: string;
  password: string;
  isVerify?: boolean;
}
