import prisma from "../../shared/prisma";
import { activeUsers } from "../../socket";
import { chatService } from "../modules/chat/chat.service";
import {
  ExtendedWebSocket,
  MessageTypes,
  storeAndSendPrivateMessage,
} from "./socket.helpers";
import { redisSocketService } from "./socket.redis";

export const handleJoinApp = async (
  ws: ExtendedWebSocket,
  userId: string,
  activeUsers: Map<string, ExtendedWebSocket>
): Promise<void> => {
  ws.userId = userId;
  activeUsers.set(userId, ws);
  await redisSocketService.storeUserConnection(userId);
  const conversationList = await chatService.getConversationListIntoDB(
    userId,
    1,
    10
  );

  ws.send(
    JSON.stringify({
      type: MessageTypes.CONVERSATION_LIST,
      conversationList,
    })
  );
};

async function handleJoinPrivateChat(
  ws: ExtendedWebSocket,
  parsedData: any,
  chatRooms: Map<string, Set<ExtendedWebSocket>>
) {
  const { userId, user2Id } = parsedData;
  for (const [roomId, sockets] of chatRooms.entries()) {
    if (sockets.has(ws)) {
      sockets.delete(ws);

      if (sockets.size === 0) {
        chatRooms.delete(roomId);
      }
    }
  }
  const conversation = await chatService.createConversationIntoDB(
    userId,
    user2Id
  );

  const chatroomId = conversation?.id as string;
  ws.chatroomId = chatroomId;
  ws.userId = userId;
  activeUsers.set(userId, ws);
  if (!chatRooms.has(chatroomId)) {
    chatRooms.set(chatroomId, new Set());
  }

  chatRooms.get(chatroomId)?.add(ws);

  setImmediate(async () => {
    await prisma.privateMessage.updateMany({
      where: {
        conversationId: chatroomId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  });

  ws.send(
    JSON.stringify({
      type: MessageTypes.JOIN_PRIVATE_CHAT,
      message: `Successfully joined the private chat with user ${user2Id}`,
      chatroomId,
    })
  );
}

async function handleSendPrivateMessage(
  ws: ExtendedWebSocket,
  parsedData: any
) {
  const { userId, receiverId, content, imageUrl } = parsedData;
  const senderSocket = activeUsers.get(userId);
  const conversationId = senderSocket?.chatroomId || ws.chatroomId;
  try {
    if (conversationId) {
      await storeAndSendPrivateMessage(
        ws,
        userId,
        receiverId,
        content,
        imageUrl,
        conversationId
      );
    } else {
      ws.send(
        JSON.stringify({
          type: MessageTypes.AUTH_FAILURE,
          message: "Conversation ID not found for sender",
        })
      );
    }
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: MessageTypes.AUTH_FAILURE,
        message: `Error sending private message:, ${error}`,
      })
    );
  }
}

export { handleJoinPrivateChat, handleSendPrivateMessage };
