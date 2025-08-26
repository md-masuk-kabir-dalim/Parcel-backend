import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import prisma from "../../shared/prisma";
import { ExtendedWebSocket, MessageTypes } from "./socket.helpers";

export async function validateToken(
  ws: ExtendedWebSocket,
  token: string
): Promise<boolean | string> {
  if (!token) {
    ws.send(
      JSON.stringify({
        type: MessageTypes.AUTH_FAILURE,
        message: "Authentication token is required.",
      })
    );
    ws.close(4000, "Authentication token is required.");
    return false;
  }

  try {
    const decodedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.jwt_secret as string
    );

    const existingUser = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!existingUser) {
      throw new ApiError(404, "User Not Found");
    }
    ws.userId = decodedToken.id;

    // Send success message and return userID
    ws.send(
      JSON.stringify({
        type: MessageTypes.AUTH_SUCCESS,
        message: "Token validated successfully.",
        userId: decodedToken.id,
      })
    );

    return decodedToken.id;
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: MessageTypes.AUTH_FAILURE,
        message: "Invalid or expired token.",
      })
    );
    ws.close(4000, "Invalid or expired token.");
    return false;
  }
}
