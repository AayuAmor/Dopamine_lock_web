const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.DOTENV_CONFIG_QUIET = "true";
process.env.JWT_SECRET = "jest-test-secret";
process.env.JWT_EXPIRES_IN = "1h";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../src/config/prisma", () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
}));

const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");
const app = require("../server");

const baseUser = {
  id: 1,
  fullName: "Test Operator",
  email: "operator@example.com",
  passwordHash: "hashed-password",
  role: "user",
  avatarUrl: null,
  bio: null,
  timezone: "Asia/Kathmandu",
  dailyFocusGoal: 4,
  preferredMissionDuration: 50,
  disciplineTitle: "DISCIPLINED BUILDER",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Backend API authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue("hashed-password");
    bcrypt.compare.mockResolvedValue(true);
  });

  test("health endpoint returns success", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("user registration succeeds with valid data", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(baseUser);

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Test Operator",
      email: "operator@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: baseUser.id,
      fullName: baseUser.fullName,
      email: baseUser.email,
    });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Test Operator",
        email: "operator@example.com",
        passwordHash: "hashed-password",
      },
    });
  });

  test("duplicate email registration is rejected", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: baseUser.id });

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Test Operator",
      email: "operator@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("registration fails when full name is missing", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "operator@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/full name is required/i);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("registration fails when email is missing", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Test Operator",
      password: "secret123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/email and password are required/i);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("registration fails when password is missing", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Test Operator",
      email: "operator@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/email and password are required/i);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("login succeeds with valid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue(baseUser);
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "operator@example.com", password: "secret123" });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: baseUser.id,
      email: baseUser.email,
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "secret123",
      baseUser.passwordHash,
    );
  });

  test("login fails with invalid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue(baseUser);
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "operator@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid email or password/i);
  });

  test("protected route rejects requests without token", async () => {
    const response = await request(app).get("/api/profile");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/authentication token is required/i);
  });

  test("protected auth/me route accepts a valid token", async () => {
    prisma.user.findUnique.mockResolvedValue(baseUser);
    const token = jwt.sign(
      { userId: baseUser.id, email: baseUser.email, role: baseUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: baseUser.id,
      fullName: baseUser.fullName,
      email: baseUser.email,
    });
  });
});
