import searchAndPaginate from "../../../helpers/searchAndPaginate";
import prisma from "../../../shared/prisma";

const sendSingleNotification = async ({
  receiverId,
  body,
  title,
  type,
  additionData,
}: any) => {
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
  return notificationData;
};

const getNotificationsFromDB = async (receiverId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  return await searchAndPaginate({
    model: prisma.notifications,
    searchableFields: ["title"],
    page,
    limit,
    searchQuery: query.searchQuery,
    additionalFilter: { receiverId },
    selectFields: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const getNotificationsCount = async (receiverId: string) => {
  const count = await prisma.notifications.count({
    where: {
      receiverId: receiverId,
    },
  });
  return {
    count,
  };
};

export const notificationServices = {
  sendSingleNotification,
  getNotificationsFromDB,
  getNotificationsCount,
};
