import { ConversationStatus } from "@prisma/client";
import { redis } from "../../../helpers/redis";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import prisma from "../../../shared/prisma";
import { redisSocketService } from "../../utils/socket.redis";

const createConversationIntoDB = async (user1Id: string, user2Id: string) => {
  try {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }
    const newConversation = await prisma.conversation.create({
      data: {
        user1Id,
        user2Id,
        status: ConversationStatus.DEACTIVATE,
      },
      select: {
        id: true,
      },
    });
    return newConversation;
  } catch (error) {
    console.error("Error creating or finding conversation:", error);
  }
};

const chatImageUploadIntoDB = async (file: Express.Multer.File) => {
  const image = await uploadToDigitalOcean(file, "chat_image");
  return image;
};

const chatAudioUploadIntoDB = async (file: Express.Multer.File) => {
  const audio = await uploadToDigitalOcean(file, "chat_audio");
  return audio;
};

const getConversationListIntoDB = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [privateConversations, privateCount] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: "ACTIVE",
      },

      select: {
        id: true,
        lastMessage: true,
        updatedAt: true,
        user1Id: true,
        user1: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
        user2: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
        _count: {
          select: {
            privateMessages: {
              where: {
                receiverId: userId,
                read: false,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.conversation.count({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    }),
  ]);

  // Map private conversations
  const privateConversationsData = await Promise.all(
    privateConversations.map(async (conv) => {
      const otherUser: any = conv?.user1Id === userId ? conv.user2 : conv.user1;
      const key = `conversation:lastMessage:${conv?.id}`;
      const lastMessageData = await redis.get(key);

      let lastMessage = null;
      let timestamp = null;

      if (lastMessageData) {
        const parsed = JSON.parse(lastMessageData);
        lastMessage = parsed.lastMessage ?? null;
        timestamp = parsed.timestamp ?? null;
      }

      return {
        conversationId: conv?.id,
        type: "private",
        participants: {
          userId: otherUser?.id ?? "",
          username: otherUser?.username ?? "",
          avatar: otherUser?.avatar,
        },
        lastMessage: lastMessage ?? conv.lastMessage,
        lastMessageTime: timestamp ?? conv.updatedAt,
        unseen: conv?._count?.privateMessages ?? 0,
      };
    })
  );

  const totalPages = Math.ceil(privateCount / limit);

  const result = {
    result: privateConversationsData,
    meta: {
      page: totalPages,
      limit: limit,
      total: privateCount,
    },
  };
  return result;
};

const getMergedMessageList = async (
  conversationId: string,
  page: number,
  limit: number
) => {
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const redisKey = `chat:messages:${conversationId}`;

  const [redisCount, dbCount] = await Promise.all([
    redis.zcard(redisKey),
    prisma.privateMessage.count({ where: { conversationId } }),
  ]);

  const total = redisCount + dbCount;
  const totalPage = Math.ceil(total / limit);

  let messages: any[] = [];

  if (start < redisCount) {
    const redisEnd = Math.min(end, redisCount - 1);
    const redisRaw = await redis.zrevrange(redisKey, start, redisEnd);
    messages.push(...redisRaw.map((msg) => JSON.parse(msg)));

    const remaining = limit - messages.length;
    if (remaining > 0) {
      const dbMessages = await prisma.privateMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: remaining,
      });
      messages.push(...dbMessages);
    }
  } else {
    const dbSkip = start - redisCount;
    const dbMessages = await prisma.privateMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: dbSkip,
      take: limit,
    });
    messages.push(...dbMessages);
  }

  // 🔄 Enrich with receiver info and add type
  messages = await Promise.all(
    messages.map(async (msg: any) => {
      const receiver = await redisSocketService.getUserDetails(msg.receiverId);
      return {
        ...msg,
        type: "receivePrivateMessage",
        receiver: {
          id: receiver?.id || msg.receiverId,
          username: receiver?.username || "",
          image: receiver?.image || "",
        },
      };
    })
  );

  return {
    messages,
    meta: {
      page,
      limit,
      totalPage,
      total,
    },
  };
};

const markMessagesAsRead = async (userId: string, conversationId: string) => {
  await prisma.privateMessage.updateMany({
    where: {
      receiverId: userId,
      conversationId: conversationId,
      read: false,
    },
    data: {
      read: true,
      updatedAt: new Date(),
    },
  });

  return { success: true, message: "Messages marked as read" };
};

export const chatService = {
  getConversationListIntoDB,
  createConversationIntoDB,
  getMergedMessageList,
  markMessagesAsRead,
  chatImageUploadIntoDB,
  chatAudioUploadIntoDB,
};
