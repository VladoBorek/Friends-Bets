import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userAdminService from "@server/services/user/user-admin-service";
import * as userRepository from "@server/repositories/user/user-repository";
import * as userQueryService from "@server/services/user/user-query-service";
import { emailClient } from "@server/services/email-service";
import { HttpError } from "@server/errors";
import type { UserSummary } from "@pb138/shared/schemas/user";

vi.mock("@server/repositories/user/user-repository");
vi.mock("@server/services/user/user-query-service");
vi.mock("@server/services/email-service");

describe("user-admin-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserRole", () => {
    it("successfully updates user role", async () => {
      const userId = 1;
      const roleName = "ADMIN";
      const roleId = 10;
      const mockUser: UserSummary = {
        id: userId,
        username: "test",
        email: "test@test.com",
        roleName,
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      };

      vi.mocked(userRepository.findRoleIdByName).mockResolvedValue(roleId);
      vi.mocked(userRepository.updateUserRoleById).mockResolvedValue();
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);

      const result = await userAdminService.updateUserRole(userId, roleName);

      expect(userRepository.findRoleIdByName).toHaveBeenCalledWith(roleName);
      expect(userRepository.updateUserRoleById).toHaveBeenCalledWith(userId, roleId);
      expect(result).toEqual(mockUser);
    });

    it("throws HttpError when role is not found", async () => {
      vi.mocked(userRepository.findRoleIdByName).mockResolvedValue(null);

      await expect(userAdminService.updateUserRole(1, "ADMIN")).rejects.toThrow(HttpError);
    });
  });

  describe("suspendUser", () => {
    it("successfully suspends user for hours", async () => {
      const userId = 1;
      const mockUser: UserSummary = {
        id: userId,
        username: "test",
        email: "test@test.com",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: "2026-05-21T12:00:00.000Z",
      };

      vi.mocked(userRepository.updateUserSuspension).mockResolvedValue();
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(emailClient.sendSuspensionEmail).mockResolvedValue();

      const result = await userAdminService.suspendUser(userId, 2, "hours");

      expect(userRepository.updateUserSuspension).toHaveBeenCalledWith(userId, expect.any(Date));
      expect(emailClient.sendSuspensionEmail).toHaveBeenCalledWith({
        email: mockUser.email,
        username: mockUser.username,
        suspendedUntilIso: mockUser.suspendedUntil as string,
      });
      expect(result).toEqual(mockUser);
    });

    it("successfully suspends user for days", async () => {
      const userId = 1;
      const mockUser: UserSummary = {
        id: userId,
        username: "test",
        email: "test@test.com",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      };
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);

      await userAdminService.suspendUser(userId, 5, "days");

      expect(userRepository.updateUserSuspension).toHaveBeenCalledWith(userId, expect.any(Date));
    });

    it("successfully suspends user for months", async () => {
      const userId = 1;
      const mockUser: UserSummary = {
        id: userId,
        username: "test",
        email: "test@test.com",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      };
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);

      await userAdminService.suspendUser(userId, 1, "months");

      expect(userRepository.updateUserSuspension).toHaveBeenCalledWith(userId, expect.any(Date));
    });
  });

  describe("unsuspendUser", () => {
    it("successfully unsuspends user", async () => {
      const userId = 1;
      const mockUser: UserSummary = {
        id: userId,
        username: "test",
        email: "test@test.com",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      };

      vi.mocked(userRepository.updateUserSuspension).mockResolvedValue();
      vi.mocked(userQueryService.getUserById).mockResolvedValue(mockUser);

      const result = await userAdminService.unsuspendUser(userId);

      expect(userRepository.updateUserSuspension).toHaveBeenCalledWith(userId, null);
      expect(result).toEqual(mockUser);
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes user", async () => {
      const userId = 1;
      vi.mocked(userRepository.deleteUserById).mockResolvedValue();

      await userAdminService.deleteUser(userId);

      expect(userRepository.deleteUserById).toHaveBeenCalledWith(userId);
    });
  });
});
