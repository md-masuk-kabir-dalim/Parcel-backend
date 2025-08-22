import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import config from "../config";
export enum TokenType {
  VERIFICATION = "VERIFICATION",
  ACCESS_TOKEN = "ACCESS_TOKEN",
  PASSWORD_RESET = "PASSWORD_RESET",
}

interface JwtPayloadBase {
  id: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  username?: string;
  otpType?: string;
}

const generateToken = (
  payload: string | object | Buffer,
  secret: Secret,
  expiresIn: SignOptions["expiresIn"]
): string => {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  });
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

const generateJwtToken = (
  payload: JwtPayloadBase,
  tokenType: TokenType,
  expiresIn: SignOptions["expiresIn"]
) => {
  return jwtHelpers.generateToken(
    {
      id: payload?.id,
      email: payload?.email,
      phoneNumber: payload?.phoneNumber,
      role: payload?.role,
      username: payload?.username,
      otpType: payload?.otpType,
      tokenType: tokenType,
    },
    config.jwt.jwt_secret as string,
    expiresIn
  );
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
  generateJwtToken,
};
