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
