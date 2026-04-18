import { jest } from "@jest/globals";
const prisma = {
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};
export default prisma;
