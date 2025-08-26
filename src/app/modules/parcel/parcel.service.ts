import {
  NotificationStatus,
  Parcel,
  PARCEL_STATUS,
  Prisma,
  UserRole,
} from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import { ParcelInput } from "./parcel.validation";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { notificationServices } from "../notifications/notification.service";
const notAllowed: PARCEL_STATUS[] = [
  PARCEL_STATUS.ASSIGNED,
  PARCEL_STATUS.DELIVERED,
  PARCEL_STATUS.IN_TRANSIT,
  PARCEL_STATUS.PICKED_UP,
];

const createParcel = async (data: ParcelInput, customerId: string) => {
  const parcelId = generateUniqueId();
  return await prisma.parcel.create({
    data: {
      ...data,
      customerId,
      parcelId,
    },
  });
};

const getAllParcels = async (
  query: any,
  customerId?: string,
  agentId?: string
) => {
  const additionalFilter: Prisma.ParcelWhereInput = {
    ...(customerId && { customerId }),
    ...(agentId && { agentId }),
    ...(query.status && { status: query.status }),
    ...(query.type && { type: query.type }),
    ...(query.isHistory === "true" && {
      status: { not: PARCEL_STATUS.UNASSIGNED },
    }),
  };

  return await searchAndPaginate<
    Parcel,
    Prisma.ParcelWhereInput,
    Prisma.ParcelSelect,
    Prisma.ParcelInclude,
    Prisma.ParcelOrderByWithAggregationInput
  >({
    model: prisma.parcel,
    searchableFields: ["parcelId", "pickupContactName", "dropoffContactName"],
    page: Number(query.page),
    limit: Number(query.limit),
    searchQuery: query.searchQuery,
    additionalFilter,
    selectFields: {
      id: true,
      parcelId: true,
      pickupLocation: true,
      dropoffLocation: true,
      currentLocation: true,
      type: true,
      weight: true,
      sizeCategory: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      agentId: true,
      customer: { select: { id: true, username: true, avatar: true } },
      agent: { select: { id: true, username: true, avatar: true } },
    },
  });
};

const getSingleParcel = async (parcelId: string) => {
  const parcel = await prisma.parcel.findUnique({
    where: { parcelId },
    include: {
      customer: {
        select: {
          id: true,
          username: true,
          email: true,
          address: true,
          avatar: true,
          phoneNumber: true,
          dateOfBirth: true,
          createdAt: true,
        },
      },
      agent: {
        select: {
          id: true,
          username: true,
          email: true,
          address: true,
          avatar: true,
          phoneNumber: true,
          dateOfBirth: true,
          createdAt: true,
        },
      },
      ParcelHistory: true,
    },
  });

  if (!parcel) throw new ApiError(404, "Parcel not found");

  return parcel;
};

const updateParcelStatus = async (
  id: string,
  data: Partial<{
    status: PARCEL_STATUS;
    currentLocation?: any;
    assignId?: string;
  }>,
  userRole: UserRole,
  currentUserId: string
) => {
  const parcel = await prisma.parcel.findUnique({ where: { id } });
  if (!parcel) throw new ApiError(404, "Parcel not found");

  // Only Admin can assign agent
  if (data.status === PARCEL_STATUS.ASSIGNED && userRole !== UserRole.ADMIN) {
    throw new ApiError(403, "Only admin can assign parcel to agent");
  }

  // Delivery agent can only update own parcels
  if (
    userRole === UserRole.DELIVERY_AGENT &&
    parcel.agentId !== currentUserId
  ) {
    throw new ApiError(403, "Not allowed");
  }

  if (data?.status === PARCEL_STATUS.ASSIGNED && !data.assignId) {
    throw new ApiError(400, "Agent ID is required");
  }

  const updateData: any = { ...data };

  const historyEntries: any[] = [];
  if (data.status) {
    historyEntries.push({
      status: data.status,
      note: `Status changed by ${userRole.toLowerCase()}`,
      location: data.currentLocation || null,
    });
  }

  // If admin assigns agent
  if (data.assignId) {
    updateData.agentId = data.assignId;
    delete updateData.assignId;
    historyEntries.push({
      status: PARCEL_STATUS.ASSIGNED,
      note: `Parcel assigned to agent by ${userRole.toLowerCase()}`,
    });
  }

  if (historyEntries.length) {
    updateData.ParcelHistory = { create: historyEntries };
  }
  console.log(updateData);
  await prisma.parcel.update({
    where: { id },
    data: updateData,
  });

  if (data.status && data.status !== PARCEL_STATUS.ASSIGNED) {
    await notificationServices.sendSingleNotification({
      receiverId: parcel.customerId,
      title: "Parcel Status Updated",
      body: `Your parcel is now ${data.status.toLowerCase()}`,
      type: NotificationStatus.PARCEL_STATUS,
    });
  }

  if (data.assignId) {
    await notificationServices.sendSingleNotification({
      receiverId: data.assignId,
      title: "New Parcel Assigned",
      body: `You have been assigned a new parcel: ${parcel.parcelId}`,
      type: NotificationStatus.PARCEL_ASSIGN,
    });
  }

  return;
};

const deleteParcel = async (id: string) => {
  const parcel = await prisma.parcel.findUnique({
    where: { id },
  });

  if (!parcel) {
    throw new Error("Parcel not found");
  }

  if (notAllowed.includes(parcel.status)) {
    throw new Error(`Cannot delete parcel with status: ${parcel.status}`);
  }

  return prisma.parcel.delete({
    where: { id },
  });
};

export const parcelService = {
  createParcel,
  getAllParcels,
  getSingleParcel,
  updateParcelStatus,
  deleteParcel,
};
