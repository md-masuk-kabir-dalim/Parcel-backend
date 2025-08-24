import { UserRole, PARCEL_STATUS } from "@prisma/client";
import prisma from "../../../shared/prisma";

function generateMonths(year: number, currentMonth: number) {
  const months: string[] = [];
  for (let m = 0; m <= currentMonth; m++) {
    months.push(`${year}-${String(m + 1).padStart(2, "0")}`);
  }
  return months;
}

const adminSummary = async () => {
  const totalUsers = await prisma.user.count({
    where: { role: UserRole.CUSTOMER },
  });

  const totalAgents = await prisma.user.count({
    where: { role: UserRole.DELIVERY_AGENT },
  });

  const totalParcels = await prisma.parcel.count();

  const completedParcels = await prisma.parcel.count({
    where: { status: PARCEL_STATUS.DELIVERED },
  });

  const activeParcels = await prisma.parcel.count({
    where: {
      status: {
        in: [
          PARCEL_STATUS.ASSIGNED,
          PARCEL_STATUS.PICKED_UP,
          PARCEL_STATUS.IN_TRANSIT,
        ],
      },
    },
  });

  const failedParcels = await prisma.parcel.count({
    where: { status: PARCEL_STATUS.FAILED },
  });

  const revenue = await prisma.parcel.aggregate({
    _sum: { totalAmount: true, deliveryFee: true },
  });

  return {
    users: {
      totalCustomers: totalUsers,
      totalAgents,
    },
    parcels: {
      total: totalParcels,
      active: activeParcels,
      completed: completedParcels,
      failed: failedParcels,
    },
    revenue: {
      totalAmount: revenue._sum.totalAmount ?? 0,
      totalDeliveryFee: revenue._sum.deliveryFee ?? 0,
    },
  };
};

const monthlyRevenue = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, currentMonth + 1, 0, 23, 59, 59);
  const parcels = await prisma.parcel.findMany({
    where: {
      status: PARCEL_STATUS.ASSIGNED,
      createdAt: { gte: startOfYear, lte: endOfYear },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      deliveryFee: true,
    },
  });

  const months = generateMonths(year, currentMonth).map((m) => ({
    month: m,
    totalParcel: 0,
    totalAmount: 0,
  }));
  const monthMap = new Map(months.map((m) => [m.month, m]));

  parcels.forEach((p) => {
    const key = p.createdAt.toISOString().slice(0, 7);
    const bucket = monthMap.get(key);
    if (bucket) {
      bucket.totalParcel += 1;
      bucket.totalAmount += (p.totalAmount ?? 0) + (p.deliveryFee ?? 0);
    }
  });

  return Array.from(monthMap.values());
};

const topCustomerList = async () => {
  const customers = await prisma.parcel.groupBy({
    by: ["customerId"],
    where: { customer: { role: UserRole.CUSTOMER } },
    _count: { id: true }, // total parcels
    _sum: { totalAmount: true, deliveryFee: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const userIds = customers.map((c) => c.customerId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      email: true,
      phoneNumber: true,
      createdAt: true,
    },
  });

  return customers.map((c) => {
    const user = users.find((u) => u.id === c.customerId)!;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      totalParcels: c._count.id,
      delivered: 0, // JS mapping or separate query required for conditional count
      totalSpent: (c._sum.totalAmount ?? 0) + (c._sum.deliveryFee ?? 0),
    };
  });
};

const topAgents = async (limit = 5) => {
  const agents = await prisma.parcel.groupBy({
    by: ["agentId"],
    where: {
      agent: { role: UserRole.DELIVERY_AGENT },
      status: PARCEL_STATUS.ASSIGNED,
    },
    _count: { id: true },
    _sum: { totalAmount: true, deliveryFee: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const agentIds = agents.map((a) => a.agentId!);
  const users = await prisma.user.findMany({
    where: { id: { in: agentIds } },
    select: {
      id: true,
      username: true,
      email: true,
      phoneNumber: true,
      createdAt: true,
    },
  });

  const result = agents.map((a) => {
    const user = users.find((u) => u.id === a.agentId)!;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      delivered: a._count.id,
      revenueHandled: (a._sum.totalAmount ?? 0) + (a._sum.deliveryFee ?? 0),
    };
  });

  return result;
};

export const adminAnalysisService = {
  adminSummary,
  monthlyRevenue,
  topCustomerList,
  topAgents,
};
