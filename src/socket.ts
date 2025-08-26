import { WebSocketServer } from "ws";
import {
  handleJoinApp,
  handleJoinPrivateChat,
  handleSendPrivateMessage,
} from "./app/utils/private.chat";
import {
  ExtendedWebSocket,
  handleDisconnect,
  MessageTypes,
} from "./app/utils/socket.helpers";
import startKeepAlive from "./app/utils/startKeepAlive";
import { validateToken } from "./app/utils/validateToken";
import { redisSocketService } from "./app/utils/socket.redis";

export const activeUsers = new Map<string, ExtendedWebSocket>();

export const chatRooms = new Map<string, Set<ExtendedWebSocket>>();

let wss: WebSocketServer;

export default function socketConnect(server: any) {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: ExtendedWebSocket, req) => {
    let token;
    if (req.headers["x-token"]) {
      token = req.headers["x-token"] as string;
    } else {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      token = url.searchParams.get("token") || "";
    }
    const userId = await validateToken(ws, token);

    if (!userId) {
      return;
    }
    const keepAliveInterval = startKeepAlive(ws);
    ws.on("message", async (data: string) => {
      try {
        let parsedData = JSON.parse(data);
        parsedData.userId = userId;

        switch (parsedData.type) {
          case MessageTypes.JOIN_APP:
            await handleJoinApp(ws, userId as unknown as string, activeUsers);
            break;
          case MessageTypes.JOIN_PRIVATE_CHAT:
            await handleJoinPrivateChat(ws, parsedData, chatRooms);
            break;
          case MessageTypes.SEND_PRIVATE_MESSAGE:
            await handleSendPrivateMessage(ws, parsedData);
            break;
          case MessageTypes.AGENT_LOCATION_UPDATE: {
            const { lat, lng } = parsedData;
            await redisSocketService.updateAgentLocation(
              parsedData.userId,
              lat,
              lng
            );
            ws.send(
              JSON.stringify({
                type: MessageTypes.AGENT_LOCATION_UPDATE,
                lat: 23.8103,
                lng: 90.4125,
              })
            );
            break;
          }

          case MessageTypes.GET_AGENT_LOCATION: {
            const { agentId } = parsedData;
            const location = await redisSocketService.getAgentLocation(agentId);
            ws.send(
              JSON.stringify({
                type: MessageTypes.GET_AGENT_LOCATION,
                location,
              })
            );
            break;
          }

          default:
            console.log("Unknown WebSocket message types:", parsedData.type);
        }
      } catch (error) {
        console.error("Error handling WebSocket messages:", error);
      }
    });
    ws.on("close", () => {
      clearInterval(keepAliveInterval);
      handleDisconnect(ws);
    });
  });
}
