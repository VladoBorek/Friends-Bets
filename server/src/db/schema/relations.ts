import { relations } from "drizzle-orm";
import { Role, User } from "./users";
import { Wallet, Transaction } from "./wallet";
import { Group, GroupInvitation, GroupMembership } from "./groups";
import { Friendship } from "./friends";
import { Category, Wager, WagerVisibility, Outcome, Bet, Comment } from "./wagers";
import { Notification } from "./notifications";

export const UserRelations = relations(User, ({ one, many }) => ({
  role: one(Role, { fields: [User.role_id], references: [Role.id] }),
  wallet: one(Wallet),
  memberships: many(GroupMembership),
  created_wagers: many(Wager),
  bets: many(Bet),
  notifications: many(Notification),
  comments: many(Comment),
  wager_invites: many(WagerVisibility),
  sent_friend_requests: many(Friendship, { relationName: "friendship_requester" }),
  received_friend_requests: many(Friendship, { relationName: "friendship_addressee" }),
  sent_group_invitations: many(GroupInvitation, { relationName: "group_invitation_requester" }),
  received_group_invitations: many(GroupInvitation, { relationName: "group_invitation_addressee" }),
}));

export const RoleRelations = relations(Role, ({ many }) => ({
  users: many(User),
}));

export const WalletRelations = relations(Wallet, ({ one, many }) => ({
  user: one(User, { fields: [Wallet.user_id], references: [User.id] }),
  transactions: many(Transaction),
}));

export const TransactionRelations = relations(Transaction, ({ one }) => ({
  wallet: one(Wallet, { fields: [Transaction.wallet_id], references: [Wallet.id] }),
  outcome: one(Outcome, { fields: [Transaction.outcome_id], references: [Outcome.id] }),
}));

export const GroupRelations = relations(Group, ({ many }) => ({
  memberships: many(GroupMembership),
  invitations: many(GroupInvitation),
}));

export const GroupMembershipRelations = relations(GroupMembership, ({ one }) => ({
  user: one(User, { fields: [GroupMembership.user_id], references: [User.id] }),
  group: one(Group, { fields: [GroupMembership.group_id], references: [Group.id] }),
}));

export const GroupInvitationRelations = relations(GroupInvitation, ({ one }) => ({
  group: one(Group, { fields: [GroupInvitation.group_id], references: [Group.id] }),
  requester: one(User, {
    fields: [GroupInvitation.requester_id],
    references: [User.id],
    relationName: "group_invitation_requester",
  }),
  addressee: one(User, {
    fields: [GroupInvitation.addressee_id],
    references: [User.id],
    relationName: "group_invitation_addressee",
  }),
}));

export const FriendshipRelations = relations(Friendship, ({ one }) => ({
  requester: one(User, {
    fields: [Friendship.requester_id],
    references: [User.id],
    relationName: "friendship_requester",
  }),
  addressee: one(User, {
    fields: [Friendship.addressee_id],
    references: [User.id],
    relationName: "friendship_addressee",
  }),
}));

export const CategoryRelations = relations(Category, ({ many }) => ({
  wagers: many(Wager),
}));

export const WagerRelations = relations(Wager, ({ one, many }) => ({
  category: one(Category, { fields: [Wager.category_id], references: [Category.id] }),
  creator: one(User, { fields: [Wager.created_by_id], references: [User.id] }),
  visibilities: many(WagerVisibility),
  outcomes: many(Outcome),
  comments: many(Comment),
}));

export const WagerVisibilityRelations = relations(WagerVisibility, ({ one }) => ({
  wager: one(Wager, { fields: [WagerVisibility.wager_id], references: [Wager.id] }),
  user: one(User, { fields: [WagerVisibility.user_id], references: [User.id] }),
}));

export const OutcomeRelations = relations(Outcome, ({ one, many }) => ({
  wager: one(Wager, { fields: [Outcome.wager_id], references: [Wager.id] }),
  bets: many(Bet),
}));

export const BetRelations = relations(Bet, ({ one }) => ({
  user: one(User, { fields: [Bet.user_id], references: [User.id] }),
  outcome: one(Outcome, { fields: [Bet.outcome_id], references: [Outcome.id] }),
}));

export const CommentRelations = relations(Comment, ({ one }) => ({
  wager: one(Wager, { fields: [Comment.wager_id], references: [Wager.id] }),
  user: one(User, { fields: [Comment.user_id], references: [User.id] }),
}));

export const NotificationRelations = relations(Notification, ({ one }) => ({
  user: one(User, { fields: [Notification.user_id], references: [User.id] }),
}));