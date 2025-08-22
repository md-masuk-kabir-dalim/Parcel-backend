import { Parcel, PARCEL_STATUS, Prisma, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import { ParcelInput } from "./parcel.validation";
import { generateUniqueId } from "../../utils/generateUniqueId";

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
      customer: { select: { id: true, username: true, avatar: true } },
      agent: { select: { id: true, username: true, avatar: true } },
    },
  });
};

const getSingleParcel = async (id: string) => {
  const parcel = await prisma.parcel.findUnique({
    where: { id },
    include: {
      customer: true,
      agent: true,
      ParcelHistory: true,
    },
  });

  if (!parcel) throw new ApiError(404, "Parcel not found");

  return parcel;
};

const updateParcelStatus = async (
  id: string,
  data: Partial<{ status: PARCEL_STATUS }>,
  userRole: UserRole,
  currentUserId: string
) => {
  const parcel = await prisma.parcel.findUnique({ where: { id } });
  if (!parcel) throw new ApiError(404, "Parcel not found");

  // Only Admin or assigned Agent can update
  if (userRole === UserRole.CUSTOMER && parcel.customerId !== currentUserId) {
    throw new ApiError(403, "Not allowed");
  }

  if (
    userRole === UserRole.DELIVERY_AGENT &&
    parcel.agentId !== currentUserId
  ) {
    throw new ApiError(403, "Not allowed");
  }

  const updated = await prisma.parcel.update({
    where: { id },
    data,
  });

  // Add history entry
  if (data.status) {
    await prisma.parcelHistory.create({
      data: {
        parcelId: id,
        status: data.status,
        note: `Status changed by ${userRole}`,
      },
    });
  }

  return updated;
};

const deleteParcel = async (id: string) => {
  return await prisma.parcel.delete({ where: { id } });
};

export const parcelService = {
  createParcel,
  getAllParcels,
  getSingleParcel,
  updateParcelStatus,
  deleteParcel,
};
