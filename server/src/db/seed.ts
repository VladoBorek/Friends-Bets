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
} from "./schema";
import bcrypt from "bcrypt";

const config = {
	users: ["You", "Sarah", "Mike", "Joe", "Dave", "Pete", "Lisa", "Tom", "Anna", "Greg", "Kate", "Sam", "Richard"],
	groups: ["Dev Squad", "The Office Crew", "Work Buddies", "College Friends", "Game Night"],
	categories: ["Challenges", "Versus", "Predictions"],
	roles: ["Admin", "User", "Moderator"],
};

type SeedParticipant = {
	name: string;
	amount: string;
	outcome: string;
};

type SeedWager = {
	title: string;
	group: string;
	category: string;
	pool: string;
	status: "OPEN" | "PENDING" | "CLOSED";
	outcomes: string[];
	outcomeSplit: number[];
	participants: SeedParticipant[];
	description: string;
};

const wagerTemplates: SeedWager[] = [
	{
		title: "Will Richard finish his coding project by midnight?",
		group: "Dev Squad",
		category: "Challenges",
		pool: "120",
		status: "OPEN",
		description: "Office challenge wager from the dashboard watchlist.",
		outcomes: ["Yes", "No", "Needs Extension"],
		outcomeSplit: [55, 30, 15],
		participants: [
			{ name: "Lisa", amount: "30", outcome: "Yes" },
			{ name: "Sarah", amount: "25", outcome: "No" },
			{ name: "Mike", amount: "40", outcome: "Yes" },
			{ name: "Joe", amount: "25", outcome: "Needs Extension" },
		],
	},
	{
		title: "Dave vs. Pete: 5km Run Winner",
		group: "The Office Crew",
		category: "Versus",
		pool: "200",
		status: "OPEN",
		description: "Head-to-head office run challenge.",
		outcomes: ["Dave", "Pete", "Both DNF"],
		outcomeSplit: [45, 45, 10],
		participants: [
			{ name: "Mike", amount: "50", outcome: "Dave" },
			{ name: "Lisa", amount: "50", outcome: "Pete" },
			{ name: "Tom", amount: "50", outcome: "Dave" },
			{ name: "Anna", amount: "50", outcome: "Pete" },
		],
	},
	{
		title: "How many pizzas will the team order tonight?",
		group: "Work Buddies",
		category: "Predictions",
		pool: "85",
		status: "OPEN",
		description: "Team dinner prediction market.",
		outcomes: ["1-3", "4-6", "7+"],
		outcomeSplit: [20, 50, 30],
		participants: [
			{ name: "Greg", amount: "20", outcome: "4-6" },
			{ name: "Tom", amount: "25", outcome: "7+" },
			{ name: "Kate", amount: "20", outcome: "4-6" },
			{ name: "Sam", amount: "20", outcome: "1-3" },
		],
	},
	{
		title: "Will Sarah pass her driving test on the first try?",
		group: "College Friends",
		category: "Challenges",
		pool: "180",
		status: "PENDING",
		description: "Friends challenge with pending outcome.",
		outcomes: ["Yes", "No"],
		outcomeSplit: [60, 40],
		participants: [
			{ name: "You", amount: "40", outcome: "Yes" },
			{ name: "Dave", amount: "50", outcome: "No" },
			{ name: "Pete", amount: "40", outcome: "Yes" },
			{ name: "Joe", amount: "50", outcome: "No" },
		],
	},
	{
		title: "Will Joe actually go to the gym this week?",
		group: "Dev Squad",
		category: "Challenges",
		pool: "90",
		status: "CLOSED",
		description: "Resolved social commitment challenge.",
		outcomes: ["Yes", "No"],
		outcomeSplit: [30, 70],
		participants: [
			{ name: "You", amount: "20", outcome: "No" },
			{ name: "Mike", amount: "30", outcome: "No" },
			{ name: "Sarah", amount: "20", outcome: "Yes" },
			{ name: "Richard", amount: "20", outcome: "Yes" },
		],
	},
];

function normalizeUsername(name: string): string {
	return name.toLowerCase().replace(/\s+/g, "-");
}

function randomOdds(): string {
	return faker.number.float({ min: 1.2, max: 4.8, fractionDigits: 2 }).toFixed(2);
}

function randomInviteCode(): string {
	return faker.string.alphanumeric({ length: 8, casing: "upper" });
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
			// Hash the password using Bun's password utilities to match production verification
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

	const [houseWallet] = await db
		.insert(Wallet)
		.values({
			user_id: null,
			balance: "100000",
		})
		.returning();

	return { userWallets, houseWallet };
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

	for (const group of groups) {
		const owner = faker.helpers.arrayElement(users);
		const members = faker.helpers.arrayElements(users, { min: 4, max: 8 });

		const uniqueMembers = new Map<number, "OWNER" | "MEMBER">();
		uniqueMembers.set(owner.id, "OWNER");
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

function buildOutcomeSplit(outcomes: string[]): number[] {
	const raw = outcomes.map(() => faker.number.int({ min: 10, max: 60 }));
	const total = raw.reduce((sum, current) => sum + current, 0);
	const percentages = raw.map((value) => Math.round((value / total) * 100));
	const diff = 100 - percentages.reduce((sum, current) => sum + current, 0);
	percentages[0] = percentages[0] + diff;
	return percentages;
}

async function seedWagers(params: {
	users: Array<{ id: number; username: string }>;
	categories: Array<{ id: number; name: string }>;
	groups: Array<{ id: number; name: string }>;
}) {
	const userByName = new Map(params.users.map((u) => [u.username, u]));
	const categoryByName = new Map(params.categories.map((c) => [c.name, c]));
	const groupByName = new Map(params.groups.map((g) => [g.name, g]));

	const createdWagers: Array<{ id: number; template: SeedWager }> = [];

	for (const template of wagerTemplates) {
		const createdBy = faker.helpers.arrayElement(params.users);
		const category = categoryByName.get(template.category) ?? params.categories[0];
		const group = groupByName.get(template.group) ?? params.groups[0];
		const split = template.outcomeSplit.length === template.outcomes.length
			? template.outcomeSplit
			: buildOutcomeSplit(template.outcomes);

		const [wager] = await db
			.insert(Wager)
			.values({
				title: template.title,
				description: template.description,
				status: template.status,
				category_id: category.id,
				created_by_id: createdBy.id,
				is_public: true,
				pool: template.pool,
				group: group.name,
				outcomeSplit: split,
			})
			.returning();

		createdWagers.push({ id: wager.id, template });

		const outcomeRows = await db
			.insert(Outcome)
			.values(
				template.outcomes.map((title, index) => ({
					wager_id: wager.id,
					title,
					odds: randomOdds(),
					is_winner: template.status === "CLOSED" ? index === 0 : false,
				})),
			)
			.returning();

		const outcomeByTitle = new Map(outcomeRows.map((row) => [row.title, row]));

		for (const participant of template.participants) {
			const username = normalizeUsername(participant.name);
			const user = userByName.get(username);
			const outcome = outcomeByTitle.get(participant.outcome);
			if (!user || !outcome) continue;

			await db.insert(Bet).values({
				user_id: user.id,
				wager_id: wager.id,
				outcome_id: outcome.id,
				amount: participant.amount,
			});
		}
	}

	return createdWagers;
}

async function seedVisibilityAndComments(params: {
	createdWagers: Array<{ id: number; template: SeedWager }>;
	groups: Array<{ id: number; name: string }>;
}) {
	for (const created of params.createdWagers) {
		const group = params.groups.find((g) => g.name === created.template.group);
		if (!group) continue;

		const members = await db
			.select()
			.from(GroupMembership)
			.where(eq(GroupMembership.group_id, group.id));

		if (members.length > 0) {
			await db.insert(WagerVisibility).values(
				members.map((member) => ({
					wager_id: created.id,
					user_id: member.user_id,
				})),
			);
		}

		const comments = faker.helpers.arrayElements(members, { min: 2, max: Math.min(4, members.length) });
		if (comments.length > 0) {
			await db.insert(Comment).values(
				comments.map((member) => ({
					wager_id: created.id,
					user_id: member.user_id,
					content: faker.lorem.sentences({ min: 1, max: 2 }),
				})),
			);
		}
	}
}

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
			wagerId: Bet.wager_id,
			outcomeId: Bet.outcome_id,
			amount: Bet.amount,
		})
		.from(Bet)
		.limit(60);

	const betTransactions = seededBets
		.map((bet) => {
			const walletId = walletByUserId.get(bet.userId);
			if (!walletId) return null;

			return {
				wallet_id: walletId,
				wager_id: bet.wagerId,
				outcome_id: bet.outcomeId,
				type: "bet" as const,
				amount: `-${bet.amount}`,
				reference_id: bet.id,
			};
		})
		.filter((row): row is NonNullable<typeof row> => row !== null);

	const payoutTransactions = seededBets
		.slice(0, Math.floor(seededBets.length / 3))
		.map((bet) => {
			const walletId = walletByUserId.get(bet.userId);
			if (!walletId) return null;

			const amount = Number(bet.amount ?? "0");
			return {
				wallet_id: walletId,
				wager_id: bet.wagerId,
				outcome_id: bet.outcomeId,
				type: "payout" as const,
				amount: (amount * faker.number.float({ min: 1.3, max: 2.1, fractionDigits: 2 })).toFixed(2),
				reference_id: bet.id,
			};
		})
		.filter((row): row is NonNullable<typeof row> => row !== null);

	if (betTransactions.length > 0 || payoutTransactions.length > 0) {
		await db.insert(Transaction).values([...betTransactions, ...payoutTransactions]);
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
		await seedVisibilityAndComments({ createdWagers, groups });
		await seedNotifications(users);
		await seedTransactions({ userWallets: wallets.userWallets });

		console.log(`Seed completed successfully. Wagers: ${createdWagers.length}, Users: ${users.length}`);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exitCode = 1;
	} finally {
		await closeConnection();
	}
}

void main();
