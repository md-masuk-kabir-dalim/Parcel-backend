import { AuthProvider, Gender, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../../shared/prisma";
import { generateUUID } from "../utils/generateUUID";

export const initiateSuperAdmin = async () => {
  const payload = {
    id: generateUUID(),
    username: "superAdmin",
    email: "superadmin@gmail.com",
    password: "123456",
    role: UserRole.ADMIN,
    uniqueId: "superadmin",
    gender: Gender.MALE,
    phoneNumber: "+8801755876658",
    db: "1997-01-12T06:48:45.050Z",
  };

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingSuperAdmin) {
    return;
  }
  const hashedPassword: string = await bcrypt.hash(payload.password, 6);
  await prisma.user.create({
    data: {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      isVerify: true,
      role: payload.role,
      phoneNumber: payload.phoneNumber,
      provider: AuthProvider.EMAIL,
      dateOfBirth: payload.db,
      password: hashedPassword,
    },
  });
};
