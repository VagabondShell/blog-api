import { jest } from "@jest/globals";

// 1. Tell Jest to mock Prisma using the ESM method BEFORE anything else loads
jest.unstable_mockModule("../db/prisma.js", () => ({
  default: {
    post: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// 2. Dynamically import everything else AFTER the mock is in place
const { default: request } = await import("supertest");
const { default: express } = await import("express");

// ---> UPDATE THIS PATH TO MATCH YOUR ACTUAL ROUTER FILE <---
const { default: router } = await import("../routes/indexRouter.js");

const app = express();
app.use(express.json());
app.use("/", router);

describe("GET /posts", () => {
  it("should return an empty array when no posts exist", async () => {
    const res = await request(app).get("/posts");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });
});
