import { WebSocket } from "ws";
import {
  conversationUpdateQueue,
  messagePersistenceQueue,
  redis,
} from "../../helpers/redis";
import { activeUsers, chatRooms } from "../../socket";
import { generateUUID } from "./generateUUID";
import { redisSocketService } from "./socket.redis";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  user2Id?: string;
  chatroomId?: string;
  groupId?: string;
}

export enum MessageTypes {
  JOIN_PRIVATE_CHAT = "joinPrivateChat",
  SEND_PRIVATE_MESSAGE = "sendPrivateMessage",
  MESSAGE_LIST = "messageList",
  RECEIVED_PRIVATE_MESSAGE = "receivePrivateMessage",
  CONVERSATION_LIST = "conversationList",
  JOIN_CONVERSATION_LIST = "joinConversationList",
  AUTH_SUCCESS = "authSuccess",
  AUTH_FAILURE = "authFailure",
  FAILURE = "Failure",
  JOIN_APP = "joinApp",
  AGENT_LOCATION_UPDATE = "agentLocationUpdate",
  GET_AGENT_LOCATION = "getAgentLocation",
}

const MAX_REDIS_MESSAGES = 5;

function broadcastToGroup(
  groupId: string,
  message: any,
  groupRooms: Map<string, Set<ExtendedWebSocket>>
) {
  const groupClients = groupRooms.get(groupId);
  if (!groupClients) return;

  groupClients.forEach((client: ExtendedWebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

async function storeAndSendPrivateMessage(
  ws: ExtendedWebSocket,
  senderId: string,
  receiverId: string,
  content: string,
  imageUrl: string,
  conversationId: string
) {
  try {
    const timestamp = new Date().toISOString();
    const [senderDetails, receiverDetails] = await Promise.all([
      redisSocketService.getUserDetails(senderId),
      redisSocketService.getUserDetails(receiverId),
    ]);

    const chatRoom = chatRooms.get(conversationId);

    const isReceiverInRoom =
      chatRoom &&
      [...chatRoom].some((clientSocket) => clientSocket.userId === receiverId);

    const messagePayload = {
      id: generateUUID(),
      senderId,
      receiverId,
      content,
      imageUrl,
      createdAt: timestamp,
      read: isReceiverInRoom ? true : false,
      updatedAt: timestamp,
    };

    if (chatRoom) {
      for (const clientSocket of chatRoom) {
        if (clientSocket.readyState === clientSocket.OPEN) {
          const isSender = clientSocket.userId === senderId;
          clientSocket.send(
            JSON.stringify({
              ...messagePayload,
              conversationId,
              type: MessageTypes.RECEIVED_PRIVATE_MESSAGE,
              receiver: isSender ? receiverDetails : senderDetails,
            })
          );
        }
      }
    }

    const redisKey = `chat:messages:${conversationId}`;
    const messageObject = {
      ...messagePayload,
      conversationId,
    };

    const keyType = await redis.type(redisKey);
    if (keyType !== "zset" && keyType !== "none") {
      await redis.del(redisKey);
    }

    await redis.zadd(
      redisKey,
      new Date(timestamp).getTime(),
      JSON.stringify(messageObject)
    );

    if (!isReceiverInRoom) {
      await redis.hincrby(
        `conversation:unseen:${conversationId}`,
        receiverId,
        1
      );
    }

    const [senderConversation, receiverConversation] = await Promise.all([
      redisSocketService.getConversationObject(
        receiverId,
        conversationId,
        content,
        receiverDetails?.username,
        receiverDetails?.image
      ),
      redisSocketService.getConversationObject(
        senderId,
        conversationId,
        content,
        senderDetails?.username,
        senderDetails.image
      ),
    ]);

    const updatedLists = [senderId, receiverId];
    updatedLists.forEach((userId) => {
      const socket = activeUsers.get(userId);
      if (socket && socket.readyState === socket.OPEN) {
        socket.send(
          JSON.stringify({
            type: MessageTypes.CONVERSATION_LIST,
            conversation:
              userId === senderId ? senderConversation : receiverConversation,
          })
        );
      }
    });

    const redisConKey = `conversation:lastMessage:${conversationId}`;
    const lockKey = `conv:update:lock:${conversationId}`;
    await redis.set(
      redisConKey,
      JSON.stringify({
        lastMessage: content ? content.slice(0, 20) : imageUrl,
        timestamp,
      }),
      "EX",
      3600
    );

    setImmediate(async () => {
      const listLength = await redis.zcard(redisKey);
      if (listLength >= MAX_REDIS_MESSAGES) {
        await messagePersistenceQueue.add(
          "persistMessagesToDB",
          { conversationId },
          {
            jobId: `persist:${conversationId}:${Date.now()}`,
            removeOnComplete: true,
            delay: 0,
            attempts: 3,
            removeOnFail: { count: 3 },
          }
        );
      }

      if (!lockKey) {
        await conversationUpdateQueue.add(
          "flushConversationUpdate",
          { conversationId },
          {
            jobId: `conv:${conversationId}`,
            delay: 600_000,
            removeOnComplete: true,
            removeOnFail: { count: 3 },
          }
        );

        await redis.set(lockKey, "1", "EX", 600); //10 min
      }
    });
  } catch (error: any) {
    ws.send(
      JSON.stringify({
        type: MessageTypes.FAILURE,
        message: `Message sending failed: ${error.message || error}`,
      })
    );
  }
}

function handleDisconnect(ws: ExtendedWebSocket) {
  try {
    if (ws.userId) {
      activeUsers.delete(ws.userId);
      redisSocketService.removeUserConnection(ws.userId);
      if (ws.chatroomId && chatRooms.has(ws.chatroomId)) {
        const chatRoom = chatRooms.get(ws.chatroomId);
        chatRoom?.delete(ws);
        if (chatRoom && chatRoom.size === 0) {
          chatRooms.delete(ws.chatroomId);
        }
      }
    }
  } catch (error) {
    return;
  }
}

export {
  broadcastToGroup,
  ExtendedWebSocket,
  handleDisconnect,
  storeAndSendPrivateMessage,
};
