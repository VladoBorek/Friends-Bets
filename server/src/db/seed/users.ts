import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { db } from "../db";
import { Role, User } from "../schema";
import { seedConfig } from "./config";
import { normalizeUsername } from "./utils";

export async function seedRoles() {
  const inserted = await db.insert(Role).values(seedConfig.roles.map((name) => ({ name }))).returning();

  return {
    all: inserted,
    userRoleId: inserted.find((role) => role.name === "User")?.id ?? inserted[0].id,
    adminRoleId: inserted.find((role) => role.name === "Admin")?.id ?? inserted[0].id,
  };
}

export async function seedUsers(userRoleId: number, adminRoleId: number) {
  const adminUsernames = new Set(["you", "sarah"]);
  const nonVerifiedUsernames = new Set(["richard"]);
  const defaultUserPassword = "UserPass123!";
  const defaultAdminPassword = "AdminPass123!";

  const rows = await Promise.all(
    seedConfig.users.map(async (name) => {
      const username = normalizeUsername(name);
      const isAdmin = adminUsernames.has(username);
      const isVerified = !nonVerifiedUsernames.has(username);
      const plainPassword = isAdmin ? defaultAdminPassword : defaultUserPassword;
      const email = username === "richard" ? "risac13@seznam.cz" : `${username}@midnight-wager.club`;

      return {
        username,
        email,
        password_hash: await bcrypt.hash(plainPassword, 10),
        avatar_url: faker.image.avatar(),
        role_id: isAdmin ? adminRoleId : userRoleId,
        is_verified: isVerified,
      };
    }),
  );

  return db.insert(User).values(rows).returning();
}