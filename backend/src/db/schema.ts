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
  check,
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

// User
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

// BudgetPlans
export const budgetPlans = pgTable("budget_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YearMonth formatted as "YYYY-MM"
  userId: integer("user_id")
    .notNull()
    .references(() => User.userId, { onDelete: "cascade" }),
});

export const BudgetPlan = budgetPlans;

// IncomeSources
export const incomeSources = pgTable("income_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  budgetPlanId: uuid("budget_plan_id")
    .notNull()
    .references(() => budgetPlans.id, { onDelete: "cascade" }),
});

export const IncomeSource = incomeSources;

// Categories
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

// Subcategories
// A subcategory is a line money is assigned to. It can exist with no target and nothing assigned.
// `target` is the optional monthly funding goal. The money actually put in each month
// lives per-month in subcategoryAssignments below, not here.
export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    target: numeric("target", { precision: 12, scale: 2 }), // null = no monthly target
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  // A name can be used once per category, so "Rent" can exist under two different categories
  (table) => [unique("subcategories_category_name_unique").on(table.categoryId, table.name)],
);

export const Subcategory = subcategories;

// SubcategoryAssignments: money assigned to a subcategory in one month (YYYY-MM).
// One row per subcategory per month. Absence means nothing assigned that month (treated as 0).
export const subcategoryAssignments = pgTable(
  "subcategory_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    month: varchar("month", { length: 7 }).notNull(), // "YYYY-MM"
    assigned: numeric("assigned", { precision: 12, scale: 2 }).notNull(),
    subcategoryId: uuid("subcategory_id")
      .notNull()
      .references(() => subcategories.id, { onDelete: "cascade" }),
  },
  // At most one assignment per subcategory per month
  (table) => [uniqueIndex("subcategory_assignments_sub_month_unique").on(table.subcategoryId, table.month)],
);

export const SubcategoryAssignment = subcategoryAssignments;

// SavingsGoals
export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  // Both optional: a goal without a deadline is a loose goal, saved toward at its own monthly pace
  deadline: date("deadline"),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  budgetPlanId: uuid("budget_plan_id")
    .notNull()
    .references(() => budgetPlans.id, { onDelete: "cascade" }),
});

export const SavingsGoal = savingsGoals;

// MonthlyPayments: an expense that repeats every month. Its transactions are created automatically.
export const monthlyPayments = pgTable(
  "monthly_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Money out, so negative, like the transactions it creates
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: varchar("description", { length: 500 }),
    dayOfMonth: integer("day_of_month").notNull(), // 1 to 31, the 31st becomes the last day of a shorter month
    // YYYY-MM, the last month that has been handled. Later months are created from here, so a month whose
    // transaction was deleted ("only this month") isn't created again.
    generatedThrough: varchar("generated_through", { length: 7 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    budgetPlanId: uuid("budget_plan_id")
      .notNull()
      .references(() => budgetPlans.id, { onDelete: "cascade" }),
    // Deleting the category stops the payment (a payment without a category can't make a valid expense)
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
  },
  (table) => [check("monthly_payments_day_of_month_range", sql`${table.dayOfMonth} BETWEEN 1 AND 31`)],
);

export const MonthlyPayment = monthlyPayments;

// Transactions
export const transactions = pgTable(
  "transactions",
  {
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
    // The monthly payment that made this transaction, and the month (YYYY-MM) it was made for.
    // Stopping the payment keeps the transaction and only clears the link.
    monthlyPaymentId: uuid("monthly_payment_id").references(() => monthlyPayments.id, { onDelete: "set null" }),
    monthlyPeriod: varchar("monthly_period", { length: 7 }),
  },
  // A payment makes one transaction per month, even if two requests ask at the same moment
  (table) => [uniqueIndex("transactions_monthly_period_unique").on(table.monthlyPaymentId, table.monthlyPeriod)],
);

export const Transaction = transactions;

// Tags (belong to a user, so they can be reused across plans)
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

// Which tags a transaction has (many to many)
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

// Which tags a monthly payment copies onto the transactions it creates
export const monthlyPaymentTags = pgTable(
  "monthly_payment_tags",
  {
    monthlyPaymentId: uuid("monthly_payment_id")
      .notNull()
      .references(() => monthlyPayments.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.monthlyPaymentId, table.tagId] })],
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
  assignments: many(subcategoryAssignments),
}));

export const subcategoryAssignmentsRelations = relations(subcategoryAssignments, ({ one }) => ({
  subcategory: one(subcategories, {
    fields: [subcategoryAssignments.subcategoryId],
    references: [subcategories.id],
  }),
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
  monthlyPayment: one(monthlyPayments, {
    fields: [transactions.monthlyPaymentId],
    references: [monthlyPayments.id],
  }),
}));

export const monthlyPaymentsRelations = relations(monthlyPayments, ({ one, many }) => ({
  budgetPlan: one(budgetPlans, {
    fields: [monthlyPayments.budgetPlanId],
    references: [budgetPlans.id],
  }),
  category: one(categories, {
    fields: [monthlyPayments.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [monthlyPayments.subcategoryId],
    references: [subcategories.id],
  }),
  transactions: many(transactions),
  tags: many(monthlyPaymentTags),
}));

export const monthlyPaymentTagsRelations = relations(monthlyPaymentTags, ({ one }) => ({
  monthlyPayment: one(monthlyPayments, {
    fields: [monthlyPaymentTags.monthlyPaymentId],
    references: [monthlyPayments.id],
  }),
  tag: one(tags, {
    fields: [monthlyPaymentTags.tagId],
    references: [tags.id],
  }),
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

export type SubcategoryAssignmentModel = InferSelectModel<typeof subcategoryAssignments>;
export type NewSubcategoryAssignmentModel = InferInsertModel<typeof subcategoryAssignments>;

export type SavingsGoalModel = InferSelectModel<typeof savingsGoals>;
export type NewSavingsGoalModel = InferInsertModel<typeof savingsGoals>;

export type TransactionModel = InferSelectModel<typeof transactions>;
export type NewTransactionModel = InferInsertModel<typeof transactions>;

export type TagModel = InferSelectModel<typeof tags>;
export type NewTagModel = InferInsertModel<typeof tags>;

export type MonthlyPaymentModel = InferSelectModel<typeof monthlyPayments>;
export type NewMonthlyPaymentModel = InferInsertModel<typeof monthlyPayments>;
