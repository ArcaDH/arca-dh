import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  bigint,
  date,
  timestamp,
  unique,
  uniqueIndex,
  index,
  check,
  primaryKey,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations, sql, InferSelectModel, InferInsertModel } from "drizzle-orm";

const money = (name: string) => bigint(name, { mode: "number" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["EXPENSE", "INCOME"]);
export const tagColorEnum = pgEnum("tag_color", [
  "teal",
  "mauve",
  "crimson",
  "midnight",
  "charcoal",
  "amber",
  "orange",
  "emerald",
  "violet",
  "pink",
]);

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
export const budgetPlans = pgTable(
  "budget_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => User.userId, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [index("budget_plans_user_idx").on(table.userId)],
);

export const BudgetPlan = budgetPlans;

// 3. IncomeSources
export const incomeSources = pgTable(
  "income_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    monthlyAmount: money("monthly_amount").notNull(),
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("income_sources_plan_name_unique").on(table.budgetPlanId, table.name),
    check("income_sources_amount_check", sql`${table.monthlyAmount} >= 0`),
  ],
);

export const IncomeSource = incomeSources;

// 4. Categories
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    maxBudget: money("max_budget").notNull(), // per month
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("categories_plan_name_unique").on(table.budgetPlanId, table.name),
    check("categories_max_budget_check", sql`${table.maxBudget} >= 0`),
  ],
);

export const Category = categories;

// 5. Subcategories
export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    limit: money("limit").notNull(), // per month
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("subcategories_category_name_unique").on(table.categoryId, table.name),
    check("subcategories_limit_check", sql`${table.limit} >= 0`),
  ],
);

export const Subcategory = subcategories;

// 6. SavingsGoals
export const savingsGoals = pgTable(
  "savings_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    targetAmount: money("target_amount").notNull(),
    deadline: date("deadline").notNull(),
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
  },
  (table) => [check("savings_goals_target_check", sql`${table.targetAmount} > 0`)],
);

export const SavingsGoal = savingsGoals;

// 7a. RecurringTransactions: the template behind a monthly payment. The backend turns it into
//     ordinary transactions as the months pass.
//     generatedThrough = first day of the last month that already has its transaction.
//     endedAt = set when the user stops the payment; null while it is active.
export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    amount: money("amount").notNull(),
    description: varchar("description", { length: 500 }),
    dayOfMonth: integer("day_of_month").notNull(),
    startDate: date("start_date").notNull(),
    generatedThrough: date("generated_through"),
    endedAt: date("ended_at"),
    tagIds: uuid("tag_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (table) => [
    check("recurring_transactions_amount_check", sql`${table.amount} > 0`),
    check("recurring_transactions_day_check", sql`${table.dayOfMonth} BETWEEN 1 AND 31`),
    index("recurring_transactions_plan_idx").on(table.budgetPlanId),
  ],
);

export const RecurringTransaction = recurringTransactions;

// 7. Transactions
//    INCOME:  may reference an income source. No category, subcategory or savings goal.
//    EXPENSE: may reference a category/subcategory, or a savings goal (money put aside
//             for that goal). Never an income source.
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    amount: money("amount").notNull(), // always positive, expense/income comes from type
    date: date("date").notNull(),
    description: varchar("description", { length: 500 }),
    type: transactionTypeEnum("type").notNull(),
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
    savingsGoalId: uuid("savings_goal_id").references(() => savingsGoals.id, { onDelete: "set null" }),
    incomeSourceId: uuid("income_source_id").references(() => incomeSources.id, { onDelete: "set null" }),
    recurringTransactionId: uuid("recurring_transaction_id").references(() => recurringTransactions.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (table) => [
    check("transactions_amount_check", sql`${table.amount} > 0`),
    check(
      "transactions_type_links_check",
      sql`
        (${table.type} = 'INCOME' AND ${table.categoryId} IS NULL AND ${table.subcategoryId} IS NULL
            AND ${table.savingsGoalId} IS NULL)
        OR (${table.type} = 'EXPENSE' AND ${table.incomeSourceId} IS NULL)
    `,
    ),
    index("transactions_plan_date_idx").on(table.budgetPlanId, table.date),
    index("transactions_category_idx").on(table.categoryId),
    index("transactions_subcategory_idx").on(table.subcategoryId),
    index("transactions_savings_goal_idx").on(table.savingsGoalId),
  ],
);

export const Transaction = transactions;

// 8. Tags: free-form labels a user can put on any transaction (max 5 per transaction, enforced in code)
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 30 }).notNull(),
    color: tagColorEnum("color").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => User.userId, { onDelete: "cascade" }),
  },
  // One tag per name for each user. The service also treats "Food" and "food" as the same name.
  // (An index on lower(name) would be stricter, but drizzle-kit push crashes on it the second time it runs.)
  (table) => [uniqueIndex("tags_user_name_unique").on(table.userId, table.name)],
);

export const Tag = tags;

// 9. TransactionTags: join table, a transaction has many tags and a tag many transactions
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
  (table) => [
    primaryKey({ columns: [table.transactionId, table.tagId] }),
    index("transaction_tags_tag_idx").on(table.tagId),
  ],
);

export const TransactionTag = transactionTags;

// Relations

export const usersRelations = relations(User, ({ one, many }) => ({
  currentPlan: one(budgetPlans, {
    fields: [User.currentPlanId],
    references: [budgetPlans.id],
  }),
  budgetPlans: many(budgetPlans),
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

export const incomeSourcesRelations = relations(incomeSources, ({ one, many }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [incomeSources.budgetPlanId],
    references: [budgetPlans.id],
  }),
  transactions: many(transactions),
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

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one, many }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [recurringTransactions.budgetPlanId],
    references: [budgetPlans.id],
  }),
  category: one(categories, {
    fields: [recurringTransactions.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [recurringTransactions.subcategoryId],
    references: [subcategories.id],
  }),
  transactions: many(transactions),
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

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  recurringTransaction: one(recurringTransactions, {
    fields: [transactions.recurringTransactionId],
    references: [recurringTransactions.id],
  }),
  tags: many(transactionTags),
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
  incomeSource: one(incomeSources, {
    fields: [transactions.incomeSourceId],
    references: [incomeSources.id],
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

export type RecurringTransactionModel = InferSelectModel<typeof recurringTransactions>;
export type NewRecurringTransactionModel = InferInsertModel<typeof recurringTransactions>;

export type TagModel = InferSelectModel<typeof tags>;
export type NewTagModel = InferInsertModel<typeof tags>;
