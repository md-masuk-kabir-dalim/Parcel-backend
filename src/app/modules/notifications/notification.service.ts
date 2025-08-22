import { NotificationType } from "@prisma/client";
import admin from "../../../helpers/firebaseAdmin";
import prisma from "../../../shared/prisma";

const sendSingleNotification = async ({
  receiverId,
  body,
  title,
  type,
  additionData,
}: any) => {
  const user = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  const formattedAdditionData = Object.entries(additionData || {}).reduce(
    (acc: any, [key, value]) => {
      acc[key] = String(value);
      return acc;
    },
    {}
  );

  const notificationData = await prisma.notifications.create({
    data: {
      receiverId,
      title: title,
      body: {
        description: body,
        ...additionData,
      },
      type,
    },
  });

  if (!user?.fcmToken) {
    return notificationData;
  }

  const message = {
    notification: {
      body: body,
      title: title,
    },
    data: {
      type: String(type),
      notificationId: notificationData.id,
      ...formattedAdditionData,
    },
    token: user?.fcmToken,
  };

  try {
    await admin.messaging().send(message);
    return notificationData;
  } catch (error: any) {
    return null;
  }
};

const updateNotificationStatus = async (
  notificationId: string,
  type: NotificationType
) => {
  const notification = await prisma.notifications.findUnique({
    where: { id: notificationId },
  });
  if (!notification) {
    return;
  }
  const updatedNotification = await prisma.notifications.update({
    where: { id: notificationId },
    data: { type: type },
  });
  return updatedNotification;
};

const sendNotifications = async (
  body: string,
  title: string,
  type: NotificationType,
  additionData: any
) => {
  try {
    const users = await prisma.user.findMany({
      where: { fcmToken: { not: undefined } },
      select: { id: true, fcmToken: true },
    });

    if (users.length === 0) {
      return;
    }
    const formattedAdditionData = Object.entries(additionData || {}).reduce(
      (acc: any, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {}
    );

    const fcmTokens = users.map((user) => user.fcmToken);

    const message = {
      notification: {
        title: title,
        body: body,
        type: type,
      },
      data: {
        type: String(type),
        ...formattedAdditionData,
      },
      tokens: fcmTokens,
    };

    let result;

    if (users.length > 0) {
      result = await prisma.notifications.createMany({
        data: users.map((user) => ({
          receiverId: user.id,
          title: title,
          body: {
            description: body,
            ...additionData,
          },
          type,
        })),
      });
    }

    await admin.messaging().sendEachForMulticast(message as any);

    return result;
  } catch (error) {
    return;
  }
};

const sendMultipedNotifications = async (
  body: string,
  title: string,
  type: NotificationType,
  userIds?: string[]
) => {
  const users = await prisma.user.findMany({
    where: {
      fcmToken: { not: undefined },
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    select: { id: true, fcmToken: true },
  });

  if (users.length === 0) {
    return;
  }

  const fcmTokens = users.map((user) => user.fcmToken);

  const message = {
    notification: {
      title: title || "Notification",
      body: body,
      type: type,
    },
    tokens: fcmTokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message as any);
  const successIndices = response?.responses
    .map((res, idx) => (res.success ? idx : null))
    .filter((idx) => idx !== null) as number[];

  const successfulUsers = successIndices.map((idx) => users[idx]);

  if (successfulUsers.length > 0) {
    await prisma.notifications.createMany({
      data: users.map((user) => ({
        receiverId: user.id,
        title: title || "Notification",
        body: body,
        type,
      })),
    });
  }
};

const getNotificationsFromDB = async (receiverId: string) => {
  const notifications = await prisma.notifications.findMany({
    where: { receiverId: receiverId },
    orderBy: { createdAt: "desc" },
  });

  return { notifications };
};

export const notificationServices = {
  sendSingleNotification,
  getNotificationsFromDB,
  sendNotifications,
  sendMultipedNotifications,
  updateNotificationStatus,
};
