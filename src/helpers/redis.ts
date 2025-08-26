import { Queue, Worker } from "bullmq";
import Redis, { RedisOptions } from "ioredis";
import { otpVerifyHtmlFormat } from "../app/utils/otpVerifyHtmlFormat";
import { RedisMessage } from "../interfaces/common";
import prisma from "../shared/prisma";
import sendEmail from "./sendEmail";

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  retryStrategy: (times: number) => {
    if (times > 5) return undefined;
    return Math.min(times * 100, 3000);
  },
  connectTimeout: 10000,
  keepAlive: 30000,
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisOptions);

redis.on("connect", () => console.log("✅ Redis connected successfully"));
redis.on("error", (err: any) => console.error("❌ Redis error:", err));
const otpQueue = new Queue("otp-queue", { connection: redis });
const conversationUpdateQueue = new Queue("conversationUpdateQueue", {
  connection: redis,
});
const messagePersistenceQueue = new Queue("messagePersistenceQueue", {
  connection: redis,
});

const otpWorker = new Worker(
  "otp-queue",
  async (job) => {
    const { otpCode, username, identifier } = job.data;
    const html = await otpVerifyHtmlFormat(username, otpCode);
    await sendEmail(identifier, "OTP Verification", html);
    return "OTP job completed";
  },
  { connection: redis }
);

const messagePersistenceWorker = new Worker(
  "messagePersistenceQueue",
  async (job) => {
    const { conversationId } = job.data;
    const redisKey = `chat:messages:${conversationId}`;
    const backupKey = `chat:messages:backup:${conversationId}`;
    let rawMessages: string[] = [];
    let rawMessagesWithScores: (string | number)[] = [];

    const backupExists = await redis.exists(backupKey);
    if (backupExists) {
      rawMessagesWithScores = await redis.zrevrange(
        backupKey,
        0,
        -1,
        "WITHSCORES"
      );
    } else {
      rawMessagesWithScores = await redis.zrevrange(
        redisKey,
        0,
        -1,
        "WITHSCORES"
      );
      if (rawMessagesWithScores.length > 0) {
        const args: (string | number)[] = [];
        for (let i = 0; i < rawMessagesWithScores.length; i += 2) {
          const member = rawMessagesWithScores[i];
          const score = rawMessagesWithScores[i + 1];
          args.push(score, member);
        }
        await redis.zadd(backupKey, ...args);
      }
    }

    if (!rawMessagesWithScores?.length) {
      return `No messages to persist for ${conversationId}`;
    }

    rawMessages = [];
    for (let i = 0; i < rawMessagesWithScores.length; i += 2) {
      rawMessages.push(rawMessagesWithScores[i] as string);
    }
    const parsed: RedisMessage[] = rawMessages.map((msg) => JSON.parse(msg));

    try {
      await prisma.$transaction(
        parsed.map((m) =>
          prisma.privateMessage.upsert({
            where: { id: m.id },
            update: {},
            create: {
              id: m.id!,
              senderId: m.senderId,
              receiverId: m.receiverId,
              content: m.content,
              imageUrl: m.imageUrl || null,
              createdAt: new Date(m.createdAt),
              updatedAt: new Date(m.createdAt),
              read: m.read || false,
              conversationId: m.conversationId,
            },
          })
        )
      );

      await Promise.all([redis.del(redisKey), redis.del(backupKey)]);
      return `✅ Persisted ${parsed.length} messages for ${conversationId}`;
    } catch (error: any) {
      return `❌ DB error: ${error.message || error}`;
    }
  },
  { connection: redis }
);

const conversationUpdateWorker = new Worker(
  "conversationUpdateQueue",
  async (job) => {
    const { conversationId } = job.data;
    const key = `conversation:lastMessage:${conversationId}`;
    const lockKey = `conv:update:lock:${conversationId}`;

    const data = await redis.get(key);
    if (!data) return;

    const { lastMessage, timestamp } = JSON.parse(data);

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage,
        updatedAt: new Date(timestamp),
        status: "ACTIVE",
      },
    });
    await redis.del(lockKey);
    await redis.del(key);
  },
  { connection: redis }
);

const cleanQueues = async () => {
  await Promise.all([
    otpQueue.clean(0, 1000, "completed"),
    otpQueue.clean(0, 1000, "failed"),
    otpQueue.clean(0, 1000, "delayed"),
    otpQueue.clean(0, 1000, "wait"),

    messagePersistenceQueue.clean(0, 1000, "completed"),
    messagePersistenceQueue.clean(0, 1000, "failed"),
    messagePersistenceQueue.clean(0, 1000, "delayed"),
    messagePersistenceQueue.clean(0, 1000, "wait"),

    conversationUpdateQueue.clean(0, 1000, "completed"),
    conversationUpdateQueue.clean(0, 1000, "failed"),
    conversationUpdateQueue.clean(0, 1000, "delayed"),
    conversationUpdateQueue.clean(0, 1000, "wait"),
  ]);
};

// Run cleanup at startup
(async () => {
  try {
    await cleanQueues();
    console.log("🧹 [Queue] All queues cleaned successfully.");
  } catch (err) {
    console.error("❌ Failed to clean queues:", err);
  }
})();

// Helper function to handle failed jobs cleanup
const handleJobFailure = async (job: any, err: any) => {
  try {
    await job.remove();
  } catch (removeErr) {
    console.error(`Failed to remove job ${job.id}:`, removeErr);
  }
};

otpWorker.on("completed", handleJobFailure);
messagePersistenceWorker.on("completed", handleJobFailure);
conversationUpdateWorker.on("completed", handleJobFailure);

otpWorker.on("failed", handleJobFailure);
messagePersistenceWorker.on("failed", handleJobFailure);
conversationUpdateWorker.on("failed", handleJobFailure);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🚨 Gracefully shutting down...");
  await otpQueue.close();
  await otpWorker.close();
  await conversationUpdateQueue.close();
  await conversationUpdateWorker.close();
  await messagePersistenceWorker.close();
  await messagePersistenceQueue.close();
  await redis.quit();
  console.log("✅ Workers and Queues closed gracefully");
  process.exit(0);
});

export {
  messagePersistenceQueue,
  otpQueue,
  otpWorker,
  redis,
  conversationUpdateQueue,
};
