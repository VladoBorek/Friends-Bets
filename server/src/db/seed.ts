import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { closeConnection, db } from "./db";
import {
	Bet,
	Category,
	Comment,
	Group,
	GroupMembership,
	Notification,
	Outcome,
	Role,
	Transaction,
	User,
	Wallet,
	Wager,
	WagerVisibility,
	Friendship
} from "./schema";
import bcrypt from "bcrypt";

const config = {
  users: [
    "You", "Sarah", "Mike", "Joe", "Dave", "Pete", "Lisa", "Tom", "Anna", "Greg",
    "Kate", "Sam", "Richard", "Nina", "Vlado", "Erik", "Martin", "Lucia", "Oliver",
    "Tereza", "Adam", "Monika", "Jakub", "Marek", "Sofia", "Daniel", "Laura",
    "Filip", "Emma", "Patrik", "Eva", "Roman", "Veronika", "Simon", "Barbora",
  ],
  groups: [
    "Dev Squad",
    "The Office Crew",
    "Work Buddies",
    "College Friends",
    "Game Night",
    "Football Picks",
    "Movie Night Market",
    "Study Hall Bets",
    "Weekend Warriors",
    "Startup Sidequests",
    "Fantasy League",
    "Roommate Challenges",
  ],
  categories: ["Challenges", "Versus", "Predictions", "Sports", "Entertainment", "School", "Work"],
  roles: ["Admin", "User", "Moderator"],
};

// type SeedParticipant = {
// 	name: string;
// 	amount: string;
// 	outcome: string;
// };

// type SeedWager = {
// 	title: string;
// 	group: string;
// 	category: string;
// 	pool: string;
// 	status: "OPEN" | "PENDING" | "CLOSED";
// 	outcomes: string[];
// 	participants: SeedParticipant[];
// 	description: string;
// };

// const wagerTemplates: SeedWager[] = [
// 	{
// 		title: "Will Richard finish his coding project by midnight?",
// 		group: "Dev Squad",
// 		category: "Challenges",
// 		pool: "120",
// 		status: "OPEN",
// 		description: "Office challenge wager from the dashboard watchlist.",
// 		outcomes: ["Yes", "No", "Needs Extension"],
// 		participants: [
// 			{ name: "Lisa", amount: "30", outcome: "Yes" },
// 			{ name: "Sarah", amount: "25", outcome: "No" },
// 			{ name: "Mike", amount: "40", outcome: "Yes" },
// 			{ name: "Joe", amount: "25", outcome: "Needs Extension" },
// 		],
// 	},
// 	{
// 		title: "Dave vs. Pete: 5km Run Winner",
// 		group: "The Office Crew",
// 		category: "Versus",
// 		pool: "200",
// 		status: "OPEN",
// 		description: "Head-to-head office run challenge.",
// 		outcomes: ["Dave", "Pete", "Both DNF"],
// 		participants: [
// 			{ name: "Mike", amount: "50", outcome: "Dave" },
// 			{ name: "Lisa", amount: "50", outcome: "Pete" },
// 			{ name: "Tom", amount: "50", outcome: "Dave" },
// 			{ name: "Anna", amount: "50", outcome: "Pete" },
// 		],
// 	},
// 	{
// 		title: "How many pizzas will the team order tonight?",
// 		group: "Work Buddies",
// 		category: "Predictions",
// 		pool: "85",
// 		status: "OPEN",
// 		description: "Team dinner prediction market.",
// 		outcomes: ["1-3", "4-6", "7+"],
// 		participants: [
// 			{ name: "Greg", amount: "20", outcome: "4-6" },
// 			{ name: "Tom", amount: "25", outcome: "7+" },
// 			{ name: "Kate", amount: "20", outcome: "4-6" },
// 			{ name: "Sam", amount: "20", outcome: "1-3" },
// 		],
// 	},
// 	{
// 		title: "Will Sarah pass her driving test on the first try?",
// 		group: "College Friends",
// 		category: "Challenges",
// 		pool: "180",
// 		status: "PENDING",
// 		description: "Friends challenge with pending outcome.",
// 		outcomes: ["Yes", "No"],
// 		participants: [
// 			{ name: "You", amount: "40", outcome: "Yes" },
// 			{ name: "Dave", amount: "50", outcome: "No" },
// 			{ name: "Pete", amount: "40", outcome: "Yes" },
// 			{ name: "Joe", amount: "50", outcome: "No" },
// 		],
// 	},
// 	{
// 		title: "Will Joe actually go to the gym this week?",
// 		group: "Dev Squad",
// 		category: "Challenges",
// 		pool: "90",
// 		status: "CLOSED",
// 		description: "Resolved social commitment challenge.",
// 		outcomes: ["Yes", "No"],
// 		participants: [
// 			{ name: "You", amount: "20", outcome: "No" },
// 			{ name: "Mike", amount: "30", outcome: "No" },
// 			{ name: "Sarah", amount: "20", outcome: "Yes" },
// 			{ name: "Richard", amount: "20", outcome: "Yes" },
// 		],
// 	},
// ];

function normalizeUsername(name: string): string {
	return name.toLowerCase().replace(/\s+/g, "-");
}

function randomInviteCode(): string {
	return faker.string.alphanumeric({ length: 8, casing: "upper" });
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

function pickSome<T>(items: T[], min: number, max: number): T[] {
  return faker.helpers.arrayElements(items, {
    min: Math.min(min, items.length),
    max: Math.min(max, items.length),
  });
}

function buildGroupWagerTitle(groupName: string, categoryName: string): string {
  const titlesByCategory: Record<string, string[]> = {
    Challenges: [
      "Will the team finish the task before Friday?",
      "Will anyone keep the weekly habit streak?",
      "Will the bug count stay under five?",
      "Will the challenge be completed without extensions?",
    ],
    Versus: [
      "Head-to-head: who wins the rematch?",
      "Who gets the better score this week?",
      "Which side finishes first?",
      "Who takes the final round?",
    ],
    Predictions: [
      "How many people show up on time?",
      "Will the plan change before the weekend?",
      "Will the final result beat expectations?",
      "How many tasks get closed today?",
    ],
    Sports: [
      "Will the home team win?",
      "Total goals over or under 2.5?",
      "Who wins the weekend match?",
      "Will the favorite cover the spread?",
    ],
    Entertainment: [
      "Which movie wins movie night?",
      "Will the finale be rated above 8/10?",
      "Who wins the trivia round?",
      "Will the game night run past midnight?",
    ],
    School: [
      "Will the assignment be submitted before noon?",
      "Will the exam average be above 75 percent?",
      "Will the presentation finish under time?",
      "Will the project demo pass first try?",
    ],
    Work: [
      "Will the sprint goal be reached?",
      "Will the meeting end early?",
      "Will production stay incident-free?",
      "Will the release happen today?",
    ],
  };

  return `${groupName}: ${faker.helpers.arrayElement(titlesByCategory[categoryName] ?? titlesByCategory.Predictions)}`;
}

function buildOutcomes(categoryName: string): string[] {
  if (categoryName === "Versus") return ["Team A", "Team B"];
  if (categoryName === "Sports") return ["Home Win", "Draw", "Away Win"];
  if (categoryName === "Entertainment") return ["Yes", "No", "Surprise Result"];
  return ["Yes", "No"];
}

async function truncateAll() {
	await db.delete(Bet);
	await db.delete(Transaction);
	await db.delete(Comment);
	await db.delete(Notification);
	await db.delete(WagerVisibility);
	await db.delete(Outcome);
	await db.delete(Wager);
	await db.delete(GroupMembership);
	await db.delete(Friendship);
	await db.delete(Wallet);
	await db.delete(Group);
	await db.delete(User);
	await db.delete(Category);
	await db.delete(Role);
}

async function seedRoles() {
	const inserted = await db.insert(Role).values(config.roles.map((name) => ({ name }))).returning();
	return {
		all: inserted,
		userRoleId: inserted.find((r) => r.name === "User")?.id ?? inserted[0].id,
		adminRoleId: inserted.find((r) => r.name === "Admin")?.id ?? inserted[0].id,
	};
}

async function seedUsers(userRoleId: number, adminRoleId: number) {
	// Make a deterministic set of test credentials so contributors can log in easily.
	// Choose a small set of admin accounts and the rest are normal users.
	const adminUsernames = new Set(["you", "sarah"]);
	const nonVerifiedUsernames = new Set(["richard"]);
	const defaultUserPassword = "UserPass123!"; // easy, non-secret test password
	const defaultAdminPassword = "AdminPass123!"; // admin test password

	const rows = await Promise.all(
		config.users.map(async (name) => {
			const username = normalizeUsername(name);
			const isAdmin = adminUsernames.has(username);
			const isVerified = !nonVerifiedUsernames.has(username);
			const plainPassword = isAdmin ? defaultAdminPassword : defaultUserPassword;
			// Hash the password using bcrypt for secure storage
			const passwordHash = await bcrypt.hash(plainPassword, 10);
			const email = username === "richard" ? "risac13@seznam.cz" : `${username}@midnight-wager.club`;
			return {
				username,
				email,
				password_hash: passwordHash,
				avatar_url: faker.image.avatar(),
				role_id: isAdmin ? adminRoleId : userRoleId,
				is_verified: isVerified,
			};
		}),
	);

	const inserted = await db.insert(User).values(rows).returning();

	// Log the plain credentials so operators running the seed can see them in console.
	console.log("Seeded test users (email:password):");
	for (const name of config.users) {
		const username = normalizeUsername(name);
		const isAdmin = adminUsernames.has(username);
		const pwd = isAdmin ? defaultAdminPassword : defaultUserPassword;
		const email = username === "richard" ? "risac13@seznam.cz" : `${username}@midnight-wager.club`;
		const verificationLabel = nonVerifiedUsernames.has(username) ? "(non-verified)" : "(verified)";
		console.log(`- ${email} : ${pwd} ${isAdmin ? "(admin)" : ""} ${verificationLabel}`);
	}

	return inserted;
}

async function seedWallets(users: Array<{ id: number; username: string }>) {
	const userWallets = await db
		.insert(Wallet)
		.values(
			users.map((user) => ({
				user_id: user.id,
				balance: faker.number.int({ min: 200, max: 2500 }).toString(),
			})),
		)
		.returning();

	return { userWallets };
}

async function seedCategories() {
	return db.insert(Category).values(config.categories.map((name) => ({ name }))).returning();
}

async function seedGroups(users: Array<{ id: number; username: string }>) {
  const groups = await db
    .insert(Group)
    .values(
      config.groups.map((name) => ({
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

async function seedWagers(params: {
  users: Array<{ id: number; username: string }>;
  categories: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
}) {
  const createdWagers: Array<{ id: number; status: string }> = [];

  for (const group of params.groups) {
    const memberships = await db
      .select({
        userId: GroupMembership.user_id,
      })
      .from(GroupMembership)
      .where(eq(GroupMembership.group_id, group.id));

    const memberIds = memberships.map((membership) => membership.userId);
    const groupUsers = params.users.filter((user) => memberIds.includes(user.id));

    if (groupUsers.length < 2) continue;

    const wagerCount = faker.number.int({ min: 5, max: 9 });

    for (let index = 0; index < wagerCount; index += 1) {
      const category = faker.helpers.arrayElement(params.categories);
      const status = faker.helpers.weightedArrayElement([
        { weight: 5, value: "OPEN" as const },
        { weight: 2, value: "PENDING" as const },
        { weight: 4, value: "CLOSED" as const },
      ]);
      const outcomes = buildOutcomes(category.name);
      const creator = faker.helpers.arrayElement(groupUsers);

      const [wager] = await db
        .insert(Wager)
        .values({
          title: buildGroupWagerTitle(group.name, category.name),
          description: faker.lorem.sentences({ min: 1, max: 2 }),
          status,
          category_id: category.id,
          created_by_id: creator.id,
          group_id: group.id,
          is_public: false,
          pool: "0",
          created_at: faker.date.recent({ days: 45 }),
        })
        .returning();

      createdWagers.push({ id: wager.id, status });

      const winningIndex = status === "CLOSED" ? faker.number.int({ min: 0, max: outcomes.length - 1 }) : -1;

      const outcomeRows = await db
        .insert(Outcome)
        .values(
          outcomes.map((title, outcomeIndex) => ({
            wager_id: wager.id,
            title,
            is_winner: outcomeIndex === winningIndex,
          })),
        )
        .returning();

      const bettors = pickSome(groupUsers, Math.min(3, groupUsers.length), Math.min(9, groupUsers.length));
      let pool = 0;

      for (const bettor of bettors) {
        const outcome = faker.helpers.arrayElement(outcomeRows);
        const amount = faker.number.int({ min: 10, max: 120 });
        pool += amount;

        await db.insert(Bet).values({
          user_id: bettor.id,
          outcome_id: outcome.id,
          amount: toMoney(amount),
          created_at: faker.date.recent({ days: 30 }),
        });
      }

      await db.update(Wager).set({ pool: toMoney(pool) }).where(eq(Wager.id, wager.id));

      await db.insert(WagerVisibility).values(
        groupUsers.map((user) => ({
          wager_id: wager.id,
          user_id: user.id,
        })),
      );

      const commenters = pickSome(groupUsers, 1, Math.min(4, groupUsers.length));
      await db.insert(Comment).values(
        commenters.map((user) => ({
          wager_id: wager.id,
          user_id: user.id,
          content: faker.helpers.arrayElement([
            "I like these odds.",
            "This one feels risky.",
            "No way this goes as expected.",
            "Easy pick.",
            "I am only joining for the chaos.",
            "This will be close.",
          ]),
          created_at: faker.date.recent({ days: 20 }),
        })),
      );
    }
  }

  return createdWagers;
}

// async function seedVisibilityAndComments(params: {
// 	createdWagers: Array<{ id: number; template: SeedWager }>;
// 	groups: Array<{ id: number; name: string }>;
// }) {
// 	for (const created of params.createdWagers) {
// 		const group = params.groups.find((g) => g.name === created.template.group);
// 		if (!group) continue;

// 		const members = await db
// 			.select()
// 			.from(GroupMembership)
// 			.where(eq(GroupMembership.group_id, group.id));

// 		if (members.length > 0) {
// 			await db.insert(WagerVisibility).values(
// 				members.map((member) => ({
// 					wager_id: created.id,
// 					user_id: member.user_id,
// 				})),
// 			);
// 		}

// 		const comments = faker.helpers.arrayElements(members, { min: 2, max: Math.min(4, members.length) });
// 		if (comments.length > 0) {
// 			await db.insert(Comment).values(
// 				comments.map((member) => ({
// 					wager_id: created.id,
// 					user_id: member.user_id,
// 					content: faker.lorem.sentences({ min: 1, max: 2 }),
// 				})),
// 			);
// 		}
// 	}
// }

async function seedNotifications(users: Array<{ id: number }>) {
	await db.insert(Notification).values(
		users.map((user) => ({
			user_id: user.id,
			message: faker.helpers.arrayElement([
				"A wager you follow changed status.",
				"A friend invited you to a new wager.",
				"Payout was processed to your wallet.",
			]),
			type: faker.helpers.arrayElement(["system", "invite", "payout"]),
			is_read: faker.datatype.boolean(0.2),
		})),
	);
}

async function seedTransactions(params: {
  userWallets: Array<{ id: number; user_id: number | null }>;
}) {
  const walletByUserId = new Map(
    params.userWallets
      .filter((wallet): wallet is { id: number; user_id: number } => wallet.user_id !== null)
      .map((wallet) => [wallet.user_id, wallet.id]),
  );

  const seededBets = await db
    .select({
      id: Bet.id,
      userId: Bet.user_id,
      outcomeId: Bet.outcome_id,
      amount: Bet.amount,
      wagerId: Outcome.wager_id,
      isWinner: Outcome.is_winner,
      wagerStatus: Wager.status,
    })
    .from(Bet)
    .innerJoin(Outcome, eq(Outcome.id, Bet.outcome_id))
    .innerJoin(Wager, eq(Wager.id, Outcome.wager_id));

  const transactions: Array<{
    wallet_id: number;
    outcome_id: number;
    type: "bet" | "payout";
    amount: string;
    created_at: Date;
  }> = [];

  for (const bet of seededBets) {
    const walletId = walletByUserId.get(bet.userId);
    if (!walletId) continue;

    transactions.push({
      wallet_id: walletId,
      outcome_id: bet.outcomeId,
      type: "bet",
      amount: toMoney(-Number(bet.amount ?? "0")),
      created_at: faker.date.recent({ days: 30 }),
    });
  }

  const closedWagerIds = [...new Set(
    seededBets
      .filter((bet) => bet.wagerStatus === "CLOSED")
      .map((bet) => bet.wagerId),
  )];

  for (const wagerId of closedWagerIds) {
    const wagerBets = seededBets.filter((bet) => bet.wagerId === wagerId);
    const winningBets = wagerBets.filter((bet) => bet.isWinner);

    const totalPool = wagerBets.reduce((sumValue, bet) => sumValue + Number(bet.amount ?? "0"), 0);
    const winningPool = winningBets.reduce((sumValue, bet) => sumValue + Number(bet.amount ?? "0"), 0);

    if (winningPool <= 0 || totalPool <= 0) continue;

    for (const bet of winningBets) {
      const walletId = walletByUserId.get(bet.userId);
      if (!walletId) continue;

      const stake = Number(bet.amount ?? "0");
      const payout = (totalPool * stake) / winningPool;

      transactions.push({
        wallet_id: walletId,
        outcome_id: bet.outcomeId,
        type: "payout",
        amount: toMoney(payout),
        created_at: faker.date.recent({ days: 10 }),
      });
    }
  }

  if (transactions.length > 0) {
    await db.insert(Transaction).values(transactions);
  }
}

async function seedFriendships(users: Array<{ id: number }>) {
  const primaryUser = users[0];
  const otherUsers = users.slice(1);

  const acceptedRows = otherUsers.slice(0, 16).map((user) => ({
    requester_id: primaryUser.id,
    addressee_id: user.id,
    status: "ACCEPTED",
    responded_at: new Date(),
  }));

  const incomingRows = otherUsers.slice(16, 22).map((user) => ({
    requester_id: user.id,
    addressee_id: primaryUser.id,
    status: "PENDING",
  }));

  const outgoingRows = otherUsers.slice(22, 28).map((user) => ({
    requester_id: primaryUser.id,
    addressee_id: user.id,
    status: "PENDING",
  }));

  const rows = [...acceptedRows, ...incomingRows, ...outgoingRows];

  if (rows.length > 0) {
    await db.insert(Friendship).values(rows);
  }
}

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

		//await seedVisibilityAndComments({ createdWagers, groups });
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
