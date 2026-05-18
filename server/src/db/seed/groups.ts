import { faker } from "@faker-js/faker";
import { db } from "../db";
import { Group, GroupMembership } from "../schema";
import { seedConfig } from "./config";
import { pickSome, randomInviteCode } from "./utils";

export async function seedGroups(users: Array<{ id: number; username: string }>) {
  const groups = await db
    .insert(Group)
    .values(
      seedConfig.groups.map((name) => ({
        name,
        description: faker.lorem.sentence(),
        invite_code: randomInviteCode(),
      })),
    )
    .returning();

  const primaryUser = users.find((user) => user.username === "you") ?? users[0];

  for (const [index, group] of groups.entries()) {
    const owner = index % 3 === 0 ? primaryUser : faker.helpers.arrayElement(users);
    const members = pickSome(users, 7, 14);

    const uniqueMembers = new Map<number, "OWNER" | "MEMBER">();
    uniqueMembers.set(owner.id, "OWNER");

    if (index < 8) {
      uniqueMembers.set(primaryUser.id, uniqueMembers.get(primaryUser.id) ?? "MEMBER");
    }

    for (const member of members) {
      if (!uniqueMembers.has(member.id)) {
        uniqueMembers.set(member.id, "MEMBER");
      }
    }

    await db.insert(GroupMembership).values(
      Array.from(uniqueMembers.entries()).map(([userId, role]) => ({
        group_id: group.id,
        user_id: userId,
        role,
      })),
    );
  }

  return groups;
}