import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  numeric,
  date,
  timestamp,
  unique,
  uniqueIndex,
  primaryKey,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations, sql, InferSelectModel, InferInsertModel } from "drizzle-orm";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["EXPENSE", "SAVING"]);

// Tailwind's built-in color names, so tags don't depend on the app theme
export const TAG_COLORS = [
  "blue",
  "teal",
  "emerald",
  "amber",
  "orange",
  "red",
  "pink",
  "violet",
  "slate",
  "lime",
] as const;
export const tagColorEnum = pgEnum("tag_color", TAG_COLORS);

// Tables

// 1. User (Preserved original columns with added currentPlanId reference)
export const User = pgTable("User", {
  userId: integer("userId").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 60 }).notNull().unique(),
  lastname: varchar("lastname", { length: 60 }).notNull(),
  firstname: varchar("firstname", { length: 60 }).notNull(),
  password: varchar("password", { length: 60 }).notNull(),
  email: varchar("email", { length: 60 }).notNull().unique(),
  currentPlanId: uuid("currentPlanId").references((): AnyPgColumn => budgetPlans.id, {
    onDelete: "set null",
  }),
});

export const users = User;

// 2. BudgetPlans
export const budgetPlans = pgTable("budget_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YearMonth formatted as "YYYY-MM"
  userId: integer("user_id")
    .notNull()
    .references(() => User.userId, { onDelete: "cascade" }),
});

export const BudgetPlan = budgetPlans;

// 3. IncomeSources
export const incomeSources = pgTable("income_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  budgetPlanId: uuid("budget_plan_id")
    .notNull()
    .references(() => budgetPlans.id, { onDelete: "cascade" }),
});

export const IncomeSource = incomeSources;

// 4. Categories
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    maxBudget: numeric("max_budget", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
  },
  // A name can be used once per plan, so two users can both have "Food"
  (table) => [unique("categories_plan_name_unique").on(table.budgetPlanId, table.name)],
);

export const Category = categories;

// 5. Subcategories
export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    limit: numeric("limit", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  // A name can be used once per category, so "Rent" can exist under two different categories
  (table) => [unique("subcategories_category_name_unique").on(table.categoryId, table.name)],
);

export const Subcategory = subcategories;

// 6. SavingsGoals
export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  deadline: date("deadline").notNull(),
  budgetPlanId: uuid("budget_plan_id")
    .notNull()
    .references(() => budgetPlans.id, { onDelete: "cascade" }),
});

export const SavingsGoal = savingsGoals;

// 7. Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: varchar("description", { length: 500 }),
  type: transactionTypeEnum("type").notNull(),
  budgetPlanId: uuid("budget_plan_id")
    .notNull()
    .references(() => budgetPlans.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id").references(() => subcategories.id, {
    onDelete: "set null",
  }),
  savingsGoalId: uuid("savings_goal_id").references(() => savingsGoals.id, {
    onDelete: "set null",
  }),
});

export const Transaction = transactions;

// 8. Tags (belong to a user, so they can be reused across plans)
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 30 }).notNull(),
    color: tagColorEnum("color").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userId: integer("user_id")
      .notNull()
      .references(() => User.userId, { onDelete: "cascade" }),
  },
  // A user can use a name once, whatever the capital letters: "Food" and "food" are the same tag
  (table) => [uniqueIndex("tags_user_name_unique").on(table.userId, sql`lower(${table.name})`)],
);

export const Tag = tags;

// 9. Which tags a transaction has (many to many)
export const transactionTags = pgTable(
  "transaction_tags",
  {
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.transactionId, table.tagId] })],
);

// Relations

export const usersRelations = relations(User, ({ one, many }) => ({
  currentPlan: one(budgetPlans, {
    fields: [User.currentPlanId],
    references: [budgetPlans.id],
  }),
  budgetPlans: many(budgetPlans),
  tags: many(tags),
}));

export const budgetPlansRelations = relations(budgetPlans, ({ one, many }) => ({
  user: one(User, {
    fields: [budgetPlans.userId],
    references: [User.userId],
  }),
  incomeSources: many(incomeSources),
  categories: many(categories),
  savingsGoals: many(savingsGoals),
  transactions: many(transactions),
}));

export const incomeSourcesRelations = relations(incomeSources, ({ one }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [incomeSources.budgetPlanId],
    references: [budgetPlans.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [categories.budgetPlanId],
    references: [budgetPlans.id],
  }),
  subcategories: many(subcategories),
  transactions: many(transactions),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [savingsGoals.budgetPlanId],
    references: [budgetPlans.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [transactions.budgetPlanId],
    references: [budgetPlans.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [transactions.subcategoryId],
    references: [subcategories.id],
  }),
  savingsGoal: one(savingsGoals, {
    fields: [transactions.savingsGoalId],
    references: [savingsGoals.id],
  }),
  tags: many(transactionTags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(User, {
    fields: [tags.userId],
    references: [User.userId],
  }),
  transactions: many(transactionTags),
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id],
  }),
  tag: one(tags, {
    fields: [transactionTags.tagId],
    references: [tags.id],
  }),
}));

// Types

export type UserModel = InferSelectModel<typeof User>;
export type NewUserModel = InferInsertModel<typeof User>;

export type BudgetPlanModel = InferSelectModel<typeof budgetPlans>;
export type NewBudgetPlanModel = InferInsertModel<typeof budgetPlans>;

export type IncomeSourceModel = InferSelectModel<typeof incomeSources>;
export type NewIncomeSourceModel = InferInsertModel<typeof incomeSources>;

export type CategoryModel = InferSelectModel<typeof categories>;
export type NewCategoryModel = InferInsertModel<typeof categories>;

export type SubcategoryModel = InferSelectModel<typeof subcategories>;
export type NewSubcategoryModel = InferInsertModel<typeof subcategories>;

export type SavingsGoalModel = InferSelectModel<typeof savingsGoals>;
export type NewSavingsGoalModel = InferInsertModel<typeof savingsGoals>;

export type TransactionModel = InferSelectModel<typeof transactions>;
export type NewTransactionModel = InferInsertModel<typeof transactions>;

export type TagModel = InferSelectModel<typeof tags>;
export type NewTagModel = InferInsertModel<typeof tags>;
