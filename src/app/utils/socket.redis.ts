import { redis } from "../../helpers/redis";
import prisma from "../../shared/prisma";

const storeUserConnection = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatar: true,
      id: true,
      username: true,
    },
  });
  if (!user) return;
  const image = user?.avatar || " ";
  const username = user?.username || " ";
  await redis.hmset(`user:${userId}`, {
    id: user.id,
    username,
    image,
  });
};

const getUserDetails = async (userId: string): Promise<any | null> => {
  let userDetails = await redis.hgetall(`user:${userId}`);
  if (!userDetails) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      userDetails = {
        id: user.id,
        username: user.username || "",
        image: user.avatar || "",
      };
    }
  }
  return userDetails;
};

const removeUserConnection = async (userId: string) => {
  await redis.del(`user:${userId}`);
  await redis.zremrangebyrank(`conversation:list:${userId}`, 0, -1);
};

const getConversationObject = async (
  userId: string,
  conversationId: string,
  lastMessage: string,
  username: true,
  image: string
) => {
  const messagePreview = lastMessage?.slice(0, 50) || "📷 Image";
  const timestamp = new Date();
  const unseenCount = await redis.hget(
    `conversation:unseen:${conversationId}`,
    userId
  );
  const conversation = {
    conversationId: conversationId,
    type: "private",
    participants: {
      userId: userId,
      username: username,
      image: image,
    },
    lastMessage: messagePreview,
    lastMessageTime: timestamp,
    unseen: unseenCount ?? 0,
  };

  return conversation;
};

const updateAgentLocation = async (
  agentId: string,
  lat: number,
  lng: number
) => {
  const location = { lat, lng, updatedAt: new Date().toISOString() };
  await redis.set(
    `agent:${agentId}:location`,
    JSON.stringify(location),
    "EX",
    300
  ); // expire 5 min
};

const getAgentLocation = async (agentId: string) => {
  const data = await redis.get(`agent:${agentId}:location`);
  if (!data) return null;
  return JSON.parse(data);
};

export const redisSocketService = {
  storeUserConnection,
  getUserDetails,
  removeUserConnection,
  getConversationObject,
  updateAgentLocation,
  getAgentLocation,
};
