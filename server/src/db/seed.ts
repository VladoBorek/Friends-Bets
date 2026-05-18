import { faker } from "@faker-js/faker";
import { closeConnection } from "./db";
import { truncateAll } from "./seed/truncate";
import { seedRoles, seedUsers } from "./seed/users";
import { seedCategories, seedWagers } from "./seed/wagers";
import { seedGroups } from "./seed/groups";
import { seedWallets, seedTransactions } from "./seed/wallet";
import { seedNotifications } from "./seed/notifications";
import { seedFriendships } from "./seed/friends";

async function main() {
  try {
    faker.seed(138);

    await truncateAll();

    const roles = await seedRoles();
    const users = await seedUsers(roles.userRoleId, roles.adminRoleId);
    const categories = await seedCategories();
    const groups = await seedGroups(users);
    const wallets = await seedWallets(users);
    const createdWagers = await seedWagers({ users, categories, groups });

    await seedNotifications(users);
    await seedTransactions({ userWallets: wallets.userWallets });
    await seedFriendships(users);

    console.log(`Seed completed successfully. Wagers: ${createdWagers.length}, Users: ${users.length}`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();