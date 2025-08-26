## 🛠️ Prisma Database Management

### Generating the Prisma Client

To generate the Prisma client from your schema:

### npx prisma generate --schema=./prisma/schema

### Pushing Schema Changes

To push the schema changes to the database:

## npx prisma db push --schema=./prisma/schema

To open the Prisma Studio, you can run:

### npx prisma studio --schema=./prisma/schema

### Running Migrations ( only for mysql)

To run migrations for MySQL, you can use the following command:

### npx prisma migrate dev --schema=./prisma/schema





Courier and Parcel Management System (Backend)
Overview

This backend is part of a Courier and Parcel Management System built using Node.js, Express.js, Prisma, and PostgreSQL, with real-time parcel and agent tracking via SSE (Server-Sent Events) and background job handling via BullMQ.

It supports Admin, Delivery Agent, and Customer roles, with role-based access control and OTP-based authentication.

Features
Common Features

Role-based access control (Admin, Delivery Agent, Customer)

JWT authentication

OTP verification using Brevo + BullMQ

File uploads: profile images, chat images, audio, parcel images

Real-time notifications via SSE

Customer

Register/Login

Book parcels with pickup & delivery addresses, parcel type/size, COD or prepaid

View booking history & statuses

Track parcel in real-time on a map via SSE

Delivery Agent

View assigned parcels

Update parcel status (Picked Up, In Transit, Delivered, Failed)

Optimized delivery routes (via Google Maps API)

Admin

Dashboard with parcel metrics: daily bookings, failed deliveries, COD amounts

Assign agents to parcels

View all users and bookings

Analytics APIs: summary, monthly revenue, top customers, top agents

Tech Stack

Backend: Node.js + Express.js

Database: PostgreSQL with Prisma ORM

Authentication: JWT + OTP via Brevo + BullMQ

Real-time: SSE (Server-Sent Events) for notifications and tracking

File Uploads: Multer helper (fileUploader)

Validation & Middleware: Request validation, API key middleware, role-based auth

API Endpoints

Auth

Method	Endpoint	Description

POST	/auth/login	Login user

POST	/auth/otp/send	Send OTP

POST	/auth/otp/verify	Verify OTP

PATCH	/auth/password/reset	Reset password

PATCH	/auth/me/avatar	Update profile image

GET/PATCH/DELETE	/auth/me	Get/update/delete profile


Parcel

Method	Endpoint	Roles	Description

POST	/parcel	Customer	Create parcel

GET	/parcel	All	List parcels

GET/PATCH/DELETE	/parcel/:id	Role-based	Manage single parcel

User

Method	Endpoint	Roles	Description

POST	/user	Public	Create user

GET	/user	Admin	List all users

GET/PATCH/DELETE	/user/:id	Admin	Manage single user

Admin Analytics

Method	Endpoint	Description

GET	/admin/summary	Admin dashboard summary

GET	/admin/monthly-revenue	Monthly revenue analytics

GET	/admin/top-customers	Top customers

GET	/admin/top-agents	Top delivery agents

Chat

Method	Endpoint	Description

GET	/chat/conversion-list	Conversation list

GET	/chat/get-single-message/:conversationId	Single conversation messages

POST	/chat/chat-image-upload	Upload chat image

POST	/chat/audio-upload	Upload audio file

PATCH	/chat/read-message/:conversationId	Mark messages as read