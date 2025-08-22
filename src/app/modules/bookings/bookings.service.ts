import { BookingStatus, DoctorBooking, Prisma, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
const intervalMinutes = 15;
const to24HourTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

const to12HourDisplay = (time24: string) => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
};

const generateTimeSlots = async (doctorId: string, date: Date) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  const bookings = await prisma.doctorBooking.findMany({
    where: {
      doctorId,
      date,
      BookingStatus: {
        notIn: [
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.REJECTED,
        ],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const slots: {
    startTime: string;
    endTime: string;
    available: boolean;
  }[] = [];

  const [startHour, startMinute] = doctor.startTime.split(":").map(Number);
  const [endHour, endMinute] = doctor.endTime.split(":").map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMinute, 0, 0);

  const current = new Date(start);

  while (current < end) {
    const slotStart = new Date(current);
    current.setMinutes(current.getMinutes() + intervalMinutes);
    const slotEnd = new Date(current);

    const startTimeStr = to24HourTime(slotStart);
    const endTimeStr = to24HourTime(slotEnd);

    const isBooked = bookings.some(
      (b) => b.startTime === startTimeStr && b.endTime === endTimeStr
    );

    slots.push({
      startTime: to12HourDisplay(startTimeStr), // or just use `startTimeStr` if you prefer 24-hour
      endTime: to12HourDisplay(endTimeStr),
      available: !isBooked,
    });
  }

  return slots;
};

const createBooking = async (data: {
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  userId: string;
}) => {
  const existingDoctor = await prisma.doctor.findUnique({
    where: { id: data.doctorId },
    select: {
      visitingPrice: true,
    },
  });

  if (!existingDoctor) {
    throw new ApiError(404, "Doctor not found");
  }
  const existingBooking = await prisma.doctorBooking.findFirst({
    where: {
      doctorId: data.doctorId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      BookingStatus: {
        notIn: ["CANCELLED", "REJECTED", "COMPLETED"],
      },
    },
  });

  if (existingBooking) {
    throw new ApiError(409, "Time slot is already booked");
  }

  const booking = await prisma.doctorBooking.create({
    data: { ...data, amount: existingDoctor.visitingPrice },
  });

  return booking;
};

const getAllBookings = async (
  query: any,
  patientId: string,
  doctorId: string
) => {
  const additionalFilter: Prisma.DoctorBookingWhereInput = {
    ...(doctorId && { doctorId }),
    ...(patientId && { patientId }),
    ...(query.status && { BookingStatus: query.status }),
  };
  return await searchAndPaginate<
    DoctorBooking,
    Prisma.DoctorBookingWhereInput,
    Prisma.DoctorBookingSelect,
    Prisma.DoctorBookingInclude,
    Prisma.DoctorBookingOrderByWithRelationInput
  >({
    model: prisma.doctorBooking,
    searchableFields: [],
    page: Number(query.page),
    limit: Number(query.limit),
    searchQuery: query.searchQuery,
    additionalFilter,
    selectFields: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      BookingStatus: true,
      doctor: {
        select: {
          id: true,
          uniqueId: true,
          avatar: true,
          username: true,
          doctor: {
            select: {
              averageRating: true,
              BMDC_No: true,
              visitingPrice: true,
              designation: true,
              specialization: true,
              experience: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          uniqueId: true,
          avatar: true,
          username: true,
        },
      },
    },
  });
};

const getSingleBooking = async (id: string) => {
  const booking = await prisma.doctorBooking.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      doctor: {
        select: {
          id: true,
          uniqueId: true,
          avatar: true,
          username: true,
          doctor: {
            select: {
              averageRating: true,
              BMDC_No: true,
              visitingPrice: true,
              designation: true,
              specialization: true,
              experience: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          uniqueId: true,
          avatar: true,
          username: true,
        },
      },
    },
  });

  if (!booking) throw new ApiError(404, "Booking not found");

  return booking;
};

const updateBooking = async (
  id: string,
  data: Partial<{ BookingStatus: BookingStatus }>,
  userRole: UserRole,
  currentUserId: string
) => {
  const booking = await prisma.doctorBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const currentStatus = booking.BookingStatus as BookingStatus;
  const newStatus = data.BookingStatus as BookingStatus;

  const isUser = booking.userId === currentUserId;
  const isDoctor = booking.doctorId === currentUserId;

  if (userRole === UserRole.PATIENT && !isUser) {
    throw new ApiError(403, "You are not allowed to update this booking");
  }

  if (userRole === UserRole.DOCTOR && !isDoctor) {
    throw new ApiError(403, "You are not allowed to update this booking");
  }

  if (
    [
      BookingStatus.CONFIRMED,
      BookingStatus.PAYMENT_SUCCESS,
      BookingStatus.COMPLETED,
    ].includes(currentStatus as any) &&
    newStatus &&
    [BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(newStatus as any)
  ) {
    throw new ApiError(
      403,
      `Cannot change status from ${currentStatus} to ${newStatus}`
    );
  }

  if (userRole === UserRole.PATIENT) {
    if (
      currentStatus !== BookingStatus.PENDING ||
      newStatus !== BookingStatus.CANCELLED
    ) {
      throw new ApiError(403, "You can only cancel your own pending bookings");
    }
  }

  const updated = await prisma.doctorBooking.update({
    where: { id },
    data,
  });

  return updated;
};

const deleteBooking = async (id: string) => {
  const booking = await prisma.doctorBooking.delete({
    where: { id },
  });

  return booking;
};

export const bookingService = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  generateTimeSlots,
};
