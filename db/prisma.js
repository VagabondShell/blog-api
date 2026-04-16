// lib/prisma.js
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Setup the standard Postgres connection pool using your .env URL
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Create the Prisma Client instance
const prisma = new PrismaClient({ adapter });

// 4. Export it so the rest of your app can use it
export default prisma;
