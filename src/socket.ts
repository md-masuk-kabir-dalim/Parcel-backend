import { WebSocketServer } from "ws";
import { chatService } from "./app/modules/chat/chat.service";
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

export const activeUsers = new Map<string, ExtendedWebSocket>();

export const chatRooms = new Map<string, Set<ExtendedWebSocket>>();

let wss: WebSocketServer;

export default function socketConnect(server: any) {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: ExtendedWebSocket, req) => {
    const token = req.headers["x-token"] as string;
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
          case MessageTypes.MESSAGE_LIST: {
            try {
              const {
                conversationId,
                page = 1,
                limit = 10,
                userId: user1Id,
              } = parsedData;

              if (!conversationId || !user1Id) {
                ws.send(
                  JSON.stringify({
                    type: MessageTypes.FAILURE,
                    message:
                      "Missing required fields: conversationId or userId",
                  })
                );
                break;
              }

              const messageList = await chatService.getMergedMessageList(
                conversationId,
                Number(page),
                Number(limit)
              );

              const receiverSocket = activeUsers.get(user1Id);

              if (receiverSocket) {
                receiverSocket.send(
                  JSON.stringify({
                    type: MessageTypes.CONVERSATION_LIST,
                    messageList,
                  })
                );
              } else {
                ws.send(
                  JSON.stringify({
                    type: MessageTypes.FAILURE,
                    message: `User socket not found for userId: ${user1Id}`,
                  })
                );
              }
            } catch (error) {
              ws.send(
                JSON.stringify({
                  type: MessageTypes.FAILURE,
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unknown error occurred",
                })
              );
            }
            break;
          }

          case MessageTypes.CONVERSATION_LIST:
            try {
              const { userId, page = 1, limit = 10 } = parsedData;
              const conversationList =
                await chatService.getConversationListIntoDB(
                  userId,
                  Number(page),
                  Number(limit)
                );
              const receiverSocket = activeUsers.get(userId);
              if (receiverSocket) {
                receiverSocket.send(
                  JSON.stringify({
                    type: MessageTypes.CONVERSATION_LIST,
                    conversationList,
                  })
                );
              }
            } catch (error) {
              ws.send(
                JSON.stringify({
                  type: MessageTypes.FAILURE,
                  message: error,
                })
              );
            }
            break;

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
