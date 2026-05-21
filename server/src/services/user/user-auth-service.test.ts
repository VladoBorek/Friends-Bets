import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userAuthService from "./user-auth-service";
import * as userRepository from "../../repositories/user/user-repository";
import * as userQueryService from "./user-query-service";
import { emailClient } from "../email-service";
import { HttpError } from "../../errors";
import bcrypt from "bcrypt";
import type { UserSummary } from "@pb138/shared/schemas/user";

vi.mock("../../repositories/user/user-repository");
vi.mock("./user-query-service");
vi.mock("../email-service");
vi.mock("bcrypt");
vi.mock("../../config", () => ({
  readServerConfig: () => ({
    email: { enabled: true },
    secrets: { emailVerification: "secret", passwordReset: "secret" },
    urls: { client: "http://localhost:5173" }
  }),
}));

describe("user-auth-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    const mockInput = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    it("successfully creates a new user", async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.findRoleIdByName).mockResolvedValue(1);
      vi.mocked(bcrypt.hash).mockImplementation(async () => "hashed_password");
      vi.mocked(userRepository.createUserWithWallet).mockResolvedValue(100);
      vi.mocked(userQueryService.getUserById).mockResolvedValue({
        id: 100,
        username: mockInput.username,
        email: mockInput.email,
        roleName: "USER",
        isVerified: false,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      });

      const result = await userAuthService.createUser(mockInput);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(mockInput.email);
      expect(userRepository.createUserWithWallet).toHaveBeenCalled();
      expect(emailClient.sendRegistrationEmail).toHaveBeenCalled();
      expect(result.username).toBe(mockInput.username);
    });

    it("throws HttpError if email is already in use", async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
        id: 1,
        email: mockInput.email,
        username: "existing",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date(),
        suspendedUntil: null,
      });

      await expect(userAuthService.createUser(mockInput)).rejects.toThrow(HttpError);
    });
  });

  describe("getUserByCredentials", () => {
    const mockLogin = { email: "test@example.com", password: "password123" };

    it("successfully returns user with valid credentials", async () => {
      vi.mocked(userRepository.findUserWithPasswordByEmail).mockResolvedValue({
        id: 1,
        username: "test",
        email: mockLogin.email,
        passwordHash: "hashed",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date(),
        suspendedUntil: null,
      });
      vi.mocked(bcrypt.compare).mockImplementation(async () => true);

      const result = await userAuthService.getUserByCredentials(mockLogin);

      expect(result.email).toBe(mockLogin.email);
    });

    it("throws HttpError with invalid password", async () => {
      vi.mocked(userRepository.findUserWithPasswordByEmail).mockResolvedValue({
        id: 1,
        username: "test",
        email: mockLogin.email,
        passwordHash: "hashed",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date(),
        suspendedUntil: null,
      });
      vi.mocked(bcrypt.compare).mockImplementation(async () => false);

      await expect(userAuthService.getUserByCredentials(mockLogin)).rejects.toThrow(HttpError);
    });
  });

  describe("resendVerificationEmail", () => {
    it("successfully resends verification email", async () => {
      const mockUser: UserSummary = {
        id: 1,
        username: "test",
        email: "test@test.com",
        isVerified: false,
        roleName: "USER",
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      };
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);

      await userAuthService.resendVerificationEmail(1);

      expect(emailClient.sendVerificationReminderEmail).toHaveBeenCalled();
    });

    it("throws if user is already verified", async () => {
      const mockUser: UserSummary = {
        id: 1,
        username: "test",
        email: "test@test.com",
        isVerified: true,
        roleName: "USER",
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      };
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);

      await expect(userAuthService.resendVerificationEmail(1)).rejects.toThrow(HttpError);
    });
  });
});
