import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import config from "../../config";

import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers, TokenType } from "../../helpers/jwtHelpers";
import prisma from "../../shared/prisma";
import { redis } from "../../helpers/redis";

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      if (verifiedUser?.tokenType !== TokenType.ACCESS_TOKEN) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "This token cannot be used for this action. Please use the appropriate verification token."
        );
      }

      const userCacheKey = `user:${verifiedUser.id}`;

      const isCached = await redis.exists(userCacheKey);

      if (!isCached) {
        const existingUser = await prisma.user.findUnique({
          where: { id: verifiedUser.id },
          select: { id: true },
        });

        if (!existingUser) {
          throw new ApiError(404, "User Not Found");
        }

        await redis.set(userCacheKey, "1", "EX", 600);
      }

      req.user = verifiedUser;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Forbidden! You are not authorized"
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;