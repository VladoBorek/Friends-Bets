import { faker } from "@faker-js/faker";
import { logger } from "../observability";
import { closeConnection } from "./db";
import { seedFriendships } from "./seed/friends";
import { seedGroups } from "./seed/groups";
import { seedNotifications } from "./seed/notifications";
import { truncateAll } from "./seed/truncate";
import { seedRoles, seedUsers } from "./seed/users";
import { seedTransactions, seedWallets } from "./seed/wallet";
import { seedCategories, seedWagers } from "./seed/wagers";

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

    logger.info({
      event_name: "seed_completed",
      wager_count: createdWagers.length,
      user_count: users.length,
    });
  } catch (error) {
    logger.error({
      event_name: "seed_failed",
      error,
    });

    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();